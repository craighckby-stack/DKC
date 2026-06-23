import { SystemEvent } from '../types';

export type EventHandler<T extends SystemEvent['type']> = (
  payload: Extract<SystemEvent, { type: T }>['payload']
) => void | Promise<void>;