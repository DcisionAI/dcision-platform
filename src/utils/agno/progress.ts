export interface ProgressEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  step: string;
  message: string;
  data?: any;
  timestamp: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

export class ProgressTracker {
  private callbacks: ProgressCallback[] = [];

  constructor(private sessionId: string) {}

  subscribe(callback: ProgressCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  private emit(event: Omit<ProgressEvent, 'timestamp'>) {
    const fullEvent: ProgressEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    this.callbacks.forEach(callback => callback(fullEvent));
  }

  start(step: string, message: string, data?: any) {
    this.emit({ type: 'start', step, message, data });
  }

  progress(step: string, message: string, data?: any) {
    this.emit({ type: 'progress', step, message, data });
  }

  complete(step: string, message: string, data?: any) {
    this.emit({ type: 'complete', step, message, data });
  }

  error(step: string, message: string, error: any) {
    this.emit({ type: 'error', step, message, data: { error } });
  }
}

// Helper to create a progress-aware operation
export function withProgress<T>(
  operation: (progress: ProgressTracker) => Promise<T>,
  sessionId: string,
  step: string,
  message: string
): Promise<T> {
  const tracker = new ProgressTracker(sessionId);
  tracker.start(step, message);

  return operation(tracker)
    .then(result => {
      tracker.complete(step, `${message} completed`, result);
      return result;
    })
    .catch(error => {
      tracker.error(step, `${message} failed`, error);
      throw error;
    });
} 