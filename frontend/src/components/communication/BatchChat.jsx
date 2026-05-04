// --- Imports ---
// React hooks for state, side effects, refs, and memoized callbacks.
// useAuth gives us the currently logged-in user.
// api is the configured axios instance with the auth token attached.
// All communication API calls are imported from communicationApi.js.
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  getThreads,
  createThread,
  getThread,
  getMessages,
  sendMessage,
  resolveThread,
  reopenThread,
  deleteMessage,
} from '../../api/communicationApi';

// --- Time & Date Helpers ---
// fmtTime: turns an ISO timestamp into a short "HH:MM" string for message timestamps.
// fmtDate: turns a date into "Today", "Yesterday", or a short date like "May 3".
// groupByDate: takes a flat list of messages and inserts date separator labels
//              between messages from different days, so the chat shows date dividers.
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const fmtDate = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const groupByDate = (messages) => {
  const groups = [];
  let lastDate = null;
  messages.forEach((m) => {
    const d = fmtDate(m.created_at);
    if (d !== lastDate) { groups.push({ type: 'date', label: d }); lastDate = d; }
    groups.push({ type: 'message', data: m });
  });
  return groups;
};

// --- Avatar Component ---
// Shows a circular avatar with the user's initials.
// The background color is picked based on the first letter of the name
// so each person consistently gets the same color.
const Avatar = ({ name, size = 32 }) => {
  const initials = name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors = ['#6F4E37', '#8B5E3C', '#A0522D', '#7B4F2E', '#5C3317'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

// --- NewThreadModal Component ---
// The popup form that appears when a user clicks the "+" button to start a new conversation.
// It fetches the list of users the current user is allowed to message (based on their role),
// lets them pick a recipient, write a subject and first message, then submits to create the thread.
const NewThreadModal = ({ onClose, onCreated, currentUser }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const role = currentUser?.role?.toLowerCase();

  useEffect(() => {
    api.get('users/')
      .then((r) => {
        const all = r.data.results ?? r.data;
        setUsers(all);
      })
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoadingUsers(false));
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim() || !selectedUser) {
      setError('All fields are required.'); return;
    }
    setLoading(true); setError('');
    try {
      const created = await createThread({
        subject: subject.trim(),
        participant_ids: [parseInt(selectedUser)],
        initial_message: message.trim(),
      });
      const fullThread = await getThread(created.id);
      onCreated(fullThread);
    } catch (err) {
      const detail = err?.response?.data;
      const msg = typeof detail === 'string'
        ? detail
        : JSON.stringify(detail) ?? 'Failed to create thread. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const recipientLabel = {
    dealer: 'Select a Manager',
    manager: 'Select a Manager, Dealer or Admin',
    admin: 'Select a Manager or Dealer',
  }[role] ?? 'Select a Recipient';

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>New Conversation</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Subject</label>
          <input
            style={styles.input}
            placeholder="e.g. Batch #42 — moisture issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>{recipientLabel}</label>
          {loadingUsers ? (
            <p style={{ fontSize: 13, color: '#9E7B5A' }}>Loading users…</p>
          ) : users.length === 0 ? (
            <p style={{ fontSize: 13, color: '#c0392b' }}>No available users found.</p>
          ) : (
            <select
              style={{ ...styles.input, cursor: 'pointer' }}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">— Select a person —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} — {u.role}
                </option>
              ))}
            </select>
          )}
        </div>
        <div style={styles.field}>
          <label style={styles.label}>First Message</label>
          <textarea
            style={{ ...styles.input, height: 90, resize: 'vertical' }}
            placeholder="Describe the issue..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button
          style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Start Conversation'}
        </button>
      </div>
    </div>
  );
};

// --- checkIsMine Helper ---
// Figures out whether a message was sent by the current user.
// We check in order: our local optimistic flag (_isMine), then sender ID comparison,
// then sender username comparison, and finally the backend's is_mine field.
// Using String() on IDs avoids bugs where one side is a number and the other is a string.
const checkIsMine = (msg, currentUser) => {
  if (!currentUser) return false;
  if (msg._isMine === true) return true; // optimistic flag
  if (msg.sender?.id !== undefined && currentUser.id !== undefined) {
    return String(msg.sender.id) === String(currentUser.id);
  }
  if (msg.sender?.username && currentUser.username) {
    return msg.sender.username === currentUser.username;
  }
  return msg.is_mine === true;
};

// --- BatchChat Main Component ---
// The full chat UI. Renders a sidebar with the conversation list on the left
// and the active chat panel on the right — just like WhatsApp Web.
// Polls for new messages every 5 seconds while a thread is open.
export default function BatchChat() {
  // --- State ---
  // threads: the list of conversations in the sidebar.
  // activeThread: the conversation currently open on the right.
  // messages: the messages shown in the active thread.
  // input: what the user is currently typing in the message box.
  // loading flags control the loading spinners.
  // hoveredMsg tracks which message the mouse is over (to show the delete button).
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // --- Fetch Threads on Mount ---
  // Loads the conversation list as soon as the component appears on screen.
  useEffect(() => { fetchThreads(); }, []);

  const fetchThreads = async () => {
    try {
      const data = await getThreads();
      setThreads(data.results ?? data);
    } catch (e) {
      console.error('fetchThreads error:', e);
    } finally {
      setLoadingThreads(false);
    }
  };

  // --- Message Polling ---
  // When the user opens a thread, immediately load its messages,
  // then keep refreshing every 5 seconds to pick up new messages from the other person.
  // The interval is cleared when the user switches to a different thread.
  useEffect(() => {
    fetchMessages(activeThread.id);
    pollRef.current = setInterval(() => fetchMessages(activeThread.id), 5000);
    return () => clearInterval(pollRef.current);
  }, [activeThread?.id]);

  const fetchMessages = useCallback(async (threadId) => {
    setLoadingMessages(true);
    try {
      const data = await getMessages(threadId);
      setMessages(data.results ?? data);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // --- Auto Scroll ---
  // Every time the messages list changes, scroll to the bottom
  // so the latest message is always visible (like any chat app).
  useEffect(() => {
  }, [messages]);

  // --- Send Message ---
  // Sends the typed message to the backend, then immediately adds it to the local
  // message list with _isMine: true so it shows on the right side straight away
  // without waiting for the next poll. Also updates the thread's preview in the sidebar.
  // If sending fails, the typed text is restored so the user doesn't lose it.
  const handleSend = async () => {
    const body = input.trim();
    if (!body || !activeThread || sending) return;
    setSending(true);
    setInput('');
    try {
      const msg = await sendMessage(activeThread.id, body);
      // _isMine is our local flag so it always renders on the right
      setMessages((prev) => [...prev, { ...msg, _isMine: true }]);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, last_message: { body, sender: user?.username, created_at: new Date().toISOString() }, updated_at: new Date().toISOString() }
            : t
        )
      );
    } catch {
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  // --- Keyboard Shortcut ---
  // Pressing Enter sends the message. Shift+Enter adds a new line instead.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // --- Resolve / Reopen Thread ---
  // Toggles the thread between resolved and open.
  // Updates both the active thread and the sidebar list so the UI stays in sync.
  const handleToggleResolve = async () => {
    if (!activeThread) return;
    activeThread.is_resolved
      ? await reopenThread(activeThread.id)
      : await resolveThread(activeThread.id);
    const refreshed = { ...activeThread, is_resolved: !activeThread.is_resolved };
    setActiveThread(refreshed);
    setThreads((prev) => prev.map((t) => (t.id === refreshed.id ? refreshed : t)));
  };

  // --- Delete Message ---
  // Removes a message from the backend and immediately removes it from the UI.
  const handleDeleteMessage = async (msgId) => {
    await deleteMessage(msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  // --- Thread Created Callback ---
  // Called by NewThreadModal after a thread is successfully created.
  // Adds the new thread to the top of the sidebar and opens it immediately.
  const handleThreadCreated = (thread) => {
    setThreads((prev) => [thread, ...prev]);
    setActiveThread(thread);
    setShowModal(false);
  };

  // --- Derived Data ---
  // grouped: messages with date separators inserted between different days.
  // otherParticipants: everyone in the thread except the current user,
  //                    used to show the other person's name and avatar in the header.
  const grouped = groupByDate(messages);
  const otherParticipants = activeThread?.participants?.filter(
    (p) => String(p.id) !== String(user?.id)
  ) || [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #C8A97E44; border-radius: 99px; }
        .thread-item:hover { background: rgba(111,78,55,0.07) !important; }
        .thread-item.active { background: rgba(111,78,55,0.13) !important; }
        .del-btn { opacity: 0; transition: opacity 0.15s; }
        .msg-row:hover .del-btn { opacity: 1; }
        textarea:focus, input:focus, select:focus { outline: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-row { animation: fadeUp 0.2s ease; }
      `}</style>

      <div style={styles.root}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>Messages</span>
            <button style={styles.newBtn} onClick={() => setShowModal(true)} title="New conversation">+</button>
          </div>
          <div style={styles.threadList}>
            {loadingThreads ? (
              <p style={styles.hint}>Loading…</p>
            ) : threads.length === 0 ? (
              <p style={styles.hint}>No conversations yet.</p>
            ) : (
              threads.map((t) => (
                <div
                  key={t.id}
                  className={`thread-item${activeThread?.id === t.id ? ' active' : ''}`}
                  style={styles.threadItem}
                  onClick={() => setActiveThread(t)}
                >
                  <Avatar name={t.created_by?.username} size={38} />
                  <div style={styles.threadInfo}>
                    <div style={styles.threadSubject}>{t.subject}</div>
                    <div style={styles.threadPreview}>{t.last_message?.body || 'No messages yet'}</div>
                  </div>
                  <div style={styles.threadMeta}>
                    {t.updated_at && <span style={styles.threadTime}>{fmtTime(t.updated_at)}</span>}
                    {t.unread_count > 0 && <span style={styles.badge}>{t.unread_count}</span>}
                    {t.is_resolved && <span style={{ fontSize: 12, color: '#4caf50' }}>✓</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main style={styles.chatPanel}>
          {!activeThread ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>☕</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#5C3D1E' }}>Select a conversation</p>
              <p style={{ fontSize: 13, color: '#B8A090' }}>or start a new one with the + button</p>
            </div>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={otherParticipants[0]?.username} size={40} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#2d1a0e' }}>
                      {otherParticipants.map((p) => p.username).join(', ') || 'Thread'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9E7B5A', marginTop: 1 }}>{activeThread.subject}</div>
                  </div>
                </div>
                <button
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    background: activeThread.is_resolved ? '#e8f5e9' : '#fff3e0',
                    color: activeThread.is_resolved ? '#388e3c' : '#e65100',
                    border: `1px solid ${activeThread.is_resolved ? '#a5d6a7' : '#ffcc80'}`,
                  }}
                  onClick={handleToggleResolve}
                >
                  {activeThread.is_resolved ? '↩ Reopen' : '✓ Resolve'}
                </button>
              </div>

              <div style={styles.messageArea}>
                {loadingMessages && messages.length === 0 ? (
                  <p style={styles.hint}>Loading messages…</p>
                ) : grouped.length === 0 ? (
                  <p style={styles.hint}>No messages yet. Say hello!</p>
                ) : (
                  grouped.map((item, i) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`d-${i}`} style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                          <span style={{ background: '#E8DDD4', color: '#7A5C44', borderRadius: 99, padding: '2px 12px', fontSize: 11, fontWeight: 600 }}>
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    const isMine = checkIsMine(item.data, user);
                    const senderName = item.data.sender?.username || '';

                    return (
                      <div
                        key={item.data.id}
                        className="msg-row"
                        style={{
                          display: 'flex',
                          flexDirection: isMine ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          gap: 8,
                          marginBottom: 6,
                        }}
                        onMouseEnter={() => setHoveredMsg(item.data.id)}
                        onMouseLeave={() => setHoveredMsg(null)}
                      >
                        {/* Avatar on the left for received messages */}
                        {!isMine && <Avatar name={senderName} size={30} />}

                        <div style={{ maxWidth: '65%' }}>
                          {/* Sender name above received messages */}
                          {!isMine && (
                            <div style={{ fontSize: 11, color: '#9E7B5A', marginBottom: 3, paddingLeft: 4 }}>
                              {senderName}
                            </div>
                          )}

                          {/* Bubble */}
                          <div style={{
                            padding: '10px 14px',
                            fontSize: 14,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                            background: isMine ? '#6F4E37' : '#fff',
                            color: isMine ? '#fff' : '#2d1a0e',
                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            boxShadow: isMine
                              ? '0 2px 8px rgba(111,78,55,0.25)'
                              : '0 2px 8px rgba(0,0,0,0.07)',
                          }}>
                            {item.data.body}
                            {item.data.attachment && (
                              <a
                                href={item.data.attachment}
                                style={{ display: 'block', marginTop: 6, fontSize: 12, color: isMine ? '#ffcc80' : '#6F4E37' }}
                                target="_blank"
                                rel="noreferrer"
                              >
                                📎 Attachment
                              </a>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div style={{ fontSize: 10, color: '#B8A090', marginTop: 3, textAlign: isMine ? 'right' : 'left' }}>
                            {fmtTime(item.data.created_at)}
                            {item.data.read_by?.length > 0 && isMine && (
                              <span style={{ marginLeft: 4, color: '#6F4E37' }}>✓✓</span>
                            )}
                          </div>
                        </div>

                        {/* Delete button on sent messages */}
                        {isMine && hoveredMsg === item.data.id && (
                          <button
                            className="del-btn"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, alignSelf: 'center', color: '#c0392b' }}
                            onClick={() => handleDeleteMessage(item.data.id)}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div style={{
                borderTop: '1px solid #E8DDD4',
                background: '#FDF9F5',
                padding: '12px 16px',
                opacity: activeThread.is_resolved ? 0.6 : 1,
                pointerEvents: activeThread.is_resolved ? 'none' : 'auto',
              }}>
                {activeThread.is_resolved && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#9E7B5A', marginBottom: 8, fontStyle: 'italic' }}>
                    Thread resolved — reopen to send messages
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <textarea
                    style={styles.textarea}
                    placeholder="Type a message… (Enter to send)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <button
                    style={{
                      width: 44, height: 44, borderRadius: '50%',
                      border: 'none', background: '#6F4E37', color: '#fff',
                      fontSize: 18, cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: !input.trim() || sending ? 0.5 : 1,
                    }}
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                  >
                    {sending ? '…' : '➤'}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {showModal && (
        <NewThreadModal
          currentUser={user}
          onClose={() => setShowModal(false)}
          onCreated={handleThreadCreated}
        />
      )}
    </>
  );
}

// --- Styles ---
// All inline styles are defined here at the bottom to keep the JSX clean.
const styles = {
  root: { display: 'flex', height: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#FAF6F1', color: '#2d1a0e' },
  sidebar: { width: 300, minWidth: 260, borderRight: '1px solid #E8DDD4', display: 'flex', flexDirection: 'column', background: '#FDF9F5' },
  sidebarHeader: { padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8DDD4' },
  sidebarTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: '#3E1F00' },
  newBtn: { width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#6F4E37', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  threadList: { overflowY: 'auto', flex: 1 },
  threadItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #F0E9E1' },
  threadInfo: { flex: 1, minWidth: 0 },
  threadSubject: { fontSize: 13.5, fontWeight: 600, color: '#2d1a0e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  threadPreview: { fontSize: 12, color: '#9E7B5A', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  threadMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  threadTime: { fontSize: 11, color: '#B8A090' },
  badge: { background: '#6F4E37', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' },
  hint: { padding: 20, color: '#B8A090', fontSize: 13, textAlign: 'center' },
  chatPanel: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#FAF6F1' },
  chatHeader: { padding: '14px 20px', borderBottom: '1px solid #E8DDD4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FDF9F5' },
  messageArea: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 2 },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 },
  textarea: { flex: 1, resize: 'none', border: '1.5px solid #E0D4C8', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#2d1a0e', maxHeight: 120, lineHeight: 1.5 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(30,10,0,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#FDF9F5', borderRadius: 16, padding: 28, width: 420, maxWidth: '95vw', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 24px 60px rgba(30,10,0,0.2)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: '#3E1F00' },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9E7B5A' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#6F4E37', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { border: '1.5px solid #E0D4C8', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#2d1a0e' },
  error: { color: '#c0392b', fontSize: 13 },
  primaryBtn: { background: '#6F4E37', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};
