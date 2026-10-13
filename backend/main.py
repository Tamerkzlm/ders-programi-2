# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import SolveRequest
from solver import solve
from validators import pre_flight_check
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
import logging
import os
import asyncio

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Küresel değişken olarak tanımlıyoruz, lifespan içinde ayağa kalkacak
executor = None

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

# CORS Ayarları - 5174 Portu ve Yerel Varyasyonlar Listeye Eklendi
default_origins = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:5174,"  # Yeni React portumuz kesinlikle eklendi
    "http://127.0.0.1:5174"
)
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", default_origins)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """UptimeRobot ping endpoint to prevent cold starts."""
    return {"status": "ok", "message": "API is running"}

@app.post("/solve") # response_model kaldırıldı, hata vermesi engellendi
async def solve_timetable(request: SolveRequest):
    """
    OR-Tools CP-SAT algoritmasını çalıştıran uç nokta.
    Ana asenkron döngüyü kilitlememek için ThreadPool içinde koşturulur.
    """
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