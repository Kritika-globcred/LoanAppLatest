'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// Define a custom error type that extends Error
class AppError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly userId?: string
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    
    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Helper function to safely log errors with context
function logError(error: unknown, context: Record<string, unknown> = {}) {
  // Safely get the error message
  const errorMessage = error instanceof Error 
    ? error.message 
    : (typeof error === 'object' && error !== null && 'message' in error)
      ? String((error as any).message)
      : String(error);
  
  // Create a safe error object
  const errorToLog = new Error(errorMessage);
  
  // Add additional context
  if (error instanceof Error) {
    Object.assign(errorToLog, {
      originalName: error.name,
      stack: error.stack,
      ...(error instanceof AppError 
        ? { 
            context: error.context, 
            userId: error.userId,
            ...context
          }
        : { ...context })
    });
  } else {
    Object.assign(errorToLog, {
      originalError: error,
      ...context
    });
  }
  
  // Log the error with proper typing
  logger.error(errorMessage, errorToLog);
  
  // Return a clean error info object
  const errorInfo = {
    message: errorMessage,
    timestamp: new Date().toISOString(),
    ...(errorToLog as any)
  };
  
  return errorInfo;
}

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import { storage } from '@/utils/storage';
import { logger } from '@/utils/logger';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Edit3, Pencil, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { getUserApplicationData, saveUserApplicationData, type UserApplicationData } from '@/services/firebase-service';
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';

// Define base types from UserApplicationData
type ProfessionalKyc = NonNullable<UserApplicationData['professionalKyc']>;
type CoSignatoryData = NonNullable<ProfessionalKyc['coSignatory']>;
type WorkEmploymentData = NonNullable<ProfessionalKyc['workEmployment']>;

type OptionalFields<T> = { [K in keyof T]?: T[K] | undefined };
type CombinedProfessionalData = OptionalFields<CoSignatoryData> & OptionalFields<WorkEmploymentData>;
type EditableCombinedDataKey = keyof CombinedProfessionalData;

type CoSignatoryKey = keyof CoSignatoryData;
type WorkEmploymentKey = keyof WorkEmploymentData;

// Field display configuration type
interface FieldDisplayConfig {
  label: string;
  isEditable?: boolean;
  required?: boolean;
  description?: string;
  hint?: string;
  inputType?: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'url';
  options?: { value: string; label: string }[];
  value?: string | number | boolean | null;
  formatValue?: (value: unknown) => React.ReactNode;
  condition?: (data: CombinedProfessionalData) => boolean;
}

type FieldConfig = {
  [key in EditableCombinedDataKey]?: FieldDisplayConfig;
} & {
  // Add any additional fields that might be used but not in the original type
  employmentType?: FieldDisplayConfig;
  [key: string]: any; // Allow any other string keys
};



// Default format function for values
const defaultFormatValue = (value: unknown): React.ReactNode => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-gray-400 italic">Not provided</span>;
  }
  return String(value);
};

