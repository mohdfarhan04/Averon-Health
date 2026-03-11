@echo off
echo.
echo ======================================
echo 🔄 Backend Restart ^& Verification
echo ======================================
echo.

echo 1️⃣  Stopping any running backend processes...
taskkill /F /IM node.exe 2>nul || echo    No running backend found
timeout /t 2 /nobreak >nul

echo.
echo 2️⃣  Checking configuration...
type .env
echo.

echo 3️⃣  Starting backend server...
echo    💡 Server will start in a new window
echo.
start "Averon Health Backend" cmd /k "npm run dev"

echo 4️⃣  Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo 5️⃣  Checking health endpoint...
curl -s http://localhost:3000/api/health
echo.

echo.
echo ======================================
echo ✅ Backend restart complete!
echo ======================================
echo.
echo 📝 Next steps:
echo    1. Open frontend/averon-main.html in your browser
echo    2. Fill out and submit the contact form
echo    3. Check your Google Sheet for the new entry
echo.
echo 💡 Check the new backend window for server logs
echo.
pause
