import React, { useState, useRef } from 'react';
import {
  PlusIcon,
  ArrowUpIcon,
  BookOpenIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import ResponseTabs from './ResponseTabs';
import { useTheme } from './layout/ThemeContext';

interface Message {
  role: 'user' | 'assistant';
  content: string | any;
  type?: 'optimization' | 'rag' | 'hybrid' | string;
  error?: boolean;
}

interface AgentChatProps {
  placeholder?: string;
  apiEndpoint: string;
  showSmartPrompts?: boolean;
}

const AgentChat: React.FC<AgentChatProps> = ({
  placeholder = 'How can I help you today?',
  apiEndpoint,
  showSmartPrompts = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const smartPrompts = [
    {
      id: 'rag',
      title: 'Knowledge Base Search',
      description: 'Search construction best practices',
      prompt:
        'What are the best practices for concrete curing in cold weather conditions?',
      icon: BookOpenIcon,
    },
    {
      id: 'optimization',
      title: 'Crew Optimization',
      description: 'Optimize crew allocation and scheduling',
      prompt:
        'Optimize crew allocation for a 3-story office building project. We need to minimize project duration while ensuring we have at least 2 carpenters, 2 electricians, 1 plumber, and 1 HVAC technician. Maximum 15 workers on site at any time.',
      icon: ChartBarIcon,
    },
    {
      id: 'hybrid',
      title: 'Smart Analysis',
      description: 'Combine knowledge + optimization',
      prompt:
        'First check construction best practices for cold weather concrete curing, then optimize our crew schedule for a 3-story office building considering those constraints. We have 15 workers maximum and need at least 2 carpenters, 2 electricians, 1 plumber, and 1 HVAC technician.',
      icon: SparklesIcon,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePromptSelect = (prompt: string) => {
    setMessage(prompt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    setMessages([...messages, { role: 'user', content: message }]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
        credentials: 'same-origin',
      });

      const data = await response.json();
      console.log('API response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      const newMessage: Message = {
        role: 'assistant',
        content: data.type === 'agentic' ? data.content : data.message,
        type: data.type
      };

      setMessages((messages) => [...messages, newMessage]);
    } catch (error) {
      setMessages((messages) => [
        ...messages,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="w-full h-full px-8">
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Input Area at Top */}
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm mb-8">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={placeholder}
            rows={2}
            className="w-full p-4 bg-transparent border-0 resize-none focus:ring-0 text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            style={{ minHeight: '80px' }}
          />

          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                <PlusIcon className="w-5 h-5" />
              </button>

              {showSmartPrompts && (
                <>
                  {smartPrompts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePromptSelect(p.prompt)}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                      title={p.title}
                    >
                      <p.icon className="w-5 h-5" />
                    </button>
                  ))}
                </>
              )}
            </div>

            <button
              onClick={handleSubmit}
              type="button"
              className="p-2 rounded-lg bg-[#FF7F50] hover:bg-[#FF6347] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={!message.trim() || isLoading}
            >
              <ArrowUpIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                } w-full`}
              >
                <div
                  className={`${
                    msg.role === 'user'
                      ? 'bg-[#FF7F50] text-white'
                      : theme === 'dark'
                      ? 'bg-gray-800'
                      : 'bg-gray-50'
                  } ${msg.error ? 'border-red-500' : ''} ${
                    ['optimization', 'rag', 'hybrid'].includes(msg.type || '') ? 'w-full' : 'max-w-[85%]'
                  } rounded-lg p-6 shadow-sm`}
                >
                  {['optimization', 'rag', 'hybrid'].includes(msg.type || '') ? (
                    <div className="w-full">
                      <ResponseTabs content={msg.content} />
                    </div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="prose dark:prose-invert max-w-none mb-4 last:mb-0">
                            {children}
                          </p>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {typeof msg.content === 'string'
                        ? msg.content
                        : JSON.stringify(msg.content, null, 2)}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start w-full">
                <div
                  className={`w-[85%] rounded-lg p-6 shadow-sm ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-[#FF7F50] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#FF7F50] rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-[#FF7F50] rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;