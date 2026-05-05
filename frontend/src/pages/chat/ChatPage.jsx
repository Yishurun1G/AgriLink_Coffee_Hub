import BatchChat from '../../components/communication/BatchChat';

export default function ChatPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <BatchChat />
    </div>
  );
}