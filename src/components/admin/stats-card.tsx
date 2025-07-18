import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  loading: boolean;
  error: Error | null;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  loading, 
  error, 
  className 
}: StatsCardProps) {
  return (
    <Card className={cn('h-full transition-all hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg p-2 bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 mt-2" />
        ) : error ? (
          <div className="flex items-center text-destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">Error</span>
          </div>
        ) : (
          <div className="text-2xl font-bold">
            {value?.toLocaleString() ?? 'N/A'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
