from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Thread, Message, MessageReadReceipt

User = get_user_model()


# --- ParticipantSerializer ---
# A small serializer that returns just the basic info about a user
# (id, username, email, role). Used inside threads and messages
# to show who is involved without exposing sensitive data.
class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]


# --- MessageSerializer ---
# Used when reading/displaying messages.
# Includes the full sender info, the message body, attachment,
# whether the current user sent it (is_mine), and who has read it (read_by).
class MessageSerializer(serializers.ModelSerializer):
    sender = ParticipantSerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()
    read_by = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "thread", "sender", "body", "attachment", "is_read", "is_mine", "read_by", "created_at"]
        read_only_fields = ["id", "sender", "is_read", "created_at"]

    # Returns True if the logged-in user is the one who sent this message.
    # The frontend uses this to decide which side of the chat to show the bubble on.
    def get_is_mine(self, obj):
        request = self.context.get("request")
        return request and obj.sender_id == request.user.id

    # Returns a list of usernames who have read this message.
    # Used to show the double-tick (✓✓) on sent messages.
    def get_read_by(self, obj):
        return list(obj.read_receipts.select_related("user").values_list("user__username", flat=True))


# --- MessageCreateSerializer ---
# Used only when sending a new message.
# The user just provides the thread and the message body (and optionally a file).
# The sender is automatically set to whoever is logged in.
# Also validates that the user is actually a participant of the thread
# and that the thread is not already resolved.
class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["thread", "body", "attachment"]

    def validate_thread(self, thread):
        request = self.context["request"]
        if request.user not in thread.participants.all():
            raise serializers.ValidationError("You are not a participant of this thread.")
        if thread.is_resolved:
            raise serializers.ValidationError("This thread is resolved. Reopen it before sending messages.")
        return thread

    def create(self, validated_data):
        validated_data["sender"] = self.context["request"].user
        return super().create(validated_data)


# --- ThreadSerializer ---
# Used when reading/displaying threads (the conversation list and detail view).
# Returns full participant info, who created the thread, the last message preview,
# and how many unread messages the current user has in this thread.
class ThreadSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    created_by = ParticipantSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = ["id", "subject", "created_by", "participants", "batch", "order",
                  "is_resolved", "last_message", "unread_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    # Returns a short preview of the last message in the thread.
    # Shown in the sidebar conversation list.
    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {"body": msg.body[:100], "sender": msg.sender.username, "created_at": msg.created_at}
        return None

    # Counts how many messages in this thread the current user hasn't read yet.
    # Used to show the unread badge number in the sidebar.
    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(read_receipts__user=request.user).count()


# --- ThreadCreateSerializer ---
# Used only when starting a new conversation.
# The user provides a subject, who they want to talk to (participant_ids),
# and the first message to kick off the conversation.
# Only ADMIN, MANAGER, and DEALER roles are allowed as participants.
# After validation, it creates the thread, adds all participants (including the creator),
# and saves the first message automatically.
class ThreadCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, write_only=True, source="participants"
    )
    initial_message = serializers.CharField(write_only=True)

    class Meta:
        model = Thread
        fields = ["subject", "participant_ids", "batch", "order", "initial_message"]

    def validate_participant_ids(self, participants):
        allowed_roles = {"ADMIN", "MANAGER", "DEALER"}
        for user in participants:
            if user.role.upper() not in allowed_roles:
                raise serializers.ValidationError(
                    f"User {user.username} cannot participate in communication threads."
                )
        return participants

    def create(self, validated_data):
        initial_message = validated_data.pop("initial_message")
        participants = validated_data.pop("participants")
        creator = self.context["request"].user
        thread = Thread.objects.create(created_by=creator, **validated_data)
        thread.participants.set([creator, *participants])
        Message.objects.create(thread=thread, sender=creator, body=initial_message)
        return thread
