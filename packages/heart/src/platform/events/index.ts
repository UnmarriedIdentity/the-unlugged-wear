// In-process typed event bus. A module emits facts ('order.paid'); other
// modules subscribe in their index.ts. Adding a reaction never edits the
// emitter (backend-modules skill). Durable work is NOT done here: a
// subscriber that must survive a crash writes a row a job processes.
//
// Event payload types are declared by modules through declaration merging:
//   declare module '@tuw/heart/platform/events' {
//     interface HeartEvents { 'order.paid': { orderId: string } }
//   }

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HeartEvents {
  'platform.ping': { at: string };
}

export type EventName = keyof HeartEvents;
type Subscriber<K extends EventName> = (payload: HeartEvents[K]) => Promise<void> | void;

const subscribers = new Map<EventName, Set<Subscriber<EventName>>>();

export function subscribe<K extends EventName>(name: K, fn: Subscriber<K>): () => void {
  const set = subscribers.get(name) ?? new Set();
  set.add(fn as Subscriber<EventName>);
  subscribers.set(name, set);
  return () => set.delete(fn as Subscriber<EventName>);
}

export interface EmitResult {
  delivered: number;
  failures: { error: unknown }[];
}

/** Calls every subscriber in order. One failing subscriber never stops the others or the emitter. */
export async function emit<K extends EventName>(name: K, payload: HeartEvents[K]): Promise<EmitResult> {
  const result: EmitResult = { delivered: 0, failures: [] };
  for (const fn of subscribers.get(name) ?? []) {
    try {
      await fn(payload);
      result.delivered += 1;
    } catch (error) {
      result.failures.push({ error });
      console.error(`[events] subscriber for ${name} failed`, error);
    }
  }
  return result;
}

/** Tests only. */
export function clearSubscribers(): void {
  subscribers.clear();
}
