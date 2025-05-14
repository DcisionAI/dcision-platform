import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  sidebarOverride?: React.ReactNode;
  forceLoginModal?: boolean;
}

export default function Layout({ children, sidebarOverride, forceLoginModal }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-docs-bg">
      <Navbar forceLoginModal={forceLoginModal} />
      <div className="flex flex-1">
        {sidebarOverride ? sidebarOverride : <Sidebar />}
        <main className="flex-1 p-8 bg-docs-main-bg text-docs-text text-base">{children}</main>
      </div>
    </div>
  );
}