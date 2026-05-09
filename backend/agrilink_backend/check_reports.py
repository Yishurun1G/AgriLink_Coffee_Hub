#!/usr/bin/env python
"""Quick check to see if reports module is set up correctly"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

print("="*60)
print("REPORTS MODULE CHECK")
print("="*60)

# Check 1: Can we import the models?
try:
    from reports.models import Report, ReportSchedule
    print("✓ Models imported successfully")
except Exception as e:
    print(f"✗ Failed to import models: {e}")
    sys.exit(1)

# Check 2: Can we query the database?
try:
    count = Report.objects.count()
    print(f"✓ Database query successful (found {count} reports)")
except Exception as e:
    print(f"✗ Database query failed: {e}")
    print("\n  This usually means migrations haven't been run.")
    print("  Run: python manage.py migrate reports")
    sys.exit(1)

# Check 3: Check for admin/manager users
try:
    from users.models import User
    admins = User.objects.filter(role='ADMIN').count()
    managers = User.objects.filter(role='MANAGER').count()
    print(f"✓ Found {admins} admins and {managers} managers")
    
    if admins == 0 and managers == 0:
        print("  ⚠ Warning: No admin or manager users found!")
        print("  You need at least one to create reports.")
except Exception as e:
    print(f"✗ User check failed: {e}")

# Check 4: Try to create a test report
try:
    from datetime import date, timedelta
    from reports.services import ReportGenerator
    
    user = User.objects.filter(role__in=['ADMIN', 'MANAGER']).first()
    if user:
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        # Just test the generator, don't save
        generator = ReportGenerator(start_date, end_date)
        data = generator.generate_report('SALES')
        
        print("✓ Report generation test successful")
    else:
        print("  ⚠ Skipping report generation test (no admin/manager user)")
except Exception as e:
    print(f"✗ Report generation test failed: {e}")
    import traceback
    print(traceback.format_exc())

print("\n" + "="*60)
print("CHECK COMPLETE")
print("="*60)
print("\nIf all checks passed, the reports module should work.")
print("If you see errors, follow the suggestions above.\n")
