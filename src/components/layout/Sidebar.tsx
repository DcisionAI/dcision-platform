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
  KeyIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const decisionWorkflows: NavItem[] = [
  { name: 'Fleet & Routing', href: '/fleet-routing', icon: TruckIcon },
  { name: 'Workforce Scheduling', href: '/workforce-scheduling', icon: UsersIcon },
  { name: 'Project Scheduling', href: '/project-scheduling', icon: CalendarIcon },
  { name: 'Resource Allocation', href: '/resource-allocation', icon: CubeIcon },
  { name: 'Custom Templates', href: '/custom-templates', icon: DocumentDuplicateIcon },
];

const platformConcepts: NavItem[] = [
  { name: 'Agents', href: '/agents', icon: BeakerIcon },
  { name: 'Data Integration', href: '/data-integration', icon: ArrowsPointingInIcon },
  { name: 'Explainability', href: '/explainability', icon: LightBulbIcon },
  { name: 'Sessions & Results', href: '/sessions', icon: ChartBarIcon },
  { name: 'API Reference', href: '/api', icon: CodeBracketIcon },
  { name: 'API Usage', href: '/settings/usage', icon: ChartBarIcon },
  { name: 'API Keys', href: '/settings/api-keys', icon: KeyIcon },
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
        isExpanded ? 'w-48' : 'w-14'
      } overflow-hidden`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute right-0 top-4 bg-[#1C2128] h-8 w-4 flex items-center justify-center rounded-l-lg hover:bg-[#2D333B] transition-colors"
      >
        {isExpanded ? (
          <ChevronLeftIcon className="w-3 h-3 text-[#8B949E]" />
        ) : (
          <ChevronRightIcon className="w-3 h-3 text-[#8B949E]" />
        )}
      </button>

      <div className={`p-3 ${isExpanded ? '' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">DECISION WORKFLOWS</h2>
        </div>
        <nav className="sidebar-menu space-y-0.5 mb-6">
          {decisionWorkflows.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-1.5 rounded-md transition-colors sidebar-link ${
                  isActive
                    ? 'active'
                    : ''
                }`}
              >
                <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} sidebar-link-text`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mb-3">
          <h2 className="section-title">PLATFORM CONCEPTS</h2>
        </div>
        <nav className="sidebar-menu space-y-0.5">
          {platformConcepts.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-1.5 rounded-md transition-colors sidebar-link ${
                  isActive
                    ? 'active'
                    : ''
                }`}
              >
                <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} sidebar-link-text`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Collapsed state - only show icons */}
      <div className={`p-2 ${isExpanded ? 'hidden' : 'block'}`}>
        <nav className="sidebar-menu space-y-1">
          {[...decisionWorkflows, ...platformConcepts].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`flex items-center justify-center p-1.5 rounded-md transition-colors sidebar-link ${
                  isActive
                    ? 'active'
                    : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 