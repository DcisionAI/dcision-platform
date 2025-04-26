import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TruckIcon, 
  UsersIcon, 
  CalendarIcon, 
  CubeIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  ArrowsPointingInIcon,
  LightBulbIcon,
  ChartBarIcon,
  CodeBracketIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const decisionWorkflows: NavItem[] = [
  { name: 'Fleet & Routing', href: '/fleet-routing', icon: TruckIcon },
  { name: 'Workforce Scheduling', href: '/workforce', icon: UsersIcon },
  { name: 'Project Scheduling', href: '/project', icon: CalendarIcon },
  { name: 'Resource Allocation', href: '/resource', icon: CubeIcon },
  { name: 'Custom Templates', href: '/templates', icon: DocumentDuplicateIcon },
];

const platformConcepts: NavItem[] = [
  { name: 'Agents', href: '/agents', icon: BeakerIcon },
  { name: 'Data Integration', href: '/data-integration', icon: ArrowsPointingInIcon },
  { name: 'Explainability', href: '/explainability', icon: LightBulbIcon },
  { name: 'Sessions & Results', href: '/sessions', icon: ChartBarIcon },
  { name: 'API Reference', href: '/api', icon: CodeBracketIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const handleToggle = (event: CustomEvent) => {
      setIsExpanded(event.detail.show);
    };

    // Add event listener
    window.addEventListener('toggle-sidebar', handleToggle as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle as EventListener);
    };
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`fixed top-0 left-0 h-screen bg-[#0D1117] border-r border-[#21262D] transition-all duration-300 ${
        isExpanded ? 'w-56' : 'w-16'
      } overflow-hidden`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute right-0 top-4 bg-[#1C2128] h-8 w-5 flex items-center justify-center rounded-l-lg hover:bg-[#2D333B] transition-colors"
      >
        {isExpanded ? (
          <ChevronLeftIcon className="w-4 h-4 text-[#8B949E]" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-[#8B949E]" />
        )}
      </button>

      <div className={`p-4 ${isExpanded ? '' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-sm font-medium text-[#8B949E] tracking-wider">DECISION WORKFLOWS</h2>
        </div>
        <nav className="space-y-1 mb-8">
          {decisionWorkflows.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#1F6FEB] text-white'
                    : 'text-[#8B949E] hover:bg-[#21262D] hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mb-4">
          <h2 className="text-sm font-medium text-[#8B949E] tracking-wider">PLATFORM CONCEPTS</h2>
        </div>
        <nav className="space-y-1">
          {platformConcepts.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#1F6FEB] text-white'
                    : 'text-[#8B949E] hover:bg-[#21262D] hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Collapsed state - only show icons */}
      <div className={`p-4 ${isExpanded ? 'hidden' : 'block'}`}>
        <nav className="space-y-1">
          {[...decisionWorkflows, ...platformConcepts].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#1F6FEB] text-white'
                    : 'text-[#8B949E] hover:bg-[#21262D] hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 