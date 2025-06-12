import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  model?: string;
}

export interface AgentChatProps {
  sendMessage: (message: string) => Promise<{
    message: string;
    usage?: { input_tokens: number; output_tokens: number };
    model?: string;
  }>;
  initialMessage?: string;
  placeholder?: string;
}

const AgentChat: React.FC<AgentChatProps> = ({
  sendMessage,
  initialMessage = "Hello! I'm your DcisionAI Assistant. How can I help you today?",
  placeholder = 'Ask a question...'
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMessage }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        usage: response.usage,
        model: response.model
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error?.message || 'An unexpected error occurred',
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'docs-dark-bg' : 'docs-bg'}`}>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-docs-accent text-white'
                  : message.error
                  ? 'bg-red-100 dark:bg-red-900'
                  : theme === 'dark'
                  ? 'bg-docs-dark-bg border border-docs-dark-muted'
                  : 'bg-docs-section'
              }`}
            >
              <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      return (
                        <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto">
                          <table
                            className={`min-w-full border-collapse rounded-lg overflow-hidden ${
                              theme === 'dark'
                                ? 'bg-[#23272e] text-[#ECEDEE]' // dark bg, light text
                                : 'bg-white text-[#18181b]' // light bg, dark text
                            }`}
                          >
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th
                          className={`px-4 py-2 border-b font-semibold text-left ${
                            theme === 'dark'
                              ? 'bg-[#23272e] text-[#ECEDEE] border-[#363b42]'
                              : 'bg-[#f5f5f5] text-[#18181b] border-[#e5e7eb]'
                          }`}
                        >
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td
                          className={`px-4 py-2 border-b ${
                            theme === 'dark'
                              ? 'bg-[#18181b] text-[#ECEDEE] border-[#363b42]'
                              : 'bg-white text-[#18181b] border-[#e5e7eb]'
                          }`}
                        >
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.usage && (
                <div className={`mt-2 text-xs ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                  Tokens: {message.usage.input_tokens + message.usage.output_tokens} | Model: {message.model}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`max-w-[80%] rounded-lg p-4 ${
              theme === 'dark' ? 'bg-docs-dark-bg border border-docs-dark-muted' : 'bg-docs-section'
            }`}>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-docs-accent rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-docs-accent rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-docs-accent rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-docs-section-border">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 p-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
                : 'bg-white border-docs-muted text-docs-text'
            } focus:outline-none focus:ring-2 focus:ring-docs-accent`}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg ${
              isLoading
                ? 'bg-gray-400'
                : 'bg-docs-accent hover:bg-opacity-90'
            } text-white transition-colors`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentChat; 