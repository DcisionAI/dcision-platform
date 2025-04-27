import { Fragment } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/router';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Quickstart', href: '/quickstart' },
  { name: 'Playground', href: '/playground' },
  { name: 'Docs', href: '/docs' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function Navbar() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  return (
    <nav className="bg-gray-900">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="text-2xl font-bold text-white">DcisionAI</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      router.pathname === item.href
                        ? 'text-white'
                        : 'text-gray-300 hover:text-white',
                      'px-3 py-2 rounded-md text-sm font-medium'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <Menu as="div" className="relative ml-3">
              <div>
                <Menu.Button className="flex items-center rounded-md bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-md bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">A</span>
                    </div>
                    <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        className={classNames(
                          active ? 'bg-gray-700' : '',
                          'block w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white'
                        )}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
} 