import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import {
  BuildingOfficeIcon,
  KeyIcon,
  UserGroupIcon,
  CreditCardIcon,
  BellIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const settingsNav = [
  {
    href: '/settings/organization',
    label: 'Organization',
    icon: BuildingOfficeIcon,
    description: 'Manage organization settings and members'
  },
  {
    href: '/settings/api-keys',
    label: 'API Keys',
    icon: KeyIcon,
    description: 'Manage API keys for your organization'
  },
  {
    href: '/settings/team',
    label: 'Team',
    icon: UserGroupIcon,
    description: 'Manage team members and roles'
  },
  {
    href: '/settings/notifications',
    label: 'Notifications',
    icon: BellIcon,
    description: 'Configure notification preferences'
  },
  {
    href: '/settings/usage',
    label: 'Usage',
    icon: DocumentTextIcon,
    description: 'View API usage and limits'
  }
];

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const router = useRouter();

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-docs-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Settings Navigation */}
            <div className="w-64 flex-shrink-0">
              <nav className="space-y-1">
                {settingsNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-docs-sidebar-active text-docs-accent'
                          : 'text-docs-text hover:bg-docs-hover'
                      }`}
                    >
                      <Icon
                        className={`flex-shrink-0 h-5 w-5 ${
                          isActive ? 'text-docs-accent' : 'text-docs-muted group-hover:text-docs-text'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 