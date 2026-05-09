# Reports Module Fix Guide

## Issue Summary
The reports module is experiencing a TypeError when creating reports. This is likely due to:
1. Database migrations not being applied
2. Date format handling issues
3. Missing database tables

## Solution Steps

### Step 1: Apply Database Migrations

Run these commands in your backend directory:

```bash
cd backend/agrilink_backend

# Create migrations if needed
python manage.py makemigrations reports

# Apply migrations
python manage.py migrate reports

# Verify migrations
python manage.py showmigrations reports
```

Expected output:
```
reports
 [X] 0001_initial
```

### Step 2: Verify Database Tables

Check if the tables were created:

```bash
python manage.py dbshell
```

Then in the database shell:
```sql
-- For SQLite
.tables

-- For PostgreSQL
\dt

-- Check if reports_report table exists
SELECT * FROM reports_report LIMIT 1;
```

### Step 3: Test Report Creation

Use the management command to test:

```bash
python manage.py test_report
```

This will:
- Check if you're logged in as a manager/admin
- Create a test sales report
- Display the results

### Step 4: Check User Role

Make sure your logged-in user has the correct role:

```bash
python manage.py shell
```

```python
from users.models import User

# Check your user
user = User.objects.get(username='your_username')
print(f"Role: {user.role}")
print(f"Is Admin: {user.is_admin}")

# If needed, update role
user.role = 'ADMIN'  # or 'MANAGER'
user.save()
```

### Step 5: Test from Frontend

1. Make sure you're logged in as Admin or Manager
2. Navigate to Reports page
3. Try creating a report with:
   - Title: "Test Sales Report"
   - Type: "Sales Report"
   - Start Date: 2024-01-01
   - End Date: 2024-12-31

### Step 6: Check Django Console Logs

When you create a report, watch the Django console for detailed logs:

```
[REPORT CREATE] User: admin, Role: ADMIN
[REPORT CREATE] Report created: 1, Type: SALES
[REPORT CREATE] Date range: 2024-01-01 to 2024-12-31
[REPORT CREATE] Generating report data...
[REPORT CREATE] Report 1 completed successfully
```

If you see errors, they will be logged with full traceback.

## Common Issues and Solutions

### Issue 1: "no such table: reports_report"
**Solution**: Run migrations (Step 1)

### Issue 2: "Permission denied"
**Solution**: Check user role (Step 4)

### Issue 3: "TypeError: ... is not JSON serializable"
**Solution**: This has been fixed in the updated code. Make sure you have the latest version.

### Issue 4: "Invalid date format"
**Solution**: The serializer now handles date parsing automatically. Use YYYY-MM-DD format.

## Code Changes Made

### 1. Enhanced Error Logging (views.py)
- Added detailed logging at each step
- Better error messages
- Full traceback capture

### 2. Date Parsing (serializers.py)
- Automatic string-to-date conversion
- Validation of date formats
- Better error messages

### 3. Robust Date Handling (services.py)
- Handles both string and date objects
- Clear error messages for invalid types
- Consistent date parsing

## Testing Checklist

- [ ] Migrations applied successfully
- [ ] Database tables exist
- [ ] User has ADMIN or MANAGER role
- [ ] Can create report from frontend
- [ ] Report data is generated correctly
- [ ] Can view report details
- [ ] Can regenerate reports
- [ ] Can delete reports

## API Endpoints

All endpoints are under `/api/v1/reports/`:

- `GET /api/v1/reports/list/` - List all reports
- `POST /api/v1/reports/list/` - Create new report
- `GET /api/v1/reports/list/{id}/` - Get report details
- `DELETE /api/v1/reports/list/{id}/` - Delete report
- `POST /api/v1/reports/list/{id}/regenerate/` - Regenerate report
- `GET /api/v1/reports/types/` - Get available report types
- `POST /api/v1/reports/quick/` - Generate quick report (not saved)

## Need More Help?

If the issue persists:

1. Share the full Django console output when creating a report
2. Share the browser console output (F12 → Console tab)
3. Run: `python manage.py check` and share any errors
4. Verify Django REST Framework is installed: `pip list | grep djangorestframework`

## Quick Fix Script

Create a file `fix_reports.sh`:

```bash
#!/bin/bash
cd backend/agrilink_backend
python manage.py makemigrations reports
python manage.py migrate reports
python manage.py test_report
echo "Reports module fixed! Try creating a report now."
```

Make it executable and run:
```bash
chmod +x fix_reports.sh
./fix_reports.sh
```
