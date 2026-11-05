# backend/main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from models import SolveRequest
from solver import solve, get_live_progress, detect_workers, request_stop_solver
from validators import pre_flight_check
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import logging
import os
import asyncio

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Küresel değişken olarak tanımlıyoruz, lifespan içinde ayağa kalkacak
executor = None
# Render 512MB RAM ortamında OOM Killer çöküşünü önleyen eşzamanlılık kilidi
solver_lock = asyncio.Lock()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Modern Ömür Döngüsü (Lifespan).
    Uygulama başlarken çalışır, kapanırken temizlik yapar.
    """
    global executor
    logger.info("Uygulama başlatılıyor. ThreadPoolExecutor (4 Workers) aktif ediliyor.")
    executor = ThreadPoolExecutor(max_workers=4)
    
    yield  # Uygulama burada çalışmaya devam eder
    
    logger.info("Uygulama kapatılıyor. ThreadPoolExecutor temiz bir şekilde sonlandırılıyor.")
    executor.shutdown(wait=True)

# FastAPI uygulamasını lifespan ile başlatıyoruz
app = FastAPI(title="Ders Programı API", lifespan=lifespan)

# CORS Ayarları - Yerel geliştirme + Yerel Tam Güç + Netlify / Vercel bulut dağıtımı desteği
default_origins = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:5174,"
    "http://127.0.0.1:5174,"
    "http://localhost:8000,"
    "http://127.0.0.1:8000"
)
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", default_origins)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*\.(netlify\.app|vercel\.app|onrender\.com)|http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False if "*" in allowed_origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def allow_private_network_middleware(request: Request, call_next):
    """Chrome/Edge Private Network Access (Netlify HTTPS -> 127.0.0.1 HTTP) izni."""
    if request.method == "OPTIONS" and request.headers.get("access-control-request-private-network") == "true":
        response = await call_next(request)
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response
    response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
IS_RENDER = os.environ.get("RENDER") == "true" or os.environ.get("RENDER_SERVICE_ID") is not None


@app.get("/health")
def health_check():
    """UptimeRobot, Frontend Pre-Warm ve Yerel Motor Algılama uç noktası."""
    return {
        "status": "ok",
        "busy": solver_lock.locked(),
        "isLocal": not IS_RENDER,
        "workers": detect_workers(),
        "message": "API is running",
    }

@app.get("/solve/progress")
def solve_progress():
    """Çözüm esnasında anlık ilerleme, bulunan çözüm sayısı ve pencere düşüşünü döndürür."""
    return get_live_progress()

@app.api_route("/solve/stop", methods=["GET", "POST"])
def stop_solving():
    """
    Kullanıcının devam eden optimizasyonu sonlandırıp son geçerli çözümü almasını sağlar.
    15 dakikalık motor çalışırken yeni iyileştirme gelmediğinde erken bitirme imkanı sunar.
    """
    stopped = request_stop_solver()
    return {
        "status": "ok",
        "stopped": stopped,
        "message": "Durdurma sinyali çözücü motoruna iletildi. Son geçerli çözüm mühürleniyor."
    }

@app.post("/solve") # response_model kaldırıldı, hata vermesi engellendi
async def solve_timetable(request: SolveRequest):
    """
    OR-Tools CP-SAT algoritmasını çalıştıran uç nokta.
    Bellek aşımını önlemek için tekil kilit ve ThreadPool içinde koşturulur.
    """
    if solver_lock.locked():
        logger.warning("Eşzamanlı solve isteği reddedildi (429: Sunucu meşgul).")
        raise HTTPException(
            status_code=429,
            detail="Sunucu şu anda başka bir okul programını optimize ediyor. Lütfen birkaç saniye sonra tekrar deneyin."
        )

    async with solver_lock:
        try:
            logger.info("Solve isteği alındı. Ön kontroller başlatılıyor...")
            
            # Faz 1: Ön kontrol katmanı çalışıyor
            pre_flight_check(request)
            
            logger.info("Ön kontroller başarılı. İşlem ThreadPool'a aktarılıyor.")
            
            # Aktif çalışan event loop'u yakala
            loop = asyncio.get_running_loop()
            
            # solve fonksiyonunu thread pool içinde asenkron olarak çalıştır ve await et
            result = await loop.run_in_executor(executor, solve, request)
            
            logger.info("Ders programı başarıyla oluşturuldu ve sonuç dönülüyor.")
            return result

        except HTTPException as he:
            # Validasyondan gelen 400 vb. hataları doğrudan fırlatıyoruz
            raise he
        except Exception as e:
            logger.error(f"Error during timetable solving: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


# 🖥️ YEREL TEK SUNUCU MODU: Derlenmiş frontend/dist mevcutsa doğrudan 127.0.0.1:8000 üzerinden sun
if not IS_RENDER and (FRONTEND_DIST / "index.html").is_file():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        candidate = (FRONTEND_DIST / full_path).resolve()
        if full_path and candidate.is_file() and str(candidate).startswith(str(FRONTEND_DIST)):
            return FileResponse(str(candidate))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    def root_health():
        return health_check()
