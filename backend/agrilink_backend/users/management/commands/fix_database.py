from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from orders.models import Order
from batches.models import Batch

User = get_user_model()


class Command(BaseCommand):
    help = 'Check and fix database inconsistencies'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database check and fix...'))
        
        # 1. Check and fix user roles
        self.stdout.write('\n=== Checking Users ===')
        users = User.objects.all()
        for user in users:
            self.stdout.write(f'User: {user.username} | Role: {user.role} | Staff: {user.is_staff}')
            
            # Ensure roles are uppercase
            if user.role and user.role != user.role.upper():
                old_role = user.role
                user.role = user.role.upper()
                user.save()
                self.stdout.write(self.style.WARNING(f'  Fixed role: {old_role} -> {user.role}'))
        
        # 1b. List all users by role for verification
        self.stdout.write('\n=== Users by Role ===')
        for role in ['ADMIN', 'MANAGER', 'DEALER', 'CUSTOMER']:
            users_with_role = User.objects.filter(role__iexact=role)
            self.stdout.write(f'{role}s ({users_with_role.count()}):')
            for u in users_with_role:
                self.stdout.write(f'  - {u.username} (id: {u.id})')
        
        # Check for users with unexpected roles
        all_roles = User.objects.values_list('role', flat=True).distinct()
        expected_roles = {'ADMIN', 'MANAGER', 'DEALER', 'CUSTOMER', 'admin', 'manager', 'dealer', 'customer'}
        unexpected = [r for r in all_roles if r and r not in expected_roles]
        if unexpected:
            self.stdout.write(self.style.ERROR(f'Found unexpected roles: {unexpected}'))
        
        # 2. Check orders - find orders where customer is not a CUSTOMER
        self.stdout.write('\n=== Checking Orders ===')
        bad_orders = Order.objects.exclude(customer__role__iexact='CUSTOMER')
        if bad_orders.exists():
            self.stdout.write(self.style.ERROR(f'Found {bad_orders.count()} orders with non-customer users:'))
            for order in bad_orders:
                self.stdout.write(f'  Order #{order.id}: customer={order.customer.username} (role={order.customer.role})')
            
            # Try to find a real customer to reassign
            real_customer = User.objects.filter(role__iexact='CUSTOMER').first()
            if real_customer:
                self.stdout.write(f'\nReassigning bad orders to customer: {real_customer.username}')
                count = bad_orders.update(customer=real_customer)
                self.stdout.write(self.style.SUCCESS(f'  Reassigned {count} orders'))
            else:
                self.stdout.write(self.style.ERROR('  No CUSTOMER users found! Cannot reassign orders.'))
                self.stdout.write(self.style.WARNING('  You need to create a customer user first.'))
        else:
            self.stdout.write(self.style.SUCCESS('All orders have valid customers'))
        
        # 3. Check batches - find batches where dealer is not a DEALER
        self.stdout.write('\n=== Checking Batches ===')
        bad_batches = Batch.objects.exclude(dealer__role__iexact='DEALER')
        if bad_batches.exists():
            self.stdout.write(self.style.ERROR(f'Found {bad_batches.count()} batches with non-dealer users:'))
            for batch in bad_batches:
                self.stdout.write(f'  Batch {str(batch.id)[:8]}: dealer={batch.dealer.username} (role={batch.dealer.role})')
            
            # Try to find a real dealer to reassign
            real_dealer = User.objects.filter(role__iexact='DEALER').first()
            if real_dealer:
                self.stdout.write(f'\nReassigning bad batches to dealer: {real_dealer.username}')
                count = bad_batches.update(dealer=real_dealer)
                self.stdout.write(self.style.SUCCESS(f'  Reassigned {count} batches'))
            else:
                self.stdout.write(self.style.ERROR('  No DEALER users found! Cannot reassign batches.'))
                self.stdout.write(self.style.WARNING('  You need to create a dealer user first.'))
        else:
            self.stdout.write(self.style.SUCCESS('All batches have valid dealers'))
        
        # 4. Summary
        self.stdout.write('\n=== Summary ===')
        self.stdout.write(f'Total users: {User.objects.count()}')
        self.stdout.write(f'  - Admins: {User.objects.filter(role__iexact="ADMIN").count()}')
        self.stdout.write(f'  - Managers: {User.objects.filter(role__iexact="MANAGER").count()}')
        self.stdout.write(f'  - Dealers: {User.objects.filter(role__iexact="DEALER").count()}')
        self.stdout.write(f'  - Customers: {User.objects.filter(role__iexact="CUSTOMER").count()}')
        self.stdout.write(f'Total orders: {Order.objects.count()}')
        self.stdout.write(f'Total batches: {Batch.objects.count()}')
        
        self.stdout.write(self.style.SUCCESS('\nDatabase check complete!'))
