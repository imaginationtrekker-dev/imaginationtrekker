'use client';

import { useEffect, useState } from 'react';
import { Sidebar, Header, Main } from '../components/dashboard';
import { usePathname } from 'next/navigation';
import './dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  // Close the drawer after navigation (covers Link click + programmatic nav).
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const handleToggleSidebar = () => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 1024px)').matches) {
      setIsMobileSidebarOpen((v) => !v);
    } else {
      setIsDesktopSidebarCollapsed((v) => !v);
    }
  };

  const handleCloseMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div className='min-h-screen' style={{ background: '#f9fafb', position: 'relative', overflowX: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        onNavigate={() => {
          // Only auto-close on navigation for the mobile drawer behavior.
          if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches) {
            setIsMobileSidebarOpen(false);
          }
        }}
      />

      {/* Main content area */}
      <div className={`main-content ${isDesktopSidebarCollapsed ? 'main-content--sidebar-collapsed' : ''}`}>
        {/* Header */}
        <Header
          onToggleSidebar={handleToggleSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
          isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
        />

        {/* Main content */}
        <Main>{children}</Main>
      </div>

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className='dashboard_overlay lg:hidden'
          onClick={handleCloseMobileSidebar}
        />
      )}
    </div>
  );
}
