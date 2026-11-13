// Port of the original SseService (spec 00 §13.4). Instead of a network EventSource it attaches to the
// in-browser SSE hub (src/mock/sseHub.ts), but keeps the same connection keys, parsing and lifecycle events.
import { getConfig } from '../config';
import { subscribeSse } from '../../mock/sseHub';

export interface SseEvent {
  type: string;
  data: any;
  timestamp: number;
  connectionId: string;
  messageType?: string;
}

interface Conn {
  url: string;
  unsubscribe: () => void;
  reconnectAttempts: number;
  entityType: string;
  entityId: string;
}

type Listener = (e: SseEvent) => void;

class SseService {
  static DEFAULT_RECONNECT_INTERVAL = 5000;
  static DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
  readonly clientId = 'web_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
  private connections = new Map<string, Conn>();
  private listeners = new Set<Listener>();
  private last: SseEvent | null = null;

  constructor() {
    window.addEventListener('beforeunload', () => this.disconnectAll());
  }

  private emit(e: Omit<SseEvent, 'timestamp'>) {
    const ev = { ...e, timestamp: Date.now() };
    this.last = ev;
    this.listeners.forEach((l) => l(ev));
  }

  private buildUrl(entityType: string, entityId: string) {
    const base = getConfig().sse;
    return `${base}?clientId=${this.clientId}${entityType ? `&entityType=${entityType}` : ''}${entityId ? `&entityId=${entityId}` : ''}`;
  }

  connect(entityType: string, entityId: string) {
    const k = `${entityType}:${entityId}`;
    if (this.connections.has(k)) {
      console.warn(`SSE connection already for entity ${k}`);
      return;
    }
    const url = this.buildUrl(entityType, entityId);
    const unsubscribe = subscribeSse(entityType, entityId, (raw) => this.onMessage(k, raw));
    this.connections.set(k, { url, unsubscribe, reconnectAttempts: 0, entityType, entityId });
    // onopen
    window.setTimeout(() => {
      if (this.connections.has(k)) this.emit({ type: 'CONNECTED', data: { message: 'Connected to SSE server' }, connectionId: k });
    }, 50);
  }

  private onMessage(k: string, raw: string) {
    try {
      // Non-JSON frames (e.g. bare `tripCreated`) throw here → PARSING_ERROR, like the original.
      const data: any = JSON.parse(raw);
      if (data && typeof data.message === 'string') {
        try {
          data.message = JSON.parse(data.message);
        } catch {
          console.warn('SSE message is not JSON; keeping string');
        }
      }
      if (data && typeof data === 'object' && 'messageType' in data) {
        const payload = data.message && typeof data.message === 'object' ? data.message : data.data || data.message || data;
        this.emit({ type: data.messageType, data: payload, connectionId: k, messageType: data.messageType });
      } else {
        this.emit({ type: 'message', data, connectionId: k });
      }
    } catch {
      this.emit({ type: 'PARSING_ERROR', data: { error: 'Failed to parse message', originalEvent: raw }, connectionId: k });
    }
  }

  disconnect(entityType: string, entityId: string) {
    const k = `${entityType}:${entityId}`;
    const c = this.connections.get(k);
    if (!c) return;
    c.unsubscribe();
    this.connections.delete(k);
    this.emit({ type: 'DISCONNECTED', data: { message: 'Connection closed' }, connectionId: k });
  }

  disconnectAll() {
    this.connections.forEach((c) => c.unsubscribe());
    this.connections.clear();
  }

  isConnected(entityType: string, entityId: string) {
    return this.connections.has(`${entityType}:${entityId}`);
  }

  getActiveEntities() {
    return Array.from(this.connections.keys());
  }

  /** Subscribe to every event (replays the latest one, like the original BehaviorSubject). */
  getMessages(fn: Listener, replay = true) {
    this.listeners.add(fn);
    if (replay && this.last) fn(this.last);
    return () => this.listeners.delete(fn);
  }

  on(type: string, fn: Listener) {
    return this.getMessages((e) => e.type === type && fn(e), false);
  }

  getMessagesFromEntity(entityType: string, entityId: string, fn: Listener) {
    const k = `${entityType}:${entityId}`;
    return this.getMessages((e) => e.connectionId === k && fn(e), false);
  }
}

export const sseService = new SseService();
