import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Cog8ToothIcon } from '@heroicons/react/24/outline';
import { useAuthContext } from './auth/AuthProvider';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, loading } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user's initials or first letter of email
  const getUserInitials = () => {
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between px-8 h-16 bg-docs-bg border-b border-docs-section-border sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" legacyBehavior>
          <a className="font-bold text-lg text-docs-text">DcisionAI</a>
        </Link>
      </div>
      <nav className="flex items-center gap-8 text-sm">
        {/* Navigation Links */}
        <Link href="/playground" legacyBehavior>
          <a className={router.pathname === '/playground' ? 'text-docs-accent font-semibold' : 'text-docs-muted hover:text-docs-accent'}>
            Playground
          </a>
        </Link>
        <Link href="/modelbuilder" legacyBehavior>
          <a className={router.pathname === '/modelbuilder' ? 'text-docs-accent font-semibold' : 'text-docs-muted hover:text-docs-accent'}>
            Model Builder
          </a>
        </Link>
        
        <Link href="/docs" legacyBehavior>
          <a className={router.pathname === '/docs' ? 'text-docs-accent font-semibold' : 'text-docs-muted hover:text-docs-accent'}>
            Docs
          </a>
        </Link>
        <Link href="/docs" legacyBehavior>
          <a className={router.pathname === '/docs' ? 'text-docs-accent font-semibold' : 'text-docs-muted hover:text-docs-accent'}>
            API reference
          </a>
        </Link>

        {/* Settings Link */}
        {user && (
          <Link href="/settings/organization" legacyBehavior>
            <a className={`text-docs-muted hover:text-docs-accent ${router.pathname.startsWith('/settings') ? 'text-docs-accent' : ''}`}>
              <Cog8ToothIcon className="h-5 w-5" />
            </a>
          </Link>
        )}
        
        {/* Auth/Profile Menu */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-docs-section animate-pulse" />
        ) : user ? (
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-1 focus:outline-none">
              <span className="rounded-full bg-docs-section w-8 h-8 flex items-center justify-center text-docs-text font-bold text-base">
                {getUserInitials()}
              </span>
              <ChevronDownIcon className="h-4 w-4 text-docs-muted" aria-hidden="true" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-docs-bg py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 text-sm text-docs-text border-b border-docs-section-border">
                  {user.email}
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleSignOut}
                      className={classNames(
                        active ? 'bg-docs-section' : '',
                        'block w-full px-4 py-2 text-left text-sm text-docs-muted hover:text-docs-accent'
                      )}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" legacyBehavior>
              <a className="text-docs-muted hover:text-docs-accent">Sign in</a>
            </Link>
            <Link href="/auth/signup" legacyBehavior>
              <a className="px-4 py-2 rounded-md bg-docs-accent text-white hover:bg-docs-accent/90">
                Sign up
              </a>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
} 