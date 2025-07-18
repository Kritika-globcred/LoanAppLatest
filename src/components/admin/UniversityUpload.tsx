'use client';

import { useState, useCallback, useEffect } from 'react';
import { extractTextFromPdf } from '@/utils/pdfUtils';
import { enrichUniversityDataGemini } from '@/services/gemini-service';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

const showToast = (message: string, type: ToastType = 'info') => {
  switch (type) {
    case 'success':
      return toast.success(message);
    case 'error':
      return toast.error(message);
    case 'warning':
      return toast.warning(message);
    default:
      return toast(message);
  }
};

import { Download, Trash2, Upload, Check, X, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { University, Course } from '@/types/university';
import { bulkUploadUniversities, bulkDeleteUniversities, getUniversities } from '@/services/university-service';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { downloadCsvTemplate } from '@/utils/universityCsvTemplate';

type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'processing' | 'completed' | 'error';

interface UploadResult {
  status: UploadStatus;
  message?: string;
  total?: number;
  successCount?: number;
  failedCount?: number;
  errors?: Array<{ row: number; message: string }>;
  data?: any[];
  success?: boolean;
}

type FormData = {
  file: FileList;
};

// Expanded CSVRow to support all major Firestore/admin fields
export type CSVRow = {
  universityName: string;
  country: string;
  currency: string;
  feesDestinationCurrency: string;
  feesINR: string;
  inrSelfContributionDeposit: string;
  selfContributionDepositDestinationCurrency: string;
  scholarships: string;
  tatForOffer: string;
  employabilitySuccess: string;
  courses: string;
};

type BulkAction = 'upload' | 'delete' | 'validate';

interface UniversityUploadProps {
  onSuccess?: () => void;
}

export interface ProcessedUniversity extends CSVRow {
  _rowNumber: number;
  _errors: string[];
  _isValid: boolean;
  id?: string;
}

// Expanded header map for all supported fields
export const csvHeaderMap: Record<string, keyof CSVRow> = {
  'University / College Name': 'universityName',
  'Country': 'country',
  'Fees Currency': 'currency',
  'Fees in Destination Currency': 'feesDestinationCurrency',
  'Fees - INR': 'feesINR',
  'INR - Self Contribution / Deposit': 'inrSelfContributionDeposit',
  'Self Contribution / Deposit (Destination Currency)': 'selfContributionDepositDestinationCurrency',
  'Scholarships': 'scholarships',
  'TAT for University Offer': 'tatForOffer',
  'Employability Success': 'employabilitySuccess',
  'List of Course(s)': 'courses',
};

// Expanded required headers for CSV upload template (customize as needed)
export const requiredHeaders = [
  'University / College Name',
  'Country',
  'Fees Currency',
  'Fees in Destination Currency',
  'Fees - INR',
  'INR - Self Contribution / Deposit',
  'Self Contribution / Deposit (Destination Currency)',
  'Scholarships',
  'TAT for University Offer',
  'Employability Success',
  'List of Course(s)',
];

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function parseCSV(
  csvText: string,
  mapping?: Record<string, string>,
  uploadedHeadersOverride?: string[],
  delimiter?: string
): CSVRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  const delim = delimiter || (uploadedHeadersOverride && uploadedHeadersOverride.length > 1 && csvText.includes(';') ? ';' : ',');
  const csvHeaders = uploadedHeadersOverride || lines[0].split(delim).map(h => h.trim());
  // Always map headers to internal keys (or undefined if not found)
  const headerKeys = csvHeaders.map(h => csvHeaderMap[h]);
  console.log('csvHeaders:', csvHeaders);
  console.log('headerKeys:', headerKeys);
  const parsedRows = lines.slice(1).map(line => {
    const values = line.split(delim);
    const row: Record<string, string> = {};
    headerKeys.forEach((key, i) => {
      if (key) row[key] = values[i] ? values[i].trim() : '';
    });
    return row as CSVRow;
  });
  console.log('first parsed row:', parsedRows[0]);
  return parsedRows;
}

