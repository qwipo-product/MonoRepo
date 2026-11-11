// In-browser stand-in for the SSE server (config key `sse`). Mock route handlers call `publishSse`
// to push frames to connected clients, exactly as the real server would on `data:` lines.

type FrameListener = (rawData: string) => void;
const channels = new Map<string, Set<FrameListener>>();

const key = (entityType: string, entityId: string) => `${entityType}:${entityId}`;

export function subscribeSse(entityType: string, entityId: string, fn: FrameListener) {
  const k = key(entityType, entityId);
  if (!channels.has(k)) channels.set(k, new Set());
  channels.get(k)!.add(fn);
  return () => channels.get(k)?.delete(fn);
}

/** Pushes one SSE frame. `frame` is serialised like the server's `data:` payload, e.g. {messageType, message}. */
export function publishSse(entityType: string, entityId: string, frame: unknown, delayMs = 0) {
  const send = () => {
    const raw = typeof frame === 'string' ? frame : JSON.stringify(frame);
    channels.get(key(entityType, entityId))?.forEach((l) => l(raw));
  };
  if (delayMs > 0) window.setTimeout(send, delayMs);
  else send();
}
