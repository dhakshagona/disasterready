import {
  parseAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsEventPropertiesByName,
  type StoredAnalyticsEvent,
} from '../../../shared/analytics-contract';

export type { AnalyticsEventName };

export type AnalyticsMode = 'real' | 'demo';
export type AnalyticsProperty = string | number | boolean | string[];

export type AnalyticsEvent<Name extends AnalyticsEventName = AnalyticsEventName> = Extract<StoredAnalyticsEvent, { name: Name }>;

export interface AnalyticsOutbox {
  append(event: AnalyticsEvent): Promise<void>;
  list(limit: number): Promise<AnalyticsEvent[]>;
  remove(ids: string[]): Promise<void>;
}

export interface AnalyticsTransport {
  send(events: AnalyticsEvent[]): Promise<void>;
}

export class AnalyticsTransportError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = 'AnalyticsTransportError';
    this.status = status;
    this.retryable = retryable;
  }
}

type AnalyticsServiceOptions = {
  outbox: AnalyticsOutbox;
  transport?: AnalyticsTransport;
  now?: () => Date;
  createId?: () => string;
  sessionId?: string;
};

export type AnalyticsTrackOptions<Name extends AnalyticsEventName = AnalyticsEventName> = {
  mode: AnalyticsMode;
} & (Name extends 'session_started'
  ? { properties?: AnalyticsEventPropertiesByName[Name] }
  : { properties: AnalyticsEventPropertiesByName[Name] });

function defaultId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const random = Math.floor(Math.random() * 16);
    const value = token === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
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

  async track<Name extends AnalyticsEventName>(name: Name, { mode, properties = {} }: AnalyticsTrackOptions<Name>): Promise<void> {
    let event: AnalyticsEvent;
    try {
      event = parseAnalyticsEvent({
        id: this.createId(),
        sessionId: this.sessionId,
        name,
        occurredAt: this.now().toISOString(),
        mode,
        properties,
      });
    } catch {
      return;
    }

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
    try {
      await this.transport.send(events);
      await this.outbox.remove(events.map((event) => event.id));
    } catch (error) {
      if (!(error instanceof AnalyticsTransportError) || error.retryable) throw error;

      const removableIds: string[] = [];
      let retryableError: unknown;
      for (const event of events) {
        try {
          await this.transport.send([event]);
          removableIds.push(event.id);
        } catch (individualError) {
          if (individualError instanceof AnalyticsTransportError && !individualError.retryable) {
            removableIds.push(event.id);
          } else {
            retryableError ??= individualError;
          }
        }
      }
      if (removableIds.length) await this.outbox.remove(removableIds);
      if (retryableError) throw retryableError;
    }
  }
}
