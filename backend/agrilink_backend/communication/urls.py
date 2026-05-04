from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThreadViewSet, MessageViewSet

# --- URL Router ---
# Registers the two main viewsets with the DRF router.
# This automatically creates all the standard REST endpoints:
#   GET/POST   /communication/threads/           → list or create threads
#   GET/PUT/DELETE /communication/threads/<id>/  → view, update, delete a thread
#   POST       /communication/threads/<id>/resolve/  → mark thread as resolved
#   POST       /communication/threads/<id>/reopen/   → reopen a resolved thread
#   GET        /communication/threads/<id>/messages/ → get all messages in a thread
#   GET/POST   /communication/messages/          → list or send messages
#   DELETE     /communication/messages/<id>/     → delete a message
#   POST       /communication/messages/<id>/mark_read/ → mark a message as read
router = DefaultRouter()
router.register(r'threads', ThreadViewSet, basename='thread')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
]
