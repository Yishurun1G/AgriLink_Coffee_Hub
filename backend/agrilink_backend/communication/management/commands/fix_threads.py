from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from communication.models import Thread

User = get_user_model()


class Command(BaseCommand):
    help = 'Check and fix communication threads - remove customers and fix participant counts'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting thread cleanup...'))
        
        # 1. Find threads with customer participants
        self.stdout.write('\n=== Checking for Customer Participants ===')
        customers = User.objects.filter(role__iexact='CUSTOMER')
        threads_with_customers = Thread.objects.filter(participants__in=customers).distinct()
        
        if threads_with_customers.exists():
            self.stdout.write(self.style.ERROR(f'Found {threads_with_customers.count()} threads with customer participants:'))
            for thread in threads_with_customers:
                customer_participants = thread.participants.filter(role__iexact='CUSTOMER')
                self.stdout.write(f'  Thread #{thread.id}: {thread.subject}')
                for customer in customer_participants:
                    self.stdout.write(f'    - Removing customer: {customer.username}')
                    thread.participants.remove(customer)
            self.stdout.write(self.style.SUCCESS(f'  Removed customers from {threads_with_customers.count()} threads'))
        else:
            self.stdout.write(self.style.SUCCESS('No threads with customer participants found'))
        
        # 2. Find threads with more than 2 participants (should be 1-on-1 chats)
        self.stdout.write('\n=== Checking Thread Participant Counts ===')
        all_threads = Thread.objects.all().prefetch_related('participants')
        multi_participant_threads = []
        
        for thread in all_threads:
            participant_count = thread.participants.count()
            if participant_count > 2:
                multi_participant_threads.append((thread, participant_count))
        
        if multi_participant_threads:
            self.stdout.write(self.style.WARNING(f'Found {len(multi_participant_threads)} threads with more than 2 participants:'))
            for thread, count in multi_participant_threads:
                participants = thread.participants.all()
                self.stdout.write(f'  Thread #{thread.id}: {thread.subject} ({count} participants)')
                for p in participants:
                    self.stdout.write(f'    - {p.username} ({p.role})')
                self.stdout.write(self.style.WARNING('    Note: Manual review recommended - keeping all participants for now'))
        else:
            self.stdout.write(self.style.SUCCESS('All threads have 2 or fewer participants'))
        
        # 3. Find threads with only 1 participant (orphaned threads)
        self.stdout.write('\n=== Checking for Orphaned Threads ===')
        orphaned_threads = []
        for thread in all_threads:
            if thread.participants.count() == 1:
                orphaned_threads.append(thread)
        
        if orphaned_threads:
            self.stdout.write(self.style.WARNING(f'Found {len(orphaned_threads)} threads with only 1 participant:'))
            for thread in orphaned_threads:
                participant = thread.participants.first()
                self.stdout.write(f'  Thread #{thread.id}: {thread.subject} (only {participant.username})')
        else:
            self.stdout.write(self.style.SUCCESS('No orphaned threads found'))
        
        # 4. Summary
        self.stdout.write('\n=== Summary ===')
        self.stdout.write(f'Total threads: {Thread.objects.count()}')
        self.stdout.write(f'Total users: {User.objects.count()}')
        self.stdout.write(f'  - Admins: {User.objects.filter(role__iexact="ADMIN").count()}')
        self.stdout.write(f'  - Managers: {User.objects.filter(role__iexact="MANAGER").count()}')
        self.stdout.write(f'  - Dealers: {User.objects.filter(role__iexact="DEALER").count()}')
        self.stdout.write(f'  - Customers: {User.objects.filter(role__iexact="CUSTOMER").count()}')
        
        self.stdout.write(self.style.SUCCESS('\nThread cleanup complete!'))
