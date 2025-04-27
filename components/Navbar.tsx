import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="flex items-center justify-between px-8 h-16 bg-docs-bg border-b border-docs-section-border sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <Link href="/" legacyBehavior>
          <a className="font-bold text-lg text-docs-text">DcisionAI</a>
        </Link>
      </div>
      <nav className="flex items-center gap-8 text-sm">
        <Link href="/dashboard" legacyBehavior>
          <a className={router.pathname === '/dashboard' ? 'text-docs-accent font-semibold' : 'text-docs-muted hover:text-docs-accent'}>
            Dashboard
          </a>
        </Link>       
        <Link href="/quickstart" legacyBehavior>
          <a className={router.pathname === '/quickstart' ? 'text-docs-accent font-semibold' : 'text-docs-muted hover:text-docs-accent'}>
            Quickstart
          </a>
        </Link>
        <Link href="/playground" legacyBehavior>
          <a className={router.pathname === '/playground' ? 'text-docs-accent font-semibold' : 'text-docs-muted hover:text-docs-accent'}>
            Playground
          </a>
        </Link>
        <Link href="/docs" legacyBehavior>
          <a className={router.pathname === '/docs' ? 'text-docs-accent font-semibold' : 'text-docs-muted hover:text-docs-accent'}>
            Docs
          </a>
        </Link>
        
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-1 focus:outline-none">
            <span className="rounded-full bg-docs-section w-8 h-8 flex items-center justify-center text-docs-text font-bold text-base">A</span>
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
      </nav>
    </header>
  );
} 