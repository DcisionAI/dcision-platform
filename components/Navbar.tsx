import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar() {
  const router = useRouter();
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
        <button className="text-docs-muted hover:text-docs-accent">
          <span className="material-icons">Settings</span>
        </button>
        <span className="rounded-full bg-docs-section w-8 h-8 flex items-center justify-center text-docs-text font-bold text-base">A</span>
      </nav>
    </header>
  );
} 