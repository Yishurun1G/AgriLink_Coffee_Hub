# reports/management/commands/test_report.py
from django.core.management.base import BaseCommand
from reports.services import ReportGenerator
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Test report generation'

    def handle(self, *args, **options):
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        self.stdout.write(f"Testing report generation from {start_date} to {end_date}")
        
        try:
            generator = ReportGenerator(start_date, end_date)
            
            # Test each report type
            report_types = [
                'SALES',
                'INVENTORY',
                'DEALER_PERFORMANCE',
                'CUSTOMER_ACTIVITY',
                'ORDER_SUMMARY',
                'BATCH_SUMMARY',
                'DELIVERY_PERFORMANCE',
                'REVENUE',
            ]
            
            for report_type in report_types:
                self.stdout.write(f"\nTesting {report_type}...")
                try:
                    data = generator.generate_report(report_type)
                    self.stdout.write(self.style.SUCCESS(f"✓ {report_type} generated successfully"))
                    self.stdout.write(f"  Data keys: {list(data.keys())}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"✗ {report_type} failed: {str(e)}"))
                    import traceback
                    self.stdout.write(traceback.format_exc())
            
            self.stdout.write(self.style.SUCCESS('\nTest completed!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Test failed: {str(e)}'))
            import traceback
            self.stdout.write(traceback.format_exc())