// Field configuration with proper typing
const fieldConfig: FieldConfig = {
  // Co-signatory fields
  coSignatoryChoice: {
    label: 'Co-signatory Required',
    isEditable: true,
    description: 'Do you need a co-signatory for your loan?',
    formatValue: (value: unknown) => {
      if (value === 'yes') return 'Yes';
      if (value === 'no') return 'No';
      return defaultFormatValue(value);
    }
  },
  coSignatoryIdDocumentType: {
    label: 'ID Document Type',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  coSignatoryIdUrl: { 
    label: 'Co-Signatory ID Document',
    isEditable: true,
    formatValue: (value: unknown) => {
      if (!value) return 'Not provided';
      return (
        <a 
          href={String(value)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:underline"
        >
          View Document
        </a>
      );
    }
  },
  idType: { 
    label: 'Co-Signatory Extracted ID Type',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  nameOnId: {
    label: 'Name on ID',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  consentTimestamp: {
    label: 'Consent Timestamp',
    isEditable: false,
    formatValue: (value: unknown) => {
      if (!value) return 'Not provided';
      try {
        return new Date(String(value)).toLocaleString();
      } catch {
        return String(value);
      }
    }
  },
  
  // Work experience fields
  workExperienceIndustry: {
    label: 'Industry',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  workExperienceYears: {
    label: 'Years of Experience',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  workExperienceMonths: {
    label: 'Months of Experience',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  linkedInUrl: {
    label: 'LinkedIn Profile',
    isEditable: true,
    formatValue: (value: unknown) => {
      const url = String(value || '');
      return url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          View Profile
        </a>
      ) : 'Not provided';
    }
  },
  extractedYearsOfExperience: {
    label: 'Extracted Years of Experience',
    isEditable: false,
    formatValue: defaultFormatValue
  },
  monthlySalary: {
    label: 'Monthly Salary',
    isEditable: true,
    inputType: 'number',
    formatValue: (value: unknown) => {
      if (value === undefined || value === null) return 'Not provided';
      return `$${Number(value).toLocaleString()}`;
    }
  },
  employmentType: {
    label: 'Employment Type',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  companyName: {
    label: 'Company Name',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  jobTitle: {
    label: 'Job Title',
    isEditable: true,
    formatValue: defaultFormatValue
  },
  startDate: {
    label: 'Start Date',
    isEditable: true,
    inputType: 'date',
    formatValue: (value: unknown) => {
      if (!value) return 'Not provided';
      try {
        return new Date(String(value)).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
  },
  endDate: {
    label: 'End Date',
    isEditable: true,
    inputType: 'date',
    formatValue: (value: unknown) => {
      if (!value) return 'Present';
      try {
        return new Date(String(value)).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
  },
  isCurrentJob: {
    label: 'Current Job',
    isEditable: true,
    inputType: 'checkbox',
    formatValue: (value: unknown) => {
      if (value === true || value === 'yes') return 'Yes';
      if (value === false || value === 'no') return 'No';
      return 'Unknown';
    }
  },
  annualSalary: {
    label: 'Annual Salary',
    isEditable: true,
    inputType: 'number',
    formatValue: (value: unknown) => {
      if (value === undefined || value === null) return 'Not provided';
      return `$${Number(value).toLocaleString()}`;
    }
  },
  salaryCurrency: {
    label: 'Salary Currency',
    isEditable: true,
    formatValue: (value: unknown) => {
      if (!value) return 'Not provided';
      if (value === 'INR') return '₹ INR';
      if (value === 'USD') return '$ USD';
      return String(value);
    }
  },
  familyMonthlyIncome: {
    label: 'Family Monthly Income',
    isEditable: true,
    inputType: 'number',
    formatValue: (value: unknown) => {
      if (value === undefined || value === null) return 'Not provided';
      return `$${Number(value).toLocaleString()}`;
    }
  },
  familySalaryCurrency: {
    label: 'Family Income Currency',
    isEditable: true,
    formatValue: (value: unknown) => {
      if (!value) return 'Not provided';
      if (value === 'INR') return '₹ INR';
      if (value === 'USD') return '$ USD';
      return String(value);
    }
  },
  extractedCurrentOrLastIndustry: {
    label: 'Current/Last Industry',
    isEditable: false,
    formatValue: defaultFormatValue
  },
  extractedCurrentOrLastJobRole: {
    label: 'Current/Last Job Role',
    isEditable: false,
    formatValue: defaultFormatValue
  },
  isCurrentlyWorking: {
    label: 'Currently Working',
    isEditable: true,
    inputType: 'checkbox',
    formatValue: (value: unknown) => {
      if (value === true || value === 'yes') return 'Yes';
      if (value === false || value === 'no') return 'No';
      return 'Unknown';
    }
  }
};

export default function ReviewProfessionalKYCPage() {
  const router = useRouter();
  const { toast } = useToast();
  const userId = getOrGenerateUserId();
  
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const [formData, setFormData] = useState<{
    professional?: any;
    work?: any;
    coSignatory?: any;
  }>({
    professional: null,
    work: null,
    coSignatory: null
  });
  const [combinedData, setCombinedData] = useState<CombinedProfessionalData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<EditableCombinedDataKey | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [userEditedFields, setUserEditedFields] = useState<Set<EditableCombinedDataKey>>(new Set());
  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [avekaMessage, setAvekaMessage] = useState<string>("Let's review all your professional details. Please check everything carefully.");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const timerId = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const loadDataForReview = useCallback(() => {
    setIsLoading(true);
    setAvekaMessage("Loading your professional information for review...");

    try {
      // Get data from local storage
      const professionalData = localStorage.getItem('professionalKycData');
      const workData = localStorage.getItem('workEmploymentKycData');
      const coSignatoryData = localStorage.getItem('coSignatoryKycData');

      if (!professionalData && !workData && !coSignatoryData) {
        const noDataMsg = "No professional data found. Please complete the professional details section first.";
        logger.warn('No professional data found in local storage');

        toast({
          title: "No Data",
          description: noDataMsg,
          variant: "destructive",
        });
        setAvekaMessage(noDataMsg);
        setIsLoading(false);
        return;
      }

      // Parse the data if it exists
      const parsedProfessionalData = professionalData ? JSON.parse(professionalData) : null;
      const parsedWorkData = workData ? JSON.parse(workData) : null;
      const parsedCoSignatoryData = coSignatoryData ? JSON.parse(coSignatoryData) : null;

      // Set the form data state
      setFormData({
        professional: parsedProfessionalData,
        work: parsedWorkData,
        coSignatory: parsedCoSignatoryData,
      });

      // Also set the combined data for backward compatibility
      setCombinedData({
        ...(parsedCoSignatoryData || {}),
        ...(parsedWorkData || {}),
      });

      setAvekaMessage("Please review your professional details before proceeding.");
      logger.info('Successfully loaded professional KYC data from local storage');
    } catch (error) {
      logger.error('Error loading professional data:', error);
      const errorMsg = "Failed to load your data. Please try again.";

      // Log the error with context
      const errorContext = {
        action: 'load_professional_data',
        component: 'ReviewProfessionalKYC',
        timestamp: new Date().toISOString(),
      };

      const errorObj = new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        errorContext,
      );

      logError(errorObj, errorContext);

      // Show error to user
      toast({
        title: "Error Loading Data",
        description: errorMsg,
        variant: "destructive",
        duration: 8000, // Show for 8 seconds
      });

      setAvekaMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadDataForReview();
      } catch (error) {
        logger.error('Unhandled error in loadDataForReview', error);
      }
    };

    loadData();
  }, [userId, loadDataForReview]);

  const handleEditField = (key: EditableCombinedDataKey, currentValue: unknown) => {
    setEditingField(key);
    const stringValue = currentValue !== undefined && currentValue !== null
      ? String(currentValue)
      : '';
    setEditValue(stringValue);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveEdit = useCallback(() => {
    if (!editingField) return;

    try {
      setCombinedData((prev) => {
        const updatedData = { ...prev, [editingField]: editValue };
        setUserEditedFields((prevFields) => new Set(prevFields).add(editingField));
        logger.debug('Field updated', {
          field: editingField,
          value: editValue,
          previousValue: prev[editingField as keyof typeof prev],
        });
        const fieldLabel = fieldConfig[editingField]?.label ||
          String(editingField).replace(/([A-Z])/g, ' $1').trim();
        toast({
          title: 'Field Updated',
          description: `${fieldLabel} has been updated.`,
        });
        return updatedData;
      });
      setEditingField(null);
      setEditValue('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorObj = new AppError(
        errorMessage,
        {
          action: 'save_field_edit',
          field: editingField,
          value: editValue,
          timestamp: new Date().toISOString(),
        },
        userId,
      );
      logError(errorObj);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    }
  }, [editingField, editValue, toast, userId]);

  const handleConfirmAndContinue = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!consentChecked) {
      toast({
        title: "Consent Required",
        description: "Please confirm that all details are correct by checking the box.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      logger.info('Saving professional KYC data', { userId });

      const professionalKycToSave: UserApplicationData['professionalKyc'] = {
        coSignatory: {},
        workEmployment: {},
        reviewedTimestamp: currentTime,
      };

      const coSignatoryFields = new Set<CoSignatoryKey>([
        'coSignatoryChoice',
        'coSignatoryIdDocumentType',
        'coSignatoryRelationship',
        'idNumber',
        'idType',
        'nameOnId',
        'coSignatoryIdUrl',
        'consentTimestamp',
      ]);

      const workEmploymentFields = new Set<WorkEmploymentKey>([
        'workExperienceIndustry',
        'workExperienceYears',
        'workExperienceMonths',
        'workExperienceProofType',
        'resumeUrl',
        'linkedInUrl',
        'extractedYearsOfExperience',
        'extractedGapInLast3YearsMonths',
        'extractedCurrentOrLastIndustry',
        'extractedCurrentOrLastJobRole',
        'isCurrentlyWorking',
        'monthlySalary',
        'salaryCurrency',
        'familyMonthlySalary',
        'familySalaryCurrency',
        'consentTimestamp',
      ]);

      for (const [key, value] of Object.entries(combinedData)) {
        if (value === undefined || value === null) continue;

        if (coSignatoryFields.has(key as CoSignatoryKey)) {
          if (!professionalKycToSave.coSignatory) {
            professionalKycToSave.coSignatory = {};
          }
          (professionalKycToSave.coSignatory as Record<string, unknown>)[key] = value;
        } else if (workEmploymentFields.has(key as WorkEmploymentKey)) {
          if (!professionalKycToSave.workEmployment) {
            professionalKycToSave.workEmployment = {};
          }
          (professionalKycToSave.workEmployment as Record<string, unknown>)[key] = value;
        }
      }

      logger.debug('Saving professional KYC data', {
        userId,
        hasCoSignatory: !!professionalKycToSave.coSignatory,
        hasWorkEmployment: !!professionalKycToSave.workEmployment,
        fieldCount: Object.keys(combinedData).length,
      });

      const result = await saveUserApplicationData(userId, {
        professionalKyc: professionalKycToSave,
      });

      if (result.success) {
        logger.info('Successfully saved professional KYC data', { userId });

        toast({
          title: "Success!",
          description: "Your professional details have been saved successfully.",
        });

        const hasOfferLetter = typeof window !== 'undefined'
          ? storage.get('hasOfferLetterStatus', 'false')
          : 'false';

        logger.debug('Navigation after save', { hasOfferLetter });

        // If offer letter is NO and applicationType is 'study' or 'loan', go to preferences, then university recommendations
        const applicationType = (typeof window !== 'undefined' && localStorage.getItem('applicationType')) || 'loan';
        if (hasOfferLetter === 'false' && (applicationType === 'study' || applicationType === 'loan')) {
          router.push('/loan-application/preferences');
        } else {
          router.push('/loan-application/lender-recommendations');
        }
      } else {
        const error = new AppError(
          result.error || "Failed to save professional details",
          { action: 'save_professional_kyc' },
          userId,
        );
        logError(error);
        throw error;
      }
    } catch (error: unknown) {
      // Default error message and context
      let errorMessage = "An unexpected error occurred while saving your data.";
      const errorContext: Record<string, unknown> = { userId };

      // Handle different types of errors
      if (error instanceof AppError) {
        errorMessage = error.message;
        if (error.context) {
          Object.assign(errorContext, error.context);
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorContext.errorName = error.name;
        if (error.stack) {
          errorContext.stack = error.stack;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      // Log the error with context
      const errorDetails = {
        error: errorMessage,
        ...(Object.keys(errorContext).length > 0 && { context: errorContext }),
      };
      logger.error('Error saving professional details: ' + JSON.stringify(errorDetails, null, 2));

      // Show user-friendly error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [userId, consentChecked, combinedData, currentTime, router]);

  const getFieldsToDisplay = useCallback((data: CombinedProfessionalData): EditableCombinedDataKey[] => {
    // Type guard to ensure we only return valid keys
    const isValidKey = (key: string): key is EditableCombinedDataKey => {
      return key in fieldConfig;
    };

    // Get all field keys from the config
    const allFields = Object.keys(fieldConfig) as EditableCombinedDataKey[];

    return allFields.filter((key): boolean => {
      const config = fieldConfig[key];
      if (!config) return false;

      const value = data[key as keyof typeof data];

      // Skip if value is not set
      if (value === undefined || value === null || value === '') {
        return false;
      }

      // Apply field-specific conditions
      if (config.condition && !config.condition(data)) {
        return false;
      }

      // Handle co-signatory fields visibility
      const isCoSignatoryField = [
        'coSignatoryIdDocumentType',
        'coSignatoryIdUrl',
        'idType',
        'nameOnId',
      ].includes(key);

      if (isCoSignatoryField && data.coSignatoryChoice !== 'yes') {
        return false;
      }

      return true;
    });
  }, []);

  const renderField = useCallback((key: EditableCombinedDataKey) => {
    const config = fieldConfig[key];
    if (!config) {
      logger.warn(`No configuration found for field: ${key}`);
      return null;
    }

    const value = combinedData[key];
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const isUserEdited = userEditedFields.has(key);
    // For now, treat all fields as AI-extracted unless edited
    const isAIExtracted = !isUserEdited;
    const { label, formatValue = defaultFormatValue, isEditable, inputType } = config;
    const displayValue = formatValue ? formatValue(value) : String(value);

    return (
      <div key={key} className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-300">{label}</h3>
              {isAIExtracted && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-900 text-blue-300 rounded-full">
                  AI
                </span>
              )}
              {isUserEdited && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-green-900 text-green-300 rounded-full">
                  Edited
                </span>
              )}
            </div>
            {editingField === key ? (
              <div className="flex items-center gap-2 mt-2">
                {inputType === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={editValue === 'true'}
                    onChange={(e) => setEditValue(e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4"
                  />
                ) : (
                  <Input
                    type={inputType || 'text'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-48"
                  />
                )}
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            ) : (
              <p className="mt-1 text-sm text-white flex items-center">
                {displayValue}
                {isEditable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-2"
                    onClick={() => handleEditField(key, value)}
                    disabled={isSaving}
                  >
                    <Pencil size={16} />
                  </Button>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }, [combinedData, editingField, editValue, isSaving, handleEditField, handleSaveEdit, handleCancelEdit, userEditedFields]);

  const fieldsToDisplay = useMemo(() => getFieldsToDisplay(combinedData), [combinedData, getFieldsToDisplay]);

  const renderEditableTable = useCallback(() => {
    if (!combinedData) return <p className="text-center text-white">No professional details found to review.</p>;

    // Group fields: co-signatory vs. work/employment
    const coSignatoryFields = fieldsToDisplay.filter((key) => [
      'coSignatoryChoice',
      'coSignatoryIdDocumentType',
      'coSignatoryIdUrl',
      'idType',
      'nameOnId',
      'coSignatoryRelationship',
      'idNumber',
      'consentTimestamp',
    ].includes(key));

    const workFields = fieldsToDisplay.filter((key) => !coSignatoryFields.includes(key));

    return (
      <div className="space-y-8">
        <div className="bg-gray-900/70 rounded-lg p-6 space-y-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-blue-200 mb-2">Co-Signatory Details</h2>
          {coSignatoryFields.length === 0 && (
            <p className="text-gray-400 italic">No co-signatory details provided.</p>
          )}
          {coSignatoryFields.map(renderField)}
        </div>
        <div className="bg-gray-900/70 rounded-lg p-6 space-y-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-green-200 mb-2">Professional & Employment Details</h2>
          {workFields.length === 0 && (
            <p className="text-gray-400 italic">No work/employment details provided.</p>
          )}
          {workFields.map(renderField)}
        </div>
      </div>
    );
  }, [combinedData, fieldsToDisplay, renderField]);

  return (
    <ErrorBoundary
      onError={(error: Error, errorInfo: React.ErrorInfo) => {
        // Create a new error object that includes the component stack
        const errorWithComponentStack = new Error(error.message);
        errorWithComponentStack.name = error.name;
        errorWithComponentStack.stack = error.stack;
        
        // Add component stack as a property
        if (errorInfo.componentStack) {
          (errorWithComponentStack as any).componentStack = errorInfo.componentStack;
        }
        
        // Log the enhanced error
        logger.error('Error in ReviewProfessionalKYCPage', errorWithComponentStack);
      }}
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center p-6">
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong</h2>
            <p className="mb-4">We're sorry, but we encountered an error while loading this page.</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Reload Page
            </Button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/loan-application/work-employment-kyc')} 
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
        </div>

        <div className="py-8">
          <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-4 w-full">
                <div className="flex-shrink-0 mb-3 md:mb-0">
                  <Image 
                    src="/images/aveka.png" 
                    alt="Aveka, GlobCred's Smart AI" 
                    width={50} 
                    height={50} 
                    className="rounded-full border-2 border-white shadow-md" 
                    data-ai-hint="robot avatar" 
                  />
                </div>
                <div className={`bg-[hsl(var(--card)/0.35)] backdrop-blur-xs p-4 rounded-lg shadow-sm text-left md:flex-grow transform transition-all duration-500 ease-out w-full ${avekaMessageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <p className="font-semibold text-lg mb-1 text-white">Aveka</p>
                  <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
                  <p className="text-base text-white">{avekaMessage}</p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-white">Loading your professional information for review...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {renderEditableTable()}
                
                <div className="mt-8 p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="consent" 
                      checked={consentChecked}
                      onCheckedChange={(checked: boolean) => setConsentChecked(checked)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <label htmlFor="consent" className="text-sm font-medium leading-none">
                        I confirm that all the information provided is accurate and complete to the best of my knowledge.
                      </label>
                      <p className="text-xs text-gray-400">
                        By checking this box, you acknowledge that any false information may result in the rejection of your application.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button 
                      onClick={handleConfirmAndContinue}
                      disabled={!consentChecked || isSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : 'Confirm and Continue'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </section>
      </div>
    </ErrorBoundary>
  );
}
