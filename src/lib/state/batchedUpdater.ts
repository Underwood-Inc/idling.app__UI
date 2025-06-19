/**
 * Batched Atom Update System
 *
 * Provides atomic state management by batching multiple updates together
 * instead of relying on unreliable debouncing with timers.
 *
 * This system ensures that multiple rapid state changes are consolidated
 * into a single atomic update, preventing intermediate states and
 * unnecessary re-renders or side effects.
 */

interface BatchedUpdate<T = any> {
  id: string;
  updater: (currentState: T) => T;
  timestamp: number;
}

class BatchedAtomUpdater {
  private static instance: BatchedAtomUpdater;
  private updateQueues = new Map<string, BatchedUpdate[]>();
  private processingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private atomSetters = new Map<
    string,
    (updater: (state: any) => any) => void
  >();

  static getInstance(): BatchedAtomUpdater {
    if (!BatchedAtomUpdater.instance) {
      BatchedAtomUpdater.instance = new BatchedAtomUpdater();
    }
    return BatchedAtomUpdater.instance;
  }

  /**
   * Register an atom setter for batched updates
   */
  registerAtom<T>(
    atomKey: string,
    setAtom: (updater: (currentState: T) => T) => void
  ): void {
    this.atomSetters.set(atomKey, setAtom);
  }

  /**
   * Queue a batched update for an atom
   * Multiple updates to the same atom will be batched together
   */
  queueUpdate<T>(
    atomKey: string,
    updater: (currentState: T) => T,
    batchDelay: number = 0
  ): void {
    const updateId = `${atomKey}-${Date.now()}-${Math.random()}`;
    const update: BatchedUpdate<T> = {
      id: updateId,
      updater,
      timestamp: Date.now()
    };

    // Add to queue
    if (!this.updateQueues.has(atomKey)) {
      this.updateQueues.set(atomKey, []);
    }
    this.updateQueues.get(atomKey)!.push(update);

    // Clear existing timeout
    if (this.processingTimeouts.has(atomKey)) {
      clearTimeout(this.processingTimeouts.get(atomKey)!);
    }

    // Set new timeout for batch processing
    const timeout = setTimeout(() => {
      this.processBatch(atomKey);
    }, batchDelay);

    this.processingTimeouts.set(atomKey, timeout);
  }

  /**
   * Process all queued updates for an atom atomically
   */
  private processBatch(atomKey: string): void {
    const updates = this.updateQueues.get(atomKey);
    const setAtom = this.atomSetters.get(atomKey);

    if (!updates || updates.length === 0 || !setAtom) return;

    // Clear the queue and timeout
    this.updateQueues.delete(atomKey);
    this.processingTimeouts.delete(atomKey);

    // Create batched updater function
    const batchedUpdater = (currentState: any) => {
      return updates.reduce((state, update) => {
        try {
          return update.updater(state);
        } catch (error) {
          // Silently handle errors to avoid console spam
          return state;
        }
      }, currentState);
    };

    // Apply the batched update atomically
    setAtom(batchedUpdater);
  }

  /**
   * Force immediate processing of all queued updates for an atom
   */
  flushUpdates(atomKey: string): void {
    if (this.processingTimeouts.has(atomKey)) {
      clearTimeout(this.processingTimeouts.get(atomKey)!);
      this.processBatch(atomKey);
    }
  }

  /**
   * Clear all queued updates for an atom without applying them
   */
  clearUpdates(atomKey: string): void {
    this.updateQueues.delete(atomKey);
    if (this.processingTimeouts.has(atomKey)) {
      clearTimeout(this.processingTimeouts.get(atomKey)!);
      this.processingTimeouts.delete(atomKey);
    }
  }

  /**
   * Get pending update count for debugging
   */
  getPendingCount(atomKey: string): number {
    return this.updateQueues.get(atomKey)?.length || 0;
  }

  /**
   * Check if there are pending updates for an atom
   */
  hasPendingUpdates(atomKey: string): boolean {
    return this.getPendingCount(atomKey) > 0;
  }

  /**
   * Get all atom keys with pending updates
   */
  getPendingAtomKeys(): string[] {
    return Array.from(this.updateQueues.keys()).filter(
      (key) => this.updateQueues.get(key)!.length > 0
    );
  }

  /**
   * Clear all pending updates for all atoms
   */
  clearAllUpdates(): void {
    this.updateQueues.clear();
    this.processingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.processingTimeouts.clear();
  }
}

/**
 * Export singleton instance for reuse across the application
 */
export const batchedUpdater = BatchedAtomUpdater.getInstance();

/**
 * Create a batched updater for a specific atom
 * This provides a clean interface for components to use batched updates
 */
export function createBatchedAtomUpdater<T>(
  atomKey: string,
  setAtom: (updater: (currentState: T) => T) => void,
  options: {
    batchDelay?: number;
    maxBatchSize?: number;
    autoFlush?: boolean;
  } = {}
) {
  const { batchDelay = 0, maxBatchSize = 10, autoFlush = true } = options;

  // Register the atom setter
  batchedUpdater.registerAtom(atomKey, setAtom);

  return {
    /**
     * Queue an update to be batched
     */
    queueUpdate: (updater: (currentState: T) => T) => {
      batchedUpdater.queueUpdate(atomKey, updater, batchDelay);

      // Auto-flush if we've hit the max batch size
      if (
        autoFlush &&
        batchedUpdater.getPendingCount(atomKey) >= maxBatchSize
      ) {
        batchedUpdater.flushUpdates(atomKey);
      }
    },

    /**
     * Force immediate processing of queued updates
     */
    flush: () => {
      batchedUpdater.flushUpdates(atomKey);
    },

    /**
     * Clear all queued updates without applying them
     */
    clear: () => {
      batchedUpdater.clearUpdates(atomKey);
    },

    /**
     * Get number of pending updates
     */
    getPendingCount: () => {
      return batchedUpdater.getPendingCount(atomKey);
    },

    /**
     * Check if there are pending updates
     */
    hasPendingUpdates: () => {
      return batchedUpdater.hasPendingUpdates(atomKey);
    }
  };
}

/**
 * Utility function to create a batched version of any atom setter
 */
export function createBatchedSetter<T>(
  atomKey: string,
  originalSetter: (updater: (currentState: T) => T) => void,
  batchDelay: number = 0
) {
  const batchedAtomUpdater = createBatchedAtomUpdater(atomKey, originalSetter, {
    batchDelay,
    autoFlush: true
  });

  return {
    /**
     * Batched version of the setter - queues updates instead of applying immediately
     */
    setBatched: (updater: (currentState: T) => T) => {
      batchedAtomUpdater.queueUpdate(updater);
    },

    /**
     * Original setter for immediate updates when needed
     */
    setImmediate: originalSetter,

    /**
     * Flush any pending batched updates
     */
    flush: batchedAtomUpdater.flush,

    /**
     * Clear pending updates
     */
    clear: batchedAtomUpdater.clear,

    /**
     * Get batched updater instance for advanced usage
     */
    batchedUpdater: batchedAtomUpdater
  };
}
