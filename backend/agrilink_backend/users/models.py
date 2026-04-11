# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        MANAGER = "MANAGER", "Manager"
        DEALER = "DEALER", "Dealer"
        CUSTOMER = "CUSTOMER", "Customer"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.username} - {self.role}"

    # Optional: Helper property
    @property
    def is_dealer(self):
        return self.role == self.Role.DEALER

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER