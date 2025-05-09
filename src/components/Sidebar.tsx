import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { 
  TruckIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  CubeIcon, 
  BeakerIcon,
  ArrowsPointingInIcon,
  LightBulbIcon,
  CloudArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RectangleGroupIcon,
  ChartBarIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

const menu = [
  {
    section: '',
    items: [
      { href: '/modelbuilder', label: 'Dcision Builder', icon: CodeBracketIcon },
      { href: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
      { href: '/agents', label: 'Agents', icon: BeakerIcon },
      { href: '/explainability', label: 'Explainability', icon: LightBulbIcon },
      { href: '/endpoints', label: 'Endpoints', icon: CloudArrowUpIcon },
    ],
  },
  {
    section: 'DECISION WORKFLOWS',
    items: [
      { href: '/fleet-routing', label: 'Fleet & Routing', icon: TruckIcon },
      { href: '/workforce-scheduling', label: 'Workforce Scheduling', icon: UserGroupIcon },
      { href: '/project-scheduling', label: 'Project Scheduling', icon: CalendarIcon },
      { href: '/resource-allocation', label: 'Resource Allocation', icon: CubeIcon },
    ],
  }
  
];

export default function Sidebar() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);

  const isActive = (href: string) => {
    if (router.pathname === '/') return href === '/playground';
    return router.pathname === href;
  };

  return (
    <aside
      className={`bg-docs-sidebar border-r border-docs-section-border min-h-screen sticky top-16 transition-all duration-300 ease-in-out flex ${
        isExpanded ? 'w-50' : 'w-16'
      }`}
    >
      <div className={`flex-1 ${isExpanded ? 'p-2' : 'p-2'}`}>
        {menu.map((group, idx) => (
          <div className="mb-8" key={group.section + idx}>
            {isExpanded && group.section && (
              <div className="uppercase text-xs text-docs-muted font-bold mb-3 tracking-wider pl-4">
                {group.section}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg flex items-center gap-4 ${
                      isExpanded ? 'px-4 py-2.5' : 'p-2 justify-center'
                    } text-docs-text hover:bg-docs-sidebar-active hover:text-docs-accent transition font-medium group ${
                      isActive(item.href) ? 'bg-docs-sidebar-active text-docs-accent font-semibold' : ''
                    }`}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon className={`${isExpanded ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0`} />
                    {isExpanded && <span className="text-sm">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-12 w-6 flex items-center justify-center hover:bg-docs-sidebar-active transition-colors absolute -right-3 top-2 rounded-r"
      >
        {isExpanded ? (
          <ChevronLeftIcon className="h-4 w-4 text-docs-muted" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-docs-muted" />
        )}
      </button>
    </aside>
  );
} 