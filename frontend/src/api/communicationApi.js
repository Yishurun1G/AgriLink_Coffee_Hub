// --- Communication API ---
// This file contains all the functions that talk to the backend
// for the messaging/communication feature. Each function makes
// an HTTP request and returns the response data.
import api from './axios';

// Fetch all users the current user is allowed to message.
// The backend already filters by role, so this just returns whoever is available.
export const getAvailableUsers = () =>
  api.get('users/').then((r) => r.data.results ?? r.data);

// Fetch all conversation threads the current user is part of.
export const getThreads = () =>
  api.get('communication/threads/').then((r) => r.data);

// Fetch a single thread by its ID (used after creating a thread to get full data).
export const getThread = (id) =>
  api.get(`communication/threads/${id}/`).then((r) => r.data);

// Start a new conversation thread.
// Payload should include: subject, participant_ids (array), and initial_message.
export const createThread = (payload) =>
  api.post('communication/threads/', payload).then((r) => r.data);

// Mark a thread as resolved (closed — no more messages until reopened).
export const resolveThread = (id) =>
  api.post(`communication/threads/${id}/resolve/`).then((r) => r.data);

// Reopen a resolved thread so messages can be sent again.
export const reopenThread = (id) =>
  api.post(`communication/threads/${id}/reopen/`).then((r) => r.data);

// Fetch all messages inside a specific thread.
// Also automatically marks unread messages as read on the backend.
export const getMessages = (threadId) =>
  api.get(`communication/threads/${threadId}/messages/`).then((r) => r.data);

// Send a new message to a thread.
// If an attachment file is provided, it sends as multipart form data.
// Otherwise it sends as regular JSON.
export const sendMessage = (threadId, body, attachment = null) => {
  if (attachment) {
    const form = new FormData();
    form.append('thread', threadId);
    form.append('body', body);
    form.append('attachment', attachment);
    return api.post('communication/messages/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  }
  return api
    .post('communication/messages/', { thread: threadId, body })
    .then((r) => r.data);
};

// Delete a message by its ID. Only the sender can delete their own messages.
export const deleteMessage = (messageId) =>
  api.delete(`communication/messages/${messageId}/`);

// Mark a single message as read for the current user.
export const markMessageRead = (messageId) =>
  api.post(`communication/messages/${messageId}/mark_read/`).then((r) => r.data);
