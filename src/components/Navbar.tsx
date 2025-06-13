import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Cog8ToothIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from './layout/ThemeContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between px-8 h-16 \
      bg-[#F7F3ED] border-b border-[#EFE9DA] text-[#18181b] \
      dark:bg-[#0D1117] dark:border-[#21262D] dark:text-[#E7E9EB] \
      sticky top-0 z-20 transition-colors duration-300">
      <div className="flex items-center gap-2">
        
      </div>
      <nav className="flex items-center gap-8 text-sm">
        {/* Navigation Links */}
        
        <Link href="/docs" legacyBehavior>
          <a
            className={
              router.pathname === '/docs'
                ? 'text-docs-accent dark:text-docs-accent font-semibold'
                : 'text-docs-muted dark:text-docs-dark-muted hover:text-docs-accent dark:hover:text-docs-accent'
            }
          >
            Docs
          </a>
        </Link>
        <Link href="/api-reference" legacyBehavior>
          <a
            className={
              router.pathname.startsWith('/api-reference')
                ? 'text-docs-accent dark:text-docs-accent font-semibold'
                : 'text-docs-muted dark:text-docs-dark-muted hover:text-docs-accent dark:hover:text-docs-accent'
            }
          >
            API reference
          </a>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="ml-2 p-2 rounded hover:bg-docs-section transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <SunIcon className="h-5 w-5 text-yellow-400" />
          ) : (
            <MoonIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Settings Link */}
        <Link href="/settings/organization" legacyBehavior>
          <a
            className={
              router.pathname.startsWith('/settings')
                ? 'text-docs-accent dark:text-docs-accent'
                : 'text-docs-muted dark:text-docs-dark-muted hover:text-docs-accent dark:hover:text-docs-accent'
            }
          >
            <Cog8ToothIcon className="h-5 w-5" />
          </a>
        </Link>
      </nav>
    </header>
  );
} 