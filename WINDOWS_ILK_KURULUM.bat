@echo off
chcp 65001 >nul
title Okul Ders Programi - Tek Seferlik Tam Otomatik Kurulum
color 0A

echo ============================================================================
echo   OKUL YONETIM VE DERS PROGRAMI PLATFORMU - WINDOWS KURULUM SIHIRBAZI
echo   (Yerel Tam Guc CPU Cozucu + Otomatik Baslangic + Masaustu Kisayolu)
echo ============================================================================
echo.

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

:: 1. Python Kontrolu
echo [1/5] Python kontrol ediliyor...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [HATA] Bu bilgisayarda Python bulunamadi!
    echo Lutfen https://www.python.org/downloads/ adresinden Python 3.11+ indirip
    echo kurulumda "Add Python to PATH" kutucugunu isaretleyerek kurun.
    pause
    exit /b 1
)

:: 2. Backend Sanal Ortam (venv) ve OR-Tools CP-SAT Kurulumu
echo.
echo [2/5] Yerel Cok Cekirdekli Cozucu Motor (OR-Tools CP-SAT) kuruluyor...
cd /d "%ROOT_DIR%\backend"
if not exist "venv\Scripts\python.exe" (
    python -m venv venv
)
call venv\Scripts\python.exe -m pip install --upgrade pip
call venv\Scripts\pip.exe install -r requirements.txt
if %errorlevel% neq 0 (
    color 0C
    echo [HATA] Python paketleri kurulurken bir sorun olustu. Internet baglantinizi kontrol edin.
    pause
    exit /b 1
)

:: 3. Frontend Derlemesi (Node.js yuklu ise yerel arayuzu de derle)
echo.
echo [3/5] Arayuz (Frontend) hazirlaniyor...
cd /d "%ROOT_DIR%\frontend"
where npm >nul 2>&1
if %errorlevel% equ 0 (
    call npm install
    call npm run build
) else (
    echo [BILGI] Node.js bulunamadi; yerel motor Netlify uzerinden veya mevcut derleme ile calisacak.
)

:: 4. Windows Acilisinda (Startup) Gizli Arka Plan Servisi Olusturma
echo.
echo [4/5] Bilgisayar her acildiginda otomatik baslama (Startup) ayarlanıyor...
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_STARTUP=%STARTUP_DIR%\Okul_Ders_Programi_Cozucu.vbs"
set "VBS_LOCAL=%ROOT_DIR%\ArkaPlan_Cozucu_Baslat.vbs"

(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%ROOT_DIR%\backend"
echo WshShell.Run """%ROOT_DIR%\backend\venv\Scripts\python.exe"" -m uvicorn main:app --host 127.0.0.1 --port 8000", 0, False
) > "%VBS_LOCAL%"

copy /Y "%VBS_LOCAL%" "%VBS_STARTUP%" >nul

:: 5. Masaustune "Okul Ders Programi" Kisayolu Olusturma
echo.
echo [5/5] Masaustune "Okul Ders Programi" kisayolu olusturuluyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); ^
   $s = (New-Object -COM WScript.Shell).CreateShortcut((Join-Path $desktop 'Okul Ders Programi.lnk')); ^
   $s.TargetPath = '%ROOT_DIR%\WINDOWS_BASLAT.bat'; ^
   $s.WorkingDirectory = '%ROOT_DIR%'; ^
   $s.IconLocation = 'shell32.dll,14'; ^
   $s.WindowStyle = 7; ^
   $s.Description = 'Okul Ders Programi (Tam Guc Yerel CPU)'; ^
   $s.Save()"

echo.
echo ============================================================================
echo   KURULUM BASARIYLA TAMAMLANDI!
echo   1. Masaustune "Okul Ders Programi" simgesi eklendi.
echo   2. Bilgisayar her kapatilip acildiginda yerel CPU cozucu motoru
echo      (siyah ekran acilmadan) arka planda otomatik baslayacaktir.
echo ============================================================================
echo.
echo Simdi program baslatiliyor...
call "%ROOT_DIR%\WINDOWS_BASLAT.bat"
pause
