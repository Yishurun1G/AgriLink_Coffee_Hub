from django.contrib import admin
from .models import Thread, Message, MessageReadReceipt


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ["sender", "body", "created_at"]
    can_delete = False


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ["id", "subject", "created_by", "is_resolved", "updated_at"]
    list_filter = ["is_resolved"]
    search_fields = ["subject", "created_by__username"]
    filter_horizontal = ["participants"]
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["id", "thread", "sender", "is_read", "created_at"]
    list_filter = ["is_read"]
    search_fields = ["body", "sender__username"]


@admin.register(MessageReadReceipt)
class MessageReadReceiptAdmin(admin.ModelAdmin):
    list_display = ["message", "user", "read_at"]