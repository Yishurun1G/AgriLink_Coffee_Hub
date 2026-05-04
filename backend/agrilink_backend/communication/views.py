from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Thread, Message, MessageReadReceipt
from .serializers import (
    ThreadSerializer, ThreadCreateSerializer,
    MessageSerializer, MessageCreateSerializer,
)


# --- IsParticipant Permission ---
# A custom permission check that makes sure only people who are
# actually part of a thread can view or interact with it.
# Works for both Thread objects and Message objects.
class IsParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Thread):
            return request.user in obj.participants.all()
        if isinstance(obj, Message):
            return request.user in obj.thread.participants.all()
        return False


# --- ThreadViewSet ---
# Handles everything related to conversation threads:
# listing, creating, viewing, resolving, reopening, and fetching messages.
# Only authenticated users can access threads, and only participants can see a specific thread.
class ThreadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsParticipant]

    # Only return threads where the logged-in user is a participant.
    # Also pre-loads related data (participants, messages, etc.) to avoid extra DB queries.
    def get_queryset(self):
        return (
            Thread.objects.filter(participants=self.request.user)
            .prefetch_related("participants", "messages")
            .select_related("created_by", "batch", "order")
        )

    # Use a different serializer depending on the action:
    # ThreadCreateSerializer for creating, ThreadSerializer for everything else.
    def get_serializer_class(self):
        if self.action == "create":
            return ThreadCreateSerializer
        return ThreadSerializer

    # Create a new thread and return the full thread data (with participants, etc.)
    # so the frontend can immediately display it without a second request.
    def create(self, request, *args, **kwargs):
        serializer = ThreadCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        thread = serializer.save()
        return Response(
            ThreadSerializer(thread, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    # Mark a thread as resolved (closed). Can't resolve an already resolved thread.
    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        thread = self.get_object()
        if thread.is_resolved:
            return Response({"detail": "Thread is already resolved."}, status=status.HTTP_400_BAD_REQUEST)
        thread.is_resolved = True
        thread.save(update_fields=["is_resolved"])
        return Response({"detail": "Thread marked as resolved."})

    # Reopen a resolved thread so messages can be sent again.
    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        thread = self.get_object()
        if not thread.is_resolved:
            return Response({"detail": "Thread is not resolved."}, status=status.HTTP_400_BAD_REQUEST)
        thread.is_resolved = False
        thread.save(update_fields=["is_resolved"])
        return Response({"detail": "Thread reopened."})

    # Fetch all messages in a thread and automatically mark unread ones as read
    # for the current user (creates read receipts in bulk for efficiency).
    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        thread = self.get_object()
        msgs = thread.messages.select_related("sender").all()
        serializer = MessageSerializer(msgs, many=True, context={"request": request})
        unread_ids = [
            m.id for m in msgs
            if m.sender_id != request.user.id
            and not m.read_receipts.filter(user=request.user).exists()
        ]
        receipts = [MessageReadReceipt(message_id=mid, user=request.user) for mid in unread_ids]
        MessageReadReceipt.objects.bulk_create(receipts, ignore_conflicts=True)
        return Response(serializer.data)


# --- MessageViewSet ---
# Handles sending, reading, and deleting individual messages.
# Only supports GET, POST, and DELETE (no editing messages).
# Users can only see messages from threads they are part of.
class MessageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    # Only return messages from threads the logged-in user is a participant of.
    def get_queryset(self):
        return Message.objects.filter(
            thread__participants=self.request.user
        ).select_related("sender", "thread")

    # Use MessageCreateSerializer when sending, MessageSerializer when reading.
    def get_serializer_class(self):
        if self.action == "create":
            return MessageCreateSerializer
        return MessageSerializer

    # After saving the message, also update the thread's updated_at timestamp
    # so it bubbles to the top of the conversation list.
    def perform_create(self, serializer):
        serializer.save()
        serializer.instance.thread.save(update_fields=["updated_at"])

    # Send a new message and return the full message data (with sender info, is_mine, etc.)
    # so the frontend can immediately render it in the correct position.
    def create(self, request, *args, **kwargs):
        serializer = MessageCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # return full MessageSerializer so frontend gets is_mine, sender, etc.
        return Response(
            MessageSerializer(serializer.instance, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    # Delete a message — only the person who sent it can delete it.
    def destroy(self, request, *args, **kwargs):
        message = self.get_object()
        if message.sender != request.user:
            return Response({"detail": "You can only delete your own messages."}, status=status.HTTP_403_FORBIDDEN)
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # Mark a single message as read for the current user.
    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        MessageReadReceipt.objects.get_or_create(message=message, user=request.user)
        return Response({"detail": "Marked as read."})
