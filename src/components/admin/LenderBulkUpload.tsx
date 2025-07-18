'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { parseLenderFile } from '@/lib/parseLenderFile';
import { bulkUploadLenders } from '@/services/lender-service';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
type FileWithPreview = File & { preview: string };

export function LenderBulkUpload({
  onComplete,
  onClose,
}: {
  onComplete?: () => void;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    processed: number;
    failed: number;
    newColumns?: string[];
    errors?: Array<{ row: number; error: string }>;
  } | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
  });

  const removeFile = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
    setResult(null);
  };

  const uploadFile = useCallback(async (): Promise<void> => {
    if (files.length === 0) return;

    setStatus('processing');
    setProgress(0);

    try {
      // Parse the file
      const parseResult = await parseLenderFile(files[0]);
      
      if (!parseResult.data || parseResult.data.length === 0) {
        throw new Error('No valid lender data found in the file');
      }

      // Update progress
      setProgress(50);
      
      // Upload lenders in chunks
      const chunkSize = 10;
      const totalLenders = parseResult.data.length;
      let processed = 0;
      let failed = 0;
      const allErrors = [...(parseResult.errors || [])];

      for (let i = 0; i < totalLenders; i += chunkSize) {
        const chunk = parseResult.data.slice(i, i + chunkSize);
        
        try {
          const result = await bulkUploadLenders(chunk);
          processed += result.success;
          failed += result.failed;
          
          if (result.errors) {
            allErrors.push(...result.errors);
          }
          
          // Update progress
          const currentProgress = 50 + Math.round((i / totalLenders) * 50);
          setProgress(currentProgress);
        } catch (error) {
          console.error('Error uploading chunk:', error);
          failed += chunk.length;
          allErrors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Failed to process chunk',
          });
        }
      }

      // Update result
      setStatus('completed');
      setResult({
        success: failed === 0,
        message: failed === 0 
          ? `Successfully processed ${processed} lenders`
          : `Processed ${processed} lenders with ${failed} errors`,
        processed,
        failed,
        newColumns: parseResult.newColumns || [],
        errors: allErrors.length > 0 ? allErrors : undefined,
      });
      
      // Trigger completion callback
      onComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process file',
        processed: 0,
        failed: 0,
        errors: [{
          row: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      });
      toast.error('Failed to process file. Please try again.');
    } finally {
      setStatus('idle');
    }
  }, [files, onComplete]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Bulk Upload Lenders</h3>
        <p className="text-sm text-muted-foreground">
          Upload a PDF, CSV, or Word document containing lender information. Our AI will extract and match the data.
        </p>
      </div>

      {status === 'idle' && (
        <div className="p-6">
          <div className="mb-2 text-xs text-red-600 font-medium">Maximum file size allowed is 10MB.</div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the file here'
                  : 'Drag & drop a file here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground">Supports PDF, CSV, DOC, DOCX (Max 10MB)</p>
            </div>
          </div>
        </div>
      )}

      {files.length > 0 && status === 'idle' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{files[0].name}</p>
                <p className="text-xs text-muted-foreground">
                  {(files[0].size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <Button onClick={uploadFile} className="w-full">
            Process File
          </Button>
        </div>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {status === 'uploading' ? 'Uploading...' : 'Processing with AI...'}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {status === 'uploading'
              ? 'Uploading your file...'
              : 'Our AI is extracting and processing the data. This may take a moment...'}
          </p>
        </div>
      )}

      {status === 'completed' && result && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-md ${
              result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {result.success ? 'Processing Complete' : 'Processing Completed with Errors'}
                </h3>
                <div
                  className={`mt-2 text-sm ${
                    result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  <p>{result.message}</p>
                  <p className="mt-1">
                    Processed: {result.processed} | Failed: {result.failed}
                  </p>
                  {result.newColumns && result.newColumns.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">New columns added:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {result.newColumns.map((col, i) => (
                          <li key={i} className="text-sm">
                            {col}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Errors:</h4>
              <div className="max-h-40 overflow-y-auto text-sm border rounded-md p-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Row
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.errors.map((error, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {error.row}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onClose}>
              View Lenders
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
