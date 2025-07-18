'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, HandCoins, Building2, BarChart2, Activity } from 'lucide-react';
import { useFirestoreCounts } from '@/hooks/useFirestoreCounts';
import { StatsCard } from '@/components/admin/stats-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { customers, lenders, universities, loading: countsLoading, error } = useFirestoreCounts();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.displayName || user.email?.split('@')[0] || 'Admin'}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Customers"
          value={customers}
          icon={<Users className="h-4 w-4" />}
          loading={countsLoading}
          error={error}
        />
        <StatsCard
          title="Total Lenders"
          value={lenders}
          icon={<HandCoins className="h-4 w-4" />}
          loading={countsLoading}
          error={error}
          className="bg-gradient-to-br from-blue-50 to-blue-50/70 dark:from-blue-950/30 dark:to-blue-900/20"
        />
        <StatsCard
          title="Total Universities"
          value={universities}
          icon={<Building2 className="h-4 w-4" />}
          loading={countsLoading}
          error={error}
          className="bg-gradient-to-br from-purple-50 to-purple-50/70 dark:from-purple-950/30 dark:to-purple-900/20"
        />
        <StatsCard
          title="Total Records"
          value={(customers || 0) + (lenders || 0) + (universities || 0)}
          icon={<BarChart2 className="h-4 w-4" />}
          loading={countsLoading}
          error={error}
          className="bg-gradient-to-br from-green-50 to-green-50/70 dark:from-green-950/30 dark:to-green-900/20"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Summary of your platform's current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Platform Status</p>
                  <p className="text-sm text-muted-foreground">
                    All systems operational
                  </p>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 rounded-lg border">
                  <p className="text-sm font-medium">Active Users</p>
                  <p className="text-2xl font-bold">
                    {countsLoading ? '--' : (customers || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total registered customers
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm font-medium">Lender Partners</p>
                  <p className="text-2xl font-bold">
                    {countsLoading ? '--' : (lenders || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Financial institutions
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm font-medium">Universities</p>
                  <p className="text-2xl font-bold">
                    {countsLoading ? '--' : (universities || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Partner institutions
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={signOut} variant="outline" className="mt-2">
                  Sign out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
