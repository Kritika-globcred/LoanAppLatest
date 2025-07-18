'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  HandCoins, 
  Settings, 
  Code2, 
  Menu, 
  X, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Lenders', href: '/admin/lenders', icon: HandCoins },
  { name: 'Universities', href: '/admin/universities', icon: Building2 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Developer', href: '/admin/developer', icon: Code2 },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname() || '';

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className={cn(
          'fixed top-4 left-4 z-50 p-2 rounded-full',
          'bg-background/80 backdrop-blur-md border border-border/50',
          'text-foreground/80 hover:text-foreground',
          'transition-all duration-200 ease-in-out',
          'shadow-sm hover:shadow-md',
          'md:hidden'
        )}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen',
          'bg-background/80 backdrop-blur-lg border-r border-border/50',
          'shadow-lg transition-all duration-300 ease-in-out',
          'transform-gpu',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className={cn(
            'h-16 flex items-center px-4',
            'border-b border-border/50',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}>
            {!isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            )}
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-primary/10 to-primary/5',
              'text-primary/80 border border-border/30',
              'cursor-pointer hover:bg-primary/10 transition-colors',
              isCollapsed ? 'mx-auto' : ''
            )}>
              {isCollapsed ? 'AP' : 'AP'}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center p-3 rounded-lg',
                        'transition-all duration-200 ease-out',
                        'text-foreground/80 hover:text-foreground',
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'hover:bg-foreground/5',
                        isCollapsed ? 'justify-center' : 'px-4'
                      )}
                    >
                      <div className={cn(
                        'relative',
                        isActive ? 'text-primary' : 'text-foreground/60',
                        'group-hover:text-foreground',
                        'transition-colors duration-200'
                      )}>
                        <Icon className={cn(
                          'h-5 w-5',
                          !isCollapsed && 'mr-3',
                          'transition-transform duration-200 group-hover:scale-110'
                        )} />
                        {isActive && (
                          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Collapse button */}
          <div className={cn(
            'p-4 border-t border-border/50',
            'bg-background/30 backdrop-blur-sm'
          )}>
            <button
              onClick={toggleSidebar}
              className={cn(
                'w-full flex items-center p-2 rounded-lg',
                'text-foreground/60 hover:text-foreground',
                'hover:bg-foreground/5',
                'transition-all duration-200',
                isCollapsed ? 'justify-center' : 'justify-between'
              )}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {!isCollapsed && <span className="text-sm">Collapse</span>}
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
