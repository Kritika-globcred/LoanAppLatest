'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type FormData = {
  file: FileList;
};

type UploadResult = {
  success: number;
  failed: number;
  errors?: Array<{ name: string; error: string }>;
};

export function UniversityUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const file = data.file[0];
    if (!file) return;

    setIsLoading(true);
    setProgress(0);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/universities/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setResult(result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
      }

      alert(`Successfully processed ${result.success} universities${result.failed > 0 ? `, ${result.failed} failed` : ''}`);
      
      if (result.failed > 0) {
        console.error('Failed to process some universities:', result.errors);
      }

      reset();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to upload file'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Universities</CardTitle>
        <CardDescription>
          Upload a CSV file containing university data. The system will automatically enrich the data using AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <input
              id="file"
              type="file"
              accept=".csv"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium"
              {...register('file', { required: 'File is required' })}
            />
            {errors.file && (
              <p className="text-sm font-medium text-destructive">
                {errors.file.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              CSV format: name, website, country
            </p>
          </div>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Upload'}
          </Button>
          
          {isLoading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
