import React, { useState, useRef, useEffect } from 'react';
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
  progressEvents?: any[];
  timestamps?: any;
  sessionId?: string;
  confidence?: number;
  lastMessage?: string;
}

interface ExperimentalAgentChatProps {
  placeholder?: string;
  apiEndpoint?: string;
  showSmartPrompts?: boolean;
  useOrchestration?: boolean;
  onResponse?: (payload: { query: string; response: any }) => void;
}

const ExperimentalAgentChat: React.FC<ExperimentalAgentChatProps> = ({
  placeholder = 'How can I help you today?',
  apiEndpoint = '/api/dcisionai/agentic/chat',
  showSmartPrompts = false,
  useOrchestration = true,
  onResponse,
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const smartPrompts = [
    {
      id: 'rag',
      title: 'Knowledge Base Search',
      description: 'Search construction best practices',
      prompt: 'What are the best practices for concrete curing in cold weather conditions?',
      icon: BookOpenIcon,
    },
    {
      id: 'optimization',
      title: 'Crew Optimization',
      description: 'Optimize crew allocation and scheduling',
      prompt: 'Optimize crew allocation for a 3-story office building project. We need to minimize project duration while ensuring we have at least 2 carpenters, 2 electricians, 1 plumber, and 1 HVAC technician. Maximum 15 workers on site at any time.',
      icon: ChartBarIcon,
    },
    {
      id: 'hybrid',
      title: 'Smart Analysis',
      description: 'Combine knowledge + optimization',
      prompt: 'First check construction best practices for cold weather concrete curing, then optimize our crew schedule for a 3-story office building considering those constraints. We have 15 workers maximum and need at least 2 carpenters, 2 electricians, 1 plumber, and 1 HVAC technician.',
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
    const currentMessage = message;
    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: currentMessage,
          customerData: {},
          useOrchestration,
        }),
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // Handle agentic response format
      const responseContent = data.type === 'agentic' ? data.content : data;
      
      if (onResponse) {
        onResponse({ query: currentMessage, response: responseContent });
      }
    } catch (error) {
      if (onResponse) {
        onResponse({ query: message, response: { error: true, message: 'Sorry, there was an error processing your request.' } });
      }
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-docs-bg dark:bg-docs-dark-bg">
      {/* Input Area */}
      <div className="p-4 border-b border-docs-section-border dark:border-gray-700">
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
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
      </div>
    </div>
  );
};

export default ExperimentalAgentChat; 