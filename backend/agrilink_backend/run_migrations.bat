@echo off
echo Running migrations for reports module...
echo.

python manage.py makemigrations reports
python manage.py migrate reports

echo.
echo Done! Now restart your Django server and try creating a report.
pause
