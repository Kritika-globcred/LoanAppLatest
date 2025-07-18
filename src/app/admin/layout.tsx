'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const isHome = pathname === '/';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Sidebar />
      <div 
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          'md:pl-20 lg:pl-64' // Match sidebar width
        )}
      >
        <header 
          className={cn(
            'sticky top-0 z-30',
            'bg-background/80 backdrop-blur-lg border-b border-border/50',
            'transition-all duration-300',
            'shadow-sm hover:shadow-md'
          )}
        >
          <div className="container flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/70" />
              <h1 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {(() => {
                  const pageName = pathname.split('/').pop() || '';
                  return pageName ? pageName.charAt(0).toUpperCase() + pageName.slice(1) : 'Dashboard';
                })()}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className={cn(
                  'group relative px-3 py-1.5 text-sm font-medium',
                  'text-muted-foreground hover:text-foreground',
                  'transition-colors duration-200',
                  'before:absolute before:bottom-0 before:left-1/2 before:h-0.5',
                  'before:w-0 before:bg-primary before:transition-all before:duration-300',
                  'hover:before:left-0 hover:before:w-full',
                  'before:rounded-full'
                )}
              >
                <span className="relative z-10">Back to Site</span>
              </a>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <div className={cn(
            'container py-6 px-4 md:px-6',
            'transition-all duration-300',
            'max-w-[2000px] mx-auto' // Ensure content doesn't get too wide on large screens
          )}>
            <div className={cn(
              'rounded-xl p-6',
              'bg-background/80 backdrop-blur-sm',
              'border border-border/30',
              'shadow-sm hover:shadow-md transition-shadow duration-300',
              'min-h-[calc(100vh-10rem)]' // Ensure consistent height
            )}>
              {children}
            </div>
          </div>
        </main>
        
        <footer className="py-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="container px-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Admin Panel. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
