import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderIcon,
  BeakerIcon,
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  KeyIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useSidebar } from './layout/SidebarContext';
import { useTheme } from './layout/ThemeContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const projectManagement: NavItem[] = [
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Create Project', href: '/projects/new', icon: DocumentDuplicateIcon },
  { name: 'Team', href: '/team', icon: UserGroupIcon },
];

const modelDevelopment: NavItem[] = [
  { name: 'Model Builder', href: '/modelbuilder', icon: BeakerIcon },
  { name: 'Model Library', href: '/models', icon: ChartBarIcon },
  { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon },
];

const workflows: NavItem[] = [
  { name: 'Construction', href: '/construction', icon: BeakerIcon },
  { name: 'Retail', href: '/retail', icon: ChartBarIcon },
  { name: 'Finance', href: '/finance', icon: DocumentDuplicateIcon },
];

const deployment: NavItem[] = [
  
];

const multiModalInterface: NavItem[] = [
  { name: 'Chat Interface', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'API Reference', href: '/api', icon: CodeBracketIcon },
  { name: 'Usage Analytics', href: '/analytics', icon: ChartBarIcon },
];

const settings: NavItem[] = [
  { name: 'Deployments', href: '/deployments', icon: RocketLaunchIcon },
  { name: 'Endpoints', href: '/endpoints', icon: CodeBracketIcon },
  { name: 'API Keys', href: '/settings/api-keys', icon: KeyIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const sections = [
  { title: 'Dcision Workflows', items: workflows },
  { title: 'Dcision Canvas', items: modelDevelopment },
  { title: 'Settings', items: settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, toggleSidebar, setIsExpanded } = useSidebar();
  const { theme } = useTheme();

  const navItemClass = (isActive: boolean) =>
    `flex items-center rounded-lg transition-colors sidebar-link font-sans text-base font-medium tracking-wide px-2 py-1.5 my-0.5
    ${isActive
      ? 'bg-[#ede9dd] text-[#18181b] dark:bg-[#1C2128] dark:text-[#ECEDEE]'
      : 'text-[#18181b] dark:text-docs-dark-muted dark:hover:bg-[#2D333B]'}
    `;

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 border-r transition-all duration-300
        ${isExpanded ? 'w-64' : 'w-14'}
        bg-docs-sidebar text-docs-text border-docs-section-border dark:bg-docs-dark-bg dark:text-white dark:border-[#21262D]`
      }
    >
      {/* Branding/Header */}
      <div className="flex items-center h-16 mb-4 pl-6 justify-start">
        <Link href="/dashboard" legacyBehavior>
          <a className="flex items-center focus:outline-none">
            {isExpanded ? (
              <span className="font-bold text-xl text-docs-text dark:text-docs-dark-text">DcisionAI</span>
            ) : (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#18181b" />
                <text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold" fontFamily="Inter, Arial, sans-serif">D</text>
              </svg>
            )}
          </a>
        </Link>
      </div>

      {/* Carat button always visible */}
      <button
        onClick={toggleSidebar}
        className={`absolute right-0 top-4 bg-docs-sidebar-active dark:bg-[#1C2128] h-8 w-4 flex items-center justify-center rounded-l-lg hover:bg-[#e0d7c6] dark:hover:bg-[#2D333B] transition-colors z-40`}
        style={{ right: isExpanded ? 0 : '-1rem' }}
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isExpanded ? (
          <ChevronLeftIcon className="w-3 h-3 text-[#8B949E] dark:text-[#ECEDEE]" />
        ) : (
          <ChevronRightIcon className="w-3 h-3 text-[#8B949E] dark:text-[#ECEDEE]" />
        )}
      </button>

      {/* Sidebar content */}
      <div className="pt-12 px-2">
        {sections.map((section) => (
          <div key={section.title} className="mb-2 pt-6">
            {isExpanded && (
              <div className="text-xs font-bold uppercase tracking-wider text-docs-muted dark:text-docs-dark-muted mb-1 pl-2">
                {section.title}
              </div>
            )}
            <nav className="pt-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={navItemClass(isActive)}
                    title={item.name}
                  >
                    <Icon className="w-5 h-5 mr-2 text-docs-muted dark:text-docs-dark-muted" />
                    {isExpanded && (
                      <span className="text-sm text-docs-muted dark:text-docs-dark-muted hover:text-docs-accent dark:hover:text-docs-accent">{item.name}</span>
                    )}
                    {item.badge && isExpanded && (
                      <span>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
} 