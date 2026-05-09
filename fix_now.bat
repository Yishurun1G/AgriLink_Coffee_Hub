@echo off
echo ============================================================
echo FIXING REPORTS MODULE
echo ============================================================
echo.

cd backend\agrilink_backend

echo Step 1: Making migrations...
python manage.py makemigrations reports
echo.

echo Step 2: Applying migrations...
python manage.py migrate reports
echo.

echo Step 3: Checking status...
python check_reports.py
echo.

echo ============================================================
echo DONE!
echo ============================================================
echo.
echo Now:
echo 1. Restart your Django server (Ctrl+C then python manage.py runserver)
echo 2. Try creating a report from the frontend
echo.
pause