function validateUniversityData(university: ProcessedUniversity): string[] {
  const errors: string[] = [];
  if (!university.universityName?.trim()) errors.push('University / College Name is required');
  if (!university.country?.trim()) errors.push('Country is required');
  if (!university.currency?.trim()) errors.push('Fees Currency is required');
  if (!university.inrSelfContributionDeposit?.trim()) errors.push('INR - Self Contribution / Deposit is required');
  if (!university.selfContributionDepositDestinationCurrency?.trim()) errors.push('Self Contribution / Deposit (Destination Currency) is required');
  if (!university.scholarships?.trim()) errors.push('Scholarships is required');
  if (!university.tatForOffer?.trim()) errors.push('TAT for University Offer is required');
  if (!university.employabilitySuccess?.trim()) errors.push('Employability Success is required');
  if (!university.courses?.trim()) errors.push('List of Course(s) is required');
  return errors;
}

// Generic mapping: copy all fields from CSVRow to ProcessedUniversity
function mapCSVToUniversity(row: CSVRow): ProcessedUniversity {
  return {
    ...row,
    _rowNumber: 0,
    _errors: [],
    _isValid: true,
  };
}

const UniversityUpload: React.FC<UniversityUploadProps> = ({ onSuccess }) => {
  // State
  const [uploadedHeaders, setUploadedHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [bulkAction, setBulkAction] = useState<BulkAction>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult>({ status: 'idle' });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [parsedData, setParsedData] = useState<ProcessedUniversity[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [universitiesToDelete, setUniversitiesToDelete] = useState<Array<{ id: string; name: string }>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>();
  const file = watch('file');

  // File selection effect
  useEffect(() => {
    if (file?.[0]) {
      setSelectedFile(file[0]);
      setShowPreview(false);
      setParsedData([]);
      setHeaders([]);
      setUploadResult({ status: 'idle' });
    }
  }, [file]);

  // Parse and validate CSV
  // Utility to detect delimiter
function detectDelimiter(headerLine: string): string {
  if (headerLine.includes(';')) return ';';
  if (headerLine.includes(',')) return ',';
  return ',';
}

const processCsvFile = async (file: File) => {
    try {
      setIsLoading(true);
      setUploadResult({ status: 'parsing' });
      const text = await file.text();
      const firstLine = text.split(/\r?\n/)[0];
      const delimiter = detectDelimiter(firstLine);
      const detectedHeaders = firstLine.split(delimiter).map(h => h.trim());
      setUploadedHeaders(detectedHeaders);
      if (!arraysEqual(detectedHeaders, requiredHeaders)) {
        setShowMappingDialog(true);
        const initialMapping: Record<string, string> = {};
        requiredHeaders.forEach(req => {
          const found = detectedHeaders.find(h => h.toLowerCase().includes(req.toLowerCase().slice(0, 8)));
          initialMapping[req] = found || '';
        });
        setColumnMapping(initialMapping);
        setParsedData([]);
        setHeaders([]);
        setShowPreview(false);
        setIsLoading(false);
        return;
      }
      const rows: CSVRow[] = parseCSV(text, undefined, undefined, delimiter);
      setHeaders(Object.keys(rows[0] || {}));
      const processedData: ProcessedUniversity[] = rows.map((row: CSVRow, index: number): ProcessedUniversity => {
        try {
          const university = mapCSVToUniversity(row);
          const errors = validateUniversityData(university);
          return {
            ...university,
            _rowNumber: index + 2,
            _errors: errors,
            _isValid: errors.length === 0
          };
        } catch (error) {
          return {
            universityName: `Error in row ${index + 2}`,
            country: '',
            currency: '',
            feesDestinationCurrency: '',
            feesINR: '',
            inrSelfContributionDeposit: '',
            selfContributionDepositDestinationCurrency: '',
            scholarships: '',
            tatForOffer: '',
            employabilitySuccess: '',
            courses: '',
            _rowNumber: index + 2,
            _errors: ['Failed to parse row'],
            _isValid: false
          };
        }
      });
      setParsedData(processedData);
      setUploadResult({
        status: 'completed',
        message: `Processed ${processedData.length} rows`,
        total: processedData.length,
        successCount: processedData.filter((u: ProcessedUniversity) => u._isValid).length,
        failedCount: processedData.filter((u: ProcessedUniversity) => !u._isValid).length,
        data: processedData
      });
      if (processedData.length > 0) setShowPreview(true);
    } catch (error) {
      setUploadResult({ status: 'error', message: error instanceof Error ? error.message : 'Failed to process CSV file' });
      showToast('Failed to process CSV file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm mapping
  const handleConfirmMapping = async (file: File, mapping: Record<string, string>) => {
    setShowMappingDialog(false);
    setIsLoading(true);
    const text = await file.text();
    const firstLine = text.split(/\r?\n/)[0];
    const delimiter = detectDelimiter(firstLine);
    const rows: CSVRow[] = parseCSV(text, mapping, uploadedHeaders, delimiter);
    setHeaders(Object.keys(rows[0] || {}));
    const processedData: ProcessedUniversity[] = rows.map((row: CSVRow, index: number): ProcessedUniversity => {
      try {
        const university = mapCSVToUniversity(row);
        const errors = validateUniversityData(university);
        return {
          ...university,
          _rowNumber: index + 2,
          _errors: errors,
          _isValid: errors.length === 0
        };
      } catch (error) {
        return {
          universityName: `Error in row ${index + 2}`,
          country: '',
          currency: '',
          feesDestinationCurrency: '',
          feesINR: '',
          inrSelfContributionDeposit: '',
          selfContributionDepositDestinationCurrency: '',
          scholarships: '',
          tatForOffer: '',
          employabilitySuccess: '',
          courses: '',
          _rowNumber: index + 2,
          _errors: ['Failed to parse row'],
          _isValid: false
        };
      }
    });
    setParsedData(processedData);
    setUploadResult({
      status: 'completed',
      message: `Processed ${processedData.length} rows`,
      total: processedData.length,
      successCount: processedData.filter((u: ProcessedUniversity) => u._isValid).length,
      failedCount: processedData.filter((u: ProcessedUniversity) => !u._isValid).length,
      data: processedData
    });
    if (processedData.length > 0) setShowPreview(true);
    setIsLoading(false);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      await processCsvFile(file);
    }
  };

  // Submit handler (example: for upload action)
  function mapProcessedToUniversity(row: ProcessedUniversity): University {
  return {
    // Basic Information
    name: row.universityName,
    shortName: row.universityName,
    description: '',
    alternativeNames: [],
    fees: undefined,
    qsRanking: undefined,
    employabilityRate: undefined,
    averagePlacement: undefined,
    // Location
    countries: [row.country],
    country: row.country,
    region: '',
    state: '',
    city: '',
    address: '',
    postalCode: '',
    latitude: undefined,
    longitude: undefined,
    // Programs & Courses
    courses: row.courses,
    // Extra CSV fields for admin table
    currency: row.currency,
    feesDestinationCurrency: row.feesDestinationCurrency,
    feesINR: row.feesINR,
    inrSelfContributionDeposit: row.inrSelfContributionDeposit,
    selfContributionDepositDestinationCurrency: row.selfContributionDepositDestinationCurrency,
    scholarships: row.scholarships,
    tatForOffer: row.tatForOffer,
    employabilitySuccess: row.employabilitySuccess,
    // Contact
    website: '',
    email: '',
    phone: '',
    // Admission Requirements
    admissionRequirements: [],
    // Media, Social, Metadata
    imageUrls: [],
    videoTourUrl: '',
    virtualTourUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    isActive: true,
    lastVerified: undefined,
    dataSource: undefined,
    tags: [],
    notes: '',
    createdAt: undefined,
    updatedAt: undefined,
    id: row.id,
  };
}

const onSubmit = async () => {
  if (!parsedData.length) {
    showToast('No data to upload', 'warning');
    return;
  }
  console.log('[BulkUpload] Uploading parsedData:', parsedData);
  setIsLoading(true);
  setUploadResult({ status: 'uploading', message: 'Uploading to Firestore...' });
  try {
    // Only upload valid rows
    const validRows = parsedData.filter(row => row._isValid).map(mapProcessedToUniversity);
    if (!validRows.length) {
      showToast('No valid rows to upload', 'error');
      setIsLoading(false);
      return;
    }
    const result = await bulkUploadUniversities(validRows, progress => setProgress(progress));
    setUploadResult({
      status: result.success ? 'completed' : 'error',
      message: result.message,
      total: result.total,
      successCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors as any[]
    });
    showToast(result.message || 'Upload completed', result.success ? 'success' : 'error');
    if (onSuccess) onSuccess();
  } catch (err: any) {
    showToast('Upload failed', 'error');
    setUploadResult({ status: 'error', message: err.message || 'Upload failed' });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">University Bulk Upload</h2>
      <div className="mb-2 text-xs text-red-600 font-medium">Maximum file size allowed is 10MB.</div>
      <Input type="file" accept=".csv,.pdf" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setShowPreview(false);
        setParsedData([]);
        setHeaders([]);
        setUploadResult({ status: 'idle' });
        if (file.type === 'application/pdf') {
          // PDF selected, wait for Gemini AI extraction
        } else {
          await handleFileUpload(e);
        }
      }} />

      {/* Show Gemini AI extract button if PDF is selected */}
      {selectedFile && selectedFile.type === 'application/pdf' && (
        <Button
          className="mt-2"
          onClick={async () => {
            setIsLoading(true);
            setUploadResult({ status: 'processing', message: 'Extracting data using Gemini AI...' });
            try {
              // 1. Extract text from PDF
              const pdfText = await extractTextFromPdf(selectedFile);
              // 2. Call Gemini AI enrichment (assume enrichUniversityDataGemini is implemented)
              const aiResults = await enrichUniversityDataGemini(pdfText);
              // 3. Map Gemini results to ProcessedUniversity[]
              const processedData = aiResults.map((row: any, index: number) => ({
                ...row,
                _rowNumber: index + 2,
                _errors: [],
                _isValid: true,
              }));
              setParsedData(processedData);
              setShowPreview(true);
              setUploadResult({ status: 'completed', message: `Extracted ${processedData.length} rows using Gemini AI.` });
            } catch (err: any) {
              setUploadResult({ status: 'error', message: err.message || 'Gemini AI extraction failed' });
              showToast('Gemini AI extraction failed', 'error');
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          Use Gemini AI to Extract Data
        </Button>
      )}
      <Button className="mt-2" onClick={onSubmit} disabled={isLoading || !parsedData.length}>
        Upload
      </Button>
      {uploadResult.message && <div className="mt-2 text-sm">{uploadResult.message}</div>}
      {/* Preview Table */}
      {showPreview && (
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Preview</h3>
          <div className="bg-white rounded shadow border p-2 overflow-x-auto overflow-y-auto" style={{ maxHeight: 360 }}>
            <table className="w-full text-xs border text-black" style={{ tableLayout: 'auto', maxWidth: '100%' }}>
              <thead>
                <tr>
                  {requiredHeaders.map(h => <th key={h} className="px-2 py-1 whitespace-nowrap border-b bg-gray-100">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, i) => (
                  <tr key={i} className={row._isValid ? '' : 'bg-red-100'}>
                    {requiredHeaders.map(h => {
                      const key = csvHeaderMap[h];
                      return (
                        <td key={h} className="px-2 py-1 whitespace-nowrap border-b text-black">
                          {key ? row[key] : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default UniversityUpload;
