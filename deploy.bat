@echo off
echo ============================================================
echo   Palliativteam VPS Deployment Script (Optimiert)
echo ============================================================
echo.

:: 1. Archive creation to avoid multiple SSH connections
echo Erstelle lokales Upload-Archiv der Dateien...
tar --exclude=node_modules --exclude=dist --exclude=.git -czf deploy.tar.gz backend frontend docker-compose.prod.yml
echo Archiv erstellt.

echo.
echo ============================================================
echo SCHRITT 1: Server-Verbindung und Upload
echo ============================================================
echo Bitte gib JETZT dein Server-Passwort (DanielaVeit25?) ein.
echo (Das Passwort wird nur noch fuer 3-4 grosse Schritte abgefragt, statt 50 Mal!)
echo.

ssh root@72.61.80.21 "mkdir -p /opt/palliativteam"
scp "%~dp0deploy.tar.gz" root@72.61.80.21:/opt/palliativteam/

echo.
echo ============================================================
echo SCHRITT 2: Docker installieren (falls noetig)
echo ============================================================
ssh root@72.61.80.21 "if command -v docker >/dev/null 2>&1; then echo 'Docker ist bereits bereit.'; else echo 'Installiere Docker...'; curl -fsSL https://get.docker.com | sh; fi"

echo.
echo ============================================================
echo SCHRITT 3: Entpacken, Docker Build und Start
echo ============================================================
ssh root@72.61.80.21 "cd /opt/palliativteam && tar -xzf deploy.tar.gz && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d --build"

echo.
echo ============================================================
echo SCHRITT 4: Datenbank-Wiederherstellung einrichten
echo ============================================================
echo Warte 10 Sekunden auf den Container-Start...
timeout /t 10 >nul

:: Copy DB into the running backend container and restart it to apply
ssh root@72.61.80.21 "docker cp /opt/palliativteam/backend/prisma/dev.db palliativ_backend:/data/dev.db && docker restart palliativ_backend"

echo.
echo ============================================================
echo SCHRITT 5: Verifizierung und Aufraeumen
echo ============================================================
del "%~dp0deploy.tar.gz"
timeout /t 5 >nul
ssh root@72.61.80.21 "curl -s http://localhost/api/health"

echo.
echo.
echo ============================================================
echo   DEPLOYMENT ABGESCHLOSSEN!
echo   Die App ist erreichbar unter: http://72.61.80.21
echo ============================================================
echo.
pause
