import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, useSidebar } from './layout/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
  sidebarOverride?: React.ReactNode;
  forceLoginModal?: boolean;
}

export default function Layout({ children, sidebarOverride, forceLoginModal }: LayoutProps) {
  return (
    <SidebarProvider>
      <SidebarLayout>
        <div className="min-h-screen flex flex-col bg-docs-bg text-docs-text dark:bg-docs-dark-bg dark:text-white transition-colors duration-300">
          <Navbar />
          <div className="flex flex-1">
            {sidebarOverride ? sidebarOverride : <Sidebar />}
            <main className="flex-1 p-8 bg-docs-bg text-docs-text dark:bg-docs-dark-bg dark:text-white transition-colors duration-300 text-base">{children}</main>
          </div>
        </div>
      </SidebarLayout>
    </SidebarProvider>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();
  return (
    <div>
      <Sidebar />
      <main
        className={`transition-all duration-300 min-h-screen bg-docs-bg text-docs-text dark:bg-docs-dark-bg dark:text-white ${
          isExpanded ? 'ml-64' : 'ml-14'
        }`}
      >
        {children}
      </main>
    </div>
  );
}