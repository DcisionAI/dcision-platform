import { messageBus } from './MessageBus';

export interface EventRecord {
  id: string;
  type: string;
  payload: any;
  correlationId?: string;
  from?: string;
  to?: string;
  timestamp: string;
  sessionId?: string;
  metadata?: {
    agent?: string;
    step?: string;
    status?: 'started' | 'completed' | 'error';
    duration?: number;
  };
}

export interface EventQuery {
  correlationId?: string;
  sessionId?: string;
  type?: string;
  from?: string;
  to?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}

class EventStore {
  private events: EventRecord[] = [];
  private subscribers: ((event: EventRecord) => void)[] = [];

  constructor() {
    // Subscribe to all message bus events
    this.subscribeToMessageBus();
  }

  private subscribeToMessageBus() {
    // Listen to all events from the message bus
    const eventTypes = [
      'start', 'intent_identified', 'data_prepared', 'model_built', 
      'solution_found', 'explanation_ready', 'critique_complete', 
      'debate_complete', 'workflow_finished', 'workflow_error',
      'rag_response_ready', 'agent_error', 'progress', 'agent_interaction'
    ];

    eventTypes.forEach(eventType => {
      messageBus.subscribe(eventType, (msg) => {
        this.recordEvent({
          type: eventType,
          payload: msg.payload,
          correlationId: msg.correlationId,
          from: msg.from,
          to: msg.to,
          timestamp: new Date().toISOString(),
          sessionId: msg.correlationId,
          metadata: {
            agent: msg.from,
            step: eventType,
            status: 'completed'
          }
        });
      });
    });
  }

  recordEvent(event: Omit<EventRecord, 'id'>) {
    const eventRecord: EventRecord = {
      id: `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...event
    };

    this.events.push(eventRecord);
    
    // Notify subscribers
    this.subscribers.forEach(subscriber => subscriber(eventRecord));
    
    console.log(`📝 Event recorded: ${eventRecord.type} for session: ${eventRecord.correlationId}`);
  }

  queryEvents(query: EventQuery): EventRecord[] {
    return this.events.filter(event => {
      if (query.correlationId && event.correlationId !== query.correlationId) return false;
      if (query.sessionId && event.sessionId !== query.sessionId) return false;
      if (query.type && event.type !== query.type) return false;
      if (query.from && event.from !== query.from) return false;
      if (query.to && event.to !== query.to) return false;
      if (query.startTime && event.timestamp < query.startTime) return false;
      if (query.endTime && event.timestamp > query.endTime) return false;
      return true;
    }).slice(-(query.limit || 100)); // Default limit of 100 events
  }

  getSessionEvents(sessionId: string): EventRecord[] {
    return this.queryEvents({ sessionId, limit: 1000 });
  }

  getEventFlow(sessionId: string): EventRecord[] {
    return this.getSessionEvents(sessionId).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  subscribe(callback: (event: EventRecord) => void) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Replay events for a session (useful for debugging or recovery)
  replaySession(sessionId: string, callback: (event: EventRecord) => void) {
    const sessionEvents = this.getEventFlow(sessionId);
    sessionEvents.forEach(event => callback(event));
  }

  // Get statistics for a session
  getSessionStats(sessionId: string) {
    const events = this.getSessionEvents(sessionId);
    const stats = {
      totalEvents: events.length,
      eventTypes: {} as Record<string, number>,
      agents: {} as Record<string, number>,
      duration: 0,
      errors: 0
    };

    if (events.length > 0) {
      const startTime = new Date(events[0].timestamp).getTime();
      const endTime = new Date(events[events.length - 1].timestamp).getTime();
      stats.duration = endTime - startTime;
    }

    events.forEach(event => {
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
      if (event.from) {
        stats.agents[event.from] = (stats.agents[event.from] || 0) + 1;
      }
      if (event.type.includes('error')) {
        stats.errors++;
      }
    });

    return stats;
  }

  // Clear old events (for memory management)
  clearOldEvents(olderThanDays: number = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    
    const initialCount = this.events.length;
    this.events = this.events.filter(event => 
      new Date(event.timestamp) > cutoff
    );
    
    const removedCount = initialCount - this.events.length;
    console.log(`🧹 Cleared ${removedCount} old events from EventStore`);
  }
}

export const eventStore = new EventStore(); 