import React, { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  ArrowUpIcon,
  BookOpenIcon,
  ChartBarIcon,
  SparklesIcon,
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlayIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import ResponseTabs from './ResponseTabs';
import AgentProgress, { ProgressEvent } from './AgentProgress';
import { useTheme } from './layout/ThemeContext';

interface Message {
  role: 'user' | 'assistant';
  content: string | any;
  type?: 'optimization' | 'rag' | 'hybrid' | string;
  error?: boolean;
  progressEvents?: ProgressEvent[];
  timestamps?: any;
  sessionId?: string;
  confidence?: number;
  lastMessage?: string;
}

interface Session {
  id: string;
  title: string;
  timestamp: string;
  status: 'active' | 'completed' | 'error';
  messageCount: number;
  decisionType?: string;
  confidence?: number;
  lastMessage?: string;
}

interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
}

interface EnhancedAgentChatProps {
  placeholder?: string;
  apiEndpoint?: string;
  showSmartPrompts?: boolean;
  useOrchestration?: boolean;
}

const EnhancedAgentChat: React.FC<EnhancedAgentChatProps> = ({
  placeholder = 'How can I help you today?',
  apiEndpoint = '/api/dcisionai/construction/chat',
  showSmartPrompts = false,
  useOrchestration = true,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [showSessionHistory, setShowSessionHistory] = useState(true);
  const [showAgentFlow, setShowAgentFlow] = useState(true);
  const [isSessionHistoryCollapsed, setIsSessionHistoryCollapsed] = useState(false);
  const [isAgentFlowCollapsed, setIsAgentFlowCollapsed] = useState(false);
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
    {
      id: 'orchestration',
      title: 'Full Orchestration',
      description: 'Complete agent workflow',
      prompt: 'Analyze our construction project data and provide comprehensive optimization with knowledge base insights. Project: 3-story office building, 6-month timeline, budget $2M, 20 workers available.',
      icon: CogIcon,
    },
  ];

  // Auto-collapse session history when there are messages (chat is active)
  useEffect(() => {
    if (messages.length > 0 && !isSessionHistoryCollapsed) {
      setIsSessionHistoryCollapsed(true);
    }
  }, [messages.length]);

  // Initialize with a default session
  useEffect(() => {
    const defaultSession: Session = {
      id: 'default-session',
      title: 'New Session',
      timestamp: new Date().toISOString(),
      status: 'active',
      messageCount: 0,
    };
    setSessions([defaultSession]);
    setCurrentSessionId('default-session');
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePromptSelect = (prompt: string) => {
    setMessage(prompt);
  };

  const createNewSession = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: 'New Session',
      timestamp: new Date().toISOString(),
      status: 'active',
      messageCount: 0,
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    // Expand session history when creating new session
    setIsSessionHistoryCollapsed(false);
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // In a real implementation, you'd load messages for this session
    // For now, we'll just clear messages
    setMessages([]);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const newMessage: Message = { 
      role: 'user', 
      content: message,
      sessionId: currentSessionId || undefined
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);

    // Update session with new message
    if (currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messageCount: s.messageCount + 1, lastMessage: message }
          : s
      ));
    }

    // Initialize agent statuses
    const initialAgentStatuses: AgentStatus[] = [
      { name: 'Intent Agent', status: 'running' },
      { name: 'Data Agent', status: 'idle' },
      { name: 'Model Builder', status: 'idle' },
      { name: 'Solver', status: 'idle' },
      { name: 'Explain Agent', status: 'idle' },
    ];
    setAgentStatuses(initialAgentStatuses);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          customerData: {},
          useOrchestration,
          sessionId: currentSessionId
        }),
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: ['optimization', 'rag', 'hybrid'].includes(data.type) ? data.content : data.message,
        type: data.type,
        progressEvents: data.content?.progressEvents || [],
        timestamps: data.content?.timestamps,
        sessionId: currentSessionId || undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update session with response
      if (currentSessionId) {
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { 
                ...s, 
                messageCount: s.messageCount + 1,
                status: 'completed',
                decisionType: data.content?.intentAgentAnalysis?.decisionType,
                confidence: data.content?.intentAgentAnalysis?.confidence
              }
            : s
        ));
      }

      // Update agent statuses based on progress events
      if (data.content?.progressEvents && Array.isArray(data.content.progressEvents)) {
        const updatedStatuses = initialAgentStatuses.map(agent => {
          const agentName = agent.name.split(' ')[0].toLowerCase();
          const hasError = data.content.progressEvents.some((e: ProgressEvent) => e.step.toLowerCase() === agentName && e.status === 'error');
          const isComplete = data.content.progressEvents.some((e: ProgressEvent) => e.step.toLowerCase() === agentName && e.status === 'complete');

          if (hasError) {
            return { ...agent, status: 'error' as const };
          }
          if (isComplete) {
            return { ...agent, status: 'completed' as const };
          }
          // If the agent is the first in the list and is not complete or errored, it must be running
          if (agent.name === initialAgentStatuses[0].name && !isComplete && !hasError) {
              return { ...agent, status: 'running' as const };
          }
          return agent; // Keep idle status if no events match
        });
        setAgentStatuses(updatedStatuses);
      } else {
        // If no progress events, mark all as complete
        setAgentStatuses(prev => prev.map(agent => ({ ...agent, status: 'completed' })));
      }

    } catch (error) {
      console.error("Error processing chat message:", error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          error: true,
          sessionId: currentSessionId || undefined
        },
      ]);
      
      // Update agent statuses to error
      setAgentStatuses(prev => prev.map(agent => ({
        ...agent,
        status: agent.status === 'running' ? 'error' : agent.status,
      })));
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />;
      case 'running':
        return <PlayIcon className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAgentStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />;
      case 'running':
        return <PlayIcon className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const lastAssistantMessage = messages.slice().reverse().find(msg => msg.role === 'assistant');
  const progressEvents = lastAssistantMessage?.progressEvents || [];

  return (
    <div className="flex h-full bg-docs-bg dark:bg-docs-dark-bg">
      {/* Left Panel - Session History */}
      <div className={`border-r border-docs-section-border dark:border-gray-700 bg-docs-sidebar dark:bg-docs-dark-bg flex flex-col transition-all duration-300 ${
        isSessionHistoryCollapsed ? 'w-12' : 'w-64'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-docs-section-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isSessionHistoryCollapsed && (
              <h3 className="text-sm font-semibold text-docs-text dark:text-docs-dark-text">
                Sessions
              </h3>
            )}
            <div className="flex items-center space-x-1">
              {!isSessionHistoryCollapsed && (
                <button
                  onClick={createNewSession}
                  className="p-1 rounded hover:bg-docs-hover dark:hover:bg-gray-700"
                  title="New Session"
                >
                  <PlusIcon className="w-4 h-4 text-docs-muted dark:text-docs-dark-muted" />
                </button>
              )}
              <button
                onClick={() => setIsSessionHistoryCollapsed(!isSessionHistoryCollapsed)}
                className="p-1 rounded hover:bg-docs-hover dark:hover:bg-gray-700"
                title={isSessionHistoryCollapsed ? "Expand Sessions" : "Collapse Sessions"}
              >
                {isSessionHistoryCollapsed ? (
                  <ChevronRightIcon className="w-4 h-4 text-docs-muted dark:text-docs-dark-muted" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4 text-docs-muted dark:text-docs-dark-muted" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {isSessionHistoryCollapsed ? (
            // Collapsed view - just icons
            <div className="p-2 space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  className={`w-full p-2 rounded transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-docs-accent/10 text-docs-accent'
                      : 'hover:bg-docs-hover dark:hover:bg-gray-700/50 text-docs-muted dark:text-docs-dark-muted'
                  }`}
                  title={session.title}
                >
                  {getStatusIcon(session.status)}
                </button>
              ))}
            </div>
          ) : (
            // Expanded view - full session details
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 border-b border-docs-section-border dark:border-gray-700 cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-docs-accent/10 border-l-2 border-docs-accent'
                    : 'hover:bg-docs-hover dark:hover:bg-gray-700/50'
                }`}
                onClick={() => switchSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(session.status)}
                      <h4 className="text-sm font-medium text-docs-text dark:text-docs-dark-text truncate">
                        {session.title}
                      </h4>
                    </div>
                    <p className="text-xs text-docs-muted dark:text-docs-dark-muted mt-1">
                      {formatTimestamp(session.timestamp)}
                    </p>
                    {session.lastMessage && (
                      <p className="text-xs text-docs-muted dark:text-docs-dark-muted mt-1 truncate">
                        {session.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-docs-muted dark:text-docs-dark-muted">
                        {session.messageCount} messages
                      </span>
                      {session.decisionType && (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                          {session.decisionType}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Session"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Center Panel - Chat + Responses */}
      <div className="flex-1 flex flex-col min-w-0">
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

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
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
                      <ResponseTabs
                        content={
                          msg.content?.explanation
                            ? { ...msg.content, ...msg.content.explanation }
                            : {
                                ...msg.content,
                                visualization: msg.content.mermaidDiagram,
                              }
                        }
                      />
                    </div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="prose dark:prose-invert max-w-none mb-4 last:mb-0">
                            {children}
                          </p>
                        ),
                      }}
                    >
                      {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Right Panel - Agent Flow */}
      <div className={`border-l border-docs-section-border dark:border-gray-700 bg-docs-sidebar dark:bg-docs-dark-bg flex flex-col transition-all duration-300 ${
        isAgentFlowCollapsed ? 'w-12' : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-docs-section-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isAgentFlowCollapsed && (
              <h3 className="text-sm font-semibold text-docs-text dark:text-docs-dark-text">
                Agent Flow
              </h3>
            )}
            <button
              onClick={() => setIsAgentFlowCollapsed(!isAgentFlowCollapsed)}
              className="p-1 rounded hover:bg-docs-hover dark:hover:bg-gray-700"
              title={isAgentFlowCollapsed ? "Expand Agent Flow" : "Collapse Agent Flow"}
            >
              {isAgentFlowCollapsed ? (
                <ChevronLeftIcon className="w-4 h-4 text-docs-muted dark:text-docs-dark-muted" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-docs-muted dark:text-docs-dark-muted" />
              )}
            </button>
          </div>
        </div>

        {/* Agent Status List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isAgentFlowCollapsed ? (
            // Collapsed view - just status icons
            <div className="space-y-3">
              {agentStatuses.map((agent, index) => (
                <div
                  key={index}
                  className="flex justify-center"
                  title={`${agent.name}: ${agent.status}`}
                >
                  {getAgentStatusIcon(agent.status)}
                </div>
              ))}
            </div>
          ) : (
            // Expanded view - full agent details
            <AgentProgress events={progressEvents} isActive={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAgentChat; 