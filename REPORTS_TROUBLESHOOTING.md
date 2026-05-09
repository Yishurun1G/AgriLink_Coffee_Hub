# Reports Module Troubleshooting Guide

## Issue: "Failed to create report"

### Step 1: Check Database Migrations

Run these commands to ensure the reports tables are created:

```bash
cd backend/agrilink_backend
python manage.py makemigrations reports
python manage.py migrate reports
```

Expected output:
```
Operations to perform:
  Apply all migrations: reports
Running migrations:
  Applying reports.0001_initial... OK
```

### Step 2: Test Report Generation

Run the test command to verify report generation works:

```bash
python manage.py test_report
```

This will test all 8 report types and show which ones work and which fail.

### Step 3: Check User Permissions

Make sure you're logged in as a **Manager** or **Admin**. Only these roles can create reports.

To check your user role:
1. Open browser console (F12)
2. Type: `localStorage.getItem('access_token')`
3. Decode the JWT token at https://jwt.io
4. Check the `role` field

### Step 4: Check Backend Logs

Look at the Django console output for detailed error messages. The error will show:
- The exact exception that occurred
- Full stack trace
- Which report type failed

### Step 5: Common Issues and Solutions

#### Issue: "No module named 'reports'"
**Solution:** Make sure 'reports' is in INSTALLED_APPS in settings.py

```python
INSTALLED_APPS = [
    ...
    'reports',
]
```

#### Issue: "relation 'reports_report' does not exist"
**Solution:** Run migrations:
```bash
python manage.py migrate reports
```

#### Issue: "Permission denied"
**Solution:** Make sure you're logged in as Manager or Admin

#### Issue: "Invalid date format"
**Solution:** Dates should be in YYYY-MM-DD format (e.g., "2024-01-01")

#### Issue: "Report generates but shows as FAILED"
**Solution:** Check the error_message field in the report. The backend logs will show the full error.

### Step 6: Check API Endpoint

Test the API directly using curl or Postman:

```bash
# Get report types
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://127.0.0.1:8000/api/v1/reports/types/

# Create a report
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Report",
    "report_type": "SALES",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }' \
  http://127.0.0.1:8000/api/v1/reports/
```

### Step 7: Check Frontend Console

Open browser console (F12) and look for:
- Network errors (check the Network tab)
- Console errors (check the Console tab)
- API response details

The improved error handling will now show:
- Full error response from backend
- HTTP status code
- Detailed error message

### Step 8: Verify Data Exists

Reports need data to generate. Make sure you have:
- At least one batch in the system
- At least one order in the system
- Data within the date range you're querying

To check:
```bash
python manage.py shell
```

```python
from batches.models import Batch
from orders.models import Order
from datetime import date, timedelta

end_date = date.today()
start_date = end_date - timedelta(days=30)

print(f"Batches in range: {Batch.objects.filter(created_at__date__gte=start_date).count()}")
print(f"Orders in range: {Order.objects.filter(created_at__date__gte=start_date).count()}")
```

### Step 9: Check for Missing Dependencies

Make sure all required models are imported correctly:

```bash
python manage.py shell
```

```python
# Test imports
from reports.models import Report, ReportSchedule
from reports.services import ReportGenerator
from reports.serializers import ReportSerializer
from reports.views import ReportViewSet

print("All imports successful!")
```

### Step 10: Enable Debug Mode

In `settings.py`, make sure DEBUG is True:

```python
DEBUG = True
```

This will show detailed error pages.

## Quick Fix Checklist

- [ ] Migrations run (`python manage.py migrate reports`)
- [ ] User is Manager or Admin
- [ ] Backend server is running
- [ ] Frontend can reach backend (check Network tab)
- [ ] Date format is correct (YYYY-MM-DD)
- [ ] Data exists in the date range
- [ ] 'reports' in INSTALLED_APPS
- [ ] No console errors in browser
- [ ] Backend logs show no errors

## Still Having Issues?

1. **Check the browser console** - Press F12 and look at Console and Network tabs
2. **Check the Django console** - Look at the terminal where you ran `python manage.py runserver`
3. **Run the test command** - `python manage.py test_report`
4. **Check the database** - Make sure the reports_report table exists

## Getting More Help

If you're still stuck, provide:
1. The exact error message from the browser console
2. The Django console output
3. Output from `python manage.py test_report`
4. Your user role (Manager/Admin/etc.)
5. Whether migrations were run successfully
