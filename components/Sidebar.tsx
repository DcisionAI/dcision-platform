import Link from 'next/link';
import { useRouter } from 'next/router';

const menu = [
  {
    section: 'DECISION WORKFLOWS',
    items: [
      { href: '/fleet-routing', label: 'Fleet & Routing' },
      { href: '/workforce-scheduling', label: 'Workforce Scheduling' },
      { href: '/project-scheduling', label: 'Project Scheduling' },
      { href: '/resource-allocation', label: 'Resource Allocation' },
      { href: '/custom-templates', label: 'Custom Templates' },
    ],
  },
  {
    section: 'PLATFORM CONCEPTS',
    items: [
      { href: '/#', label: 'Agents' },
      { href: '/#', label: 'Data Integration' },
      { href: '/#', label: 'Explainability' },
      { href: '/#', label: 'Sessions & Results' },
      { href: '/#', label: 'API Reference' },
    ],
  }
];

export default function Sidebar() {
  const router = useRouter();
  return (
    <aside className="bg-docs-sidebar border-r border-docs-section-border p-4 w-64 min-h-screen sticky top-16">
      {menu.map((group, idx) => (
        <div className="mb-6" key={group.section + idx}>
          {group.section && (
            <div className="uppercase text-xs text-docs-muted font-bold mb-2 tracking-wider">{group.section}</div>
          )}
          <div className="flex flex-col gap-1">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 text-docs-text text-xs hover:bg-docs-sidebar-active hover:text-docs-accent transition font-medium ${
                  router.pathname === item.href ? 'bg-docs-sidebar-active text-docs-accent font-semibold' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
} 