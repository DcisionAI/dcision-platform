type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };
type Handler = (msg: Message) => void;

class MessageBus {
  private handlers: { [type: string]: Handler[] } = {};

  subscribe(type: string, handler: Handler) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(handler);
  }

  publish(msg: Message) {
    (this.handlers[msg.type] || []).forEach(h => h(msg));
  }
}

export const messageBus = new MessageBus(); 