import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import { sendMessageToAgno, AgnoError, AgnoResponse } from '@/lib/agno';
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

interface FinanceAgentProps {
  initialMessage?: string;
}

const FinanceAgent: React.FC<FinanceAgentProps> = ({ initialMessage = "Hello! I'm your DcisionAI Finance Assistant. How can I help you today?" }) => {
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
      const response = await sendMessageToAgno(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        usage: response.usage,
        model: response.model
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof AgnoError ? error.message : 'An unexpected error occurred',
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
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            {children}
                          </table>
                        </div>
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
            placeholder="Ask about market trends, investments, or financial planning..."
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

export default FinanceAgent; 