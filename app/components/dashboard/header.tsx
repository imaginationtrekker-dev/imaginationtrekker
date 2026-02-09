'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    // Set last update time
    const now = new Date();
    const formatted = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' ' + now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setLastUpdate(formatted);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];
    
    if (paths.length > 1) {
      paths.slice(1).forEach((path, index) => {
        const fullPath = '/' + paths.slice(0, index + 2).join('/');
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
        breadcrumbs.push({ label, path: fullPath });
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className='header'>
      <div className='header_left'>
        <div className='header_breadcrumbs'>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path}>
              {index > 0 && <span className='breadcrumb_separator'> &gt; </span>}
              {index === breadcrumbs.length - 1 ? (
                <span className='breadcrumb_current'>{crumb.label}</span>
              ) : (
                <a href={crumb.path}>{crumb.label}</a>
              )}
            </span>
          ))}
        </div>
        {lastUpdate && (
          <div className='header_meta'>
            <span>Last update: {lastUpdate}</span>
          </div>
        )}
      </div>
      <div className='header_right'>
        <div className='header_actions'>
          <button onClick={handleLogout} className='btn btn_primary'>
            <LogOut size={16} />
            Logout
          </button>
        </div>
        <button
          className='header_ellipsis'
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}
