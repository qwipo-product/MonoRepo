import { useEffect, useRef, useState } from 'react';
import { sseService } from '../api/services/sse.service';
import { publishSse } from '../mock/sseHub';

/** Port of SseTestComponent (spec 00 §12). Debug page, not linked in the menu. */
export default function SseTestPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const unsub = useRef<(() => void) | null>(null);

  const connect = () => {
    if (connected) return;
    sseService.connect('test', '123');
    unsub.current = sseService.getMessages((e) => setMessages((m) => [...m, JSON.stringify(e)]));
    setConnected(true);
    setMessages((m) => [...m, 'Connected to SSE!']);
  };
  const disconnect = () => {
    if (!connected) return;
    sseService.disconnect('test', '123');
    unsub.current?.();
    setConnected(false);
    setMessages((m) => [...m, 'Disconnected from SSE.']);
  };
  useEffect(() => () => sseService.disconnect('test', '123'), []);

  return (
    <div style={{ padding: 16 }}>
      <h2>SSE Test Component</h2>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      {/* Replica-only helper to push a test frame through the mock SSE hub */}
      <button className="ms-3" onClick={() => publishSse('test', '123', { messageType: 'TEST', message: JSON.stringify({ hello: 'world', at: new Date().toISOString() }) })}>
        Send test frame (mock)
      </button>
      {messages.map((m, i) => (
        <div key={i}><pre>{m}</pre></div>
      ))}
    </div>
  );
}
