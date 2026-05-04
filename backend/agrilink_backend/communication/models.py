from django.db import models
from django.conf import settings


# --- Thread Model ---
# A Thread is like a chat room. It has a subject (topic), the person who created it,
# and a list of participants (people who can read and send messages in it).
# It can optionally be linked to a Batch or an Order for context.
# Once a thread is resolved, no new messages can be sent until it's reopened.
# Threads are sorted by most recently updated first.
class Thread(models.Model):
    subject = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="created_threads",
        on_delete=models.CASCADE,
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="threads",
    )
    batch = models.ForeignKey(
        "batches.Batch",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="threads",
    )
    order = models.ForeignKey(
        "orders.Order",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="threads",
    )
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Thread({self.id}): {self.subject}"


# --- Message Model ---
# A Message is a single chat bubble inside a Thread.
# It stores who sent it, the text content, an optional file attachment,
# and whether it has been read. Messages are sorted oldest to newest.
class Message(models.Model):
    thread = models.ForeignKey(Thread, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sent_messages",
        on_delete=models.CASCADE,
    )
    body = models.TextField()
    attachment = models.FileField(upload_to="communication/attachments/", null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message({self.id}) in Thread({self.thread_id}) by {self.sender}"


# --- MessageReadReceipt Model ---
# Tracks exactly which users have read which messages.
# Each record means "this user has seen this message".
# The unique_together rule prevents duplicate receipts for the same user + message.
class MessageReadReceipt(models.Model):
    message = models.ForeignKey(Message, related_name="read_receipts", on_delete=models.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="read_receipts",
        on_delete=models.CASCADE,
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user")
