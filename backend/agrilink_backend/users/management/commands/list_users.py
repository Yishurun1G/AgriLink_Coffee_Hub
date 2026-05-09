from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'List all users with their roles and IDs'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== All Users in Database ===\n'))
        
        users = User.objects.all().order_by('role', 'username')
        
        if not users.exists():
            self.stdout.write(self.style.ERROR('No users found in database!'))
            return
        
        # Group by role
        roles = {}
        for user in users:
            role = user.role if user.role else 'NO_ROLE'
            if role not in roles:
                roles[role] = []
            roles[role].append(user)
        
        # Display by role
        for role, users_list in sorted(roles.items()):
            self.stdout.write(self.style.WARNING(f'\n{role} ({len(users_list)} users):'))
            for user in users_list:
                self.stdout.write(
                    f'  ID: {user.id:3d} | Username: {user.username:20s} | '
                    f'Email: {user.email:30s} | Staff: {user.is_staff}'
                )
        
        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n=== Total: {User.objects.count()} users ==='))
        
        # Check for potential issues
        self.stdout.write(self.style.WARNING('\n=== Potential Issues ==='))
        
        # Users with lowercase roles
        lowercase_roles = User.objects.exclude(
            role__in=['ADMIN', 'MANAGER', 'DEALER', 'CUSTOMER']
        ).exclude(role__isnull=True).exclude(role='')
        
        if lowercase_roles.exists():
            self.stdout.write(self.style.ERROR(f'Found {lowercase_roles.count()} users with non-uppercase roles:'))
            for user in lowercase_roles:
                self.stdout.write(f'  - {user.username}: role="{user.role}"')
        else:
            self.stdout.write(self.style.SUCCESS('All roles are properly uppercase'))
        
        # Users with no role
        no_role = User.objects.filter(role__isnull=True) | User.objects.filter(role='')
        if no_role.exists():
            self.stdout.write(self.style.ERROR(f'Found {no_role.count()} users with no role:'))
            for user in no_role:
                self.stdout.write(f'  - {user.username}')
        else:
            self.stdout.write(self.style.SUCCESS('All users have roles assigned'))
