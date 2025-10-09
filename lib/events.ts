// Event emitter for cross-component communication
class EventEmitter extends EventTarget {
  emit(eventType: string, data?: any) {
    this.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }
}

export const appEvents = new EventEmitter();

// Event types
export const TASK_COMPLETED = 'task-completed';
export const TASK_STARTED = 'task-started';