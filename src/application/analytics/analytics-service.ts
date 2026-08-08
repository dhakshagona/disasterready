export type AnalyticsEventName =
  | 'session_started'
  | 'alerts_fetched'
  | 'alerts_normalized'
  | 'action_plan_opened'
  | 'checklist_started'
  | 'checklist_completed'
  | 'shelter_lookup'
  | 'demo_session_started'
  | 'ai_simplification_requested'
  | 'ai_simplification_used'
  | 'ai_simplification_fallback';

export type AnalyticsMode = 'real' | 'demo';
export type AnalyticsProperty = string | number | boolean | string[];

export type AnalyticsEvent = {
  id: string;
  sessionId: string;
  name: AnalyticsEventName;
  occurredAt: string;
  mode: AnalyticsMode;
  properties: Record<string, AnalyticsProperty>;
};

export interface AnalyticsOutbox {
  append(event: AnalyticsEvent): Promise<void>;
  list(limit: number): Promise<AnalyticsEvent[]>;
  remove(ids: string[]): Promise<void>;
}

export interface AnalyticsTransport {
  send(events: AnalyticsEvent[]): Promise<void>;
}

type AnalyticsServiceOptions = {
  outbox: AnalyticsOutbox;
  transport?: AnalyticsTransport;
  now?: () => Date;
  createId?: () => string;
  sessionId?: string;
};

export type AnalyticsTrackOptions = {
  mode: AnalyticsMode;
  properties?: Record<string, AnalyticsProperty>;
};

function defaultId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export class AnalyticsService {
  private readonly outbox: AnalyticsOutbox;
  private readonly transport?: AnalyticsTransport;
  private readonly now: () => Date;
  private readonly createId: () => string;
  private readonly sessionId: string;
  private flushQueue: Promise<void> = Promise.resolve();

  constructor({ outbox, transport, now = () => new Date(), createId = defaultId, sessionId }: AnalyticsServiceOptions) {
    this.outbox = outbox;
    this.transport = transport;
    this.now = now;
    this.createId = createId;
    this.sessionId = sessionId ?? createId();
  }

  async track(name: AnalyticsEventName, { mode, properties = {} }: AnalyticsTrackOptions): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.createId(),
      sessionId: this.sessionId,
      name,
      occurredAt: this.now().toISOString(),
      mode,
      properties,
    };

    try {
      await this.outbox.append(event);
    } catch {
      return;
    }

    if (!this.transport) return;
    this.flushQueue = this.flushQueue.then(() => this.flush()).catch(() => undefined);
    await this.flushQueue;
  }

  async flush(): Promise<void> {
    if (!this.transport) return;
    const events = await this.outbox.list(25);
    if (!events.length) return;
    await this.transport.send(events);
    await this.outbox.remove(events.map((event) => event.id));
  }
}
