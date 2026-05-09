from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Set a user\'s role. Usage: python manage.py set_user_role <username> <role>'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user')
        parser.add_argument('role', type=str, help='New role (ADMIN, MANAGER, DEALER, or CUSTOMER)')

    def handle(self, *args, **options):
        username = options['username']
        new_role = options['role'].upper()
        
        # Validate role
        valid_roles = ['ADMIN', 'MANAGER', 'DEALER', 'CUSTOMER']
        if new_role not in valid_roles:
            raise CommandError(f'Invalid role: {new_role}. Must be one of: {", ".join(valid_roles)}')
        
        # Find user
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist')
        
        # Show current state
        self.stdout.write(f'User: {user.username}')
        self.stdout.write(f'  Current role: {user.role}')
        self.stdout.write(f'  New role: {new_role}')
        
        # Update role
        old_role = user.role
        user.role = new_role
        user.save()
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully changed {username}\'s role from {old_role} to {new_role}'))
