import { Session } from '../sessions/types';

export class OrchestrationContext {
  private session: Session;
  private state: Map<string, any>;

  constructor(session: Session) {
    this.session = session;
    this.state = new Map();
  }

  getSession(): Session {
    return this.session;
  }

  setState(key: string, value: any) {
    this.state.set(key, value);
  }

  getState(key: string): any {
    return this.state.get(key);
  }
}
