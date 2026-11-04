@echo off
chcp 65001 >nul
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

:: 1. Git yuklu ise ve internet varsa son guncellemeleri sessizce cek
where git >nul 2>&1
if %errorlevel% equ 0 (
    cd /d "%ROOT_DIR%"
    for /f %%i in ('git rev-parse HEAD 2^>nul') do set "OLD_HEAD=%%i"
    git pull origin main >nul 2>&1
    for /f %%i in ('git rev-parse HEAD 2^>nul') do set "NEW_HEAD=%%i"
    if not "%OLD_HEAD%"=="%NEW_HEAD%" (
        where npm >nul 2>&1
        if %errorlevel% equ 0 (
            cd /d "%ROOT_DIR%\frontend"
            call npm run build >nul 2>&1
        )
        :: Backend guncellendiyse eski arka plan surecini yenilemek icin kapat
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
          "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
    )
)

:: 2. Yerel Cozucu Motor (127.0.0.1:8000) calisiyor mu kontrol et; calismiyorsa gizli baslat
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    if exist "%ROOT_DIR%\ArkaPlan_Cozucu_Baslat.vbs" (
        wscript.exe "%ROOT_DIR%\ArkaPlan_Cozucu_Baslat.vbs"
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
          "Start-Process -FilePath '%ROOT_DIR%\backend\venv\Scripts\python.exe' -ArgumentList '-m uvicorn main:app --host 127.0.0.1 --port 8000' -WorkingDirectory '%ROOT_DIR%\backend' -WindowStyle Hidden"
    )
    timeout /t 2 /nobreak >nul
)

:: 3. Tarayicida uygulamayi ac
start "" "http://127.0.0.1:8000"
exit /b 0
