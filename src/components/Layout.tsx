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
      <div className="min-h-screen bg-docs-bg text-docs-text dark:bg-docs-dark-bg dark:text-white transition-colors duration-300">
        <Navbar />
        <div className="flex flex-1">
          {sidebarOverride ? sidebarOverride : <Sidebar />}
          <SidebarLayout>
            <main className="flex-1 bg-docs-bg text-docs-text dark:bg-docs-dark-bg dark:text-white transition-colors duration-300 text-base w-full">
              {children}
            </main>
          </SidebarLayout>
        </div>
      </div>
    </SidebarProvider>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();
  return (
    <div
      className={`transition-all duration-300 min-h-screen w-full bg-docs-bg text-docs-text dark:bg-docs-dark-bg dark:text-white flex-1 ${
        isExpanded ? 'pl-64' : 'pl-14'
      }`}
    >
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}