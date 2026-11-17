type Listener<T> = (data: T) => void

export class EventEmitter<TEvents extends object> {
  private listeners: { [K in keyof TEvents]?: Set<Listener<TEvents[K]>> } = {}

  on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set()
    }
    this.listeners[event]?.add(listener)

    return () => {
      this.off(event, listener)
    }
  }

  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void {
    const set = this.listeners[event]
    if (set) {
      set.delete(listener)
      if (set.size === 0) {
        delete this.listeners[event]
      }
    }
  }

  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const set = this.listeners[event]
    if (set) {
      for (const listener of set) {
        listener(data)
      }
    }
  }

  removeAllListeners(): void {
    this.listeners = {}
  }
}
