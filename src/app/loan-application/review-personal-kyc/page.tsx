
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Edit3, Save } from 'lucide-react';
import { extractPersonalKycDetails, type ExtractPersonalKycInput, type ExtractPersonalKycOutput } from '@/ai/flows/extract-personal-kyc-flow';
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { saveUserApplicationData } from '@/services/firebase-service';

type EditableKycOutput = ExtractPersonalKycOutput & { ageInYears?: string | number };

export default function ReviewPersonalKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();
  const userId = getOrGenerateUserId();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  const [extractedData, setExtractedData] = useState<EditableKycOutput | null>(null);
  const [editingField, setEditingField] = useState<keyof EditableKycOutput | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [avekaMessage, setAvekaMessage] = useState("Hold tight! I'm carefully reviewing your documents with AI to extract the details...");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);


  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const timerId = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const calculateAge = (dob: string): string | number => {
    if (!dob || dob === "Not Specified" || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return "Not Specified";
    }
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age : "Invalid Date";
    } catch (e) {
      return "Invalid Date";
    }
  };

  useEffect(() => {
    const processKycDocuments = async () => {
      setIsLoading(true);
      setAvekaMessage("Hold tight! I'm carefully reviewing your documents with AI to extract the details...");

      const docsForReviewString = localStorage.getItem('personalDocsForReview');
      if (!docsForReviewString) {
          toast({ title: "Error", description: "Document data not found for review. Please go back.", variant: "destructive" });
          setIsLoading(false);
          setAvekaMessage("Could not find your document details. Please try uploading again.");
          router.push('/loan-application/personal-kyc');
          return;
      }
      const { 
        idDocumentDataUri, 
        passportDataUri, 
        idDocumentType, 
        idDocumentFirebaseUrl, 
        passportFirebaseUrl 
      } = JSON.parse(docsForReviewString);

      // Use Firebase Storage URLs if available, fall back to data URIs
      const idDocUri = idDocumentFirebaseUrl || idDocumentDataUri;
      const passportUri = passportFirebaseUrl || passportDataUri;

      if (!idDocUri || !passportUri || !idDocumentType) {
        toast({
          title: "Error: Missing Documents",
          description: "Could not find document data. Please go back and re-upload.",
          variant: "destructive",
        });
        setIsLoading(false);
        setAvekaMessage("It seems there was an issue fetching your document data. Please try uploading them again.");
        router.push('/loan-application/personal-kyc');
        return;
      }

      try {
        console.log("Starting KYC document processing...");
        console.log("ID Document URI:", idDocUri ? "[URI present]" : "[MISSING]");
        console.log("Passport URI:", passportUri ? "[URI present]" : "[MISSING]");
        
        const input: ExtractPersonalKycInput = {
          idDocumentImageUri: idDocUri,
          idDocumentTextContent: null,
          passportImageUri: passportUri,
          passportTextContent: null,
          idDocumentType: idDocumentType,
        };
        
        console.log("Sending documents to AI for processing...");
        const result = await extractPersonalKycDetails(input);
        
        if (!result) {
          throw new Error("AI processing returned no result");
        }
        
        console.log("Successfully extracted KYC details:", result);
        const ageInYears = calculateAge(result.dateOfBirth);
        setExtractedData({ ...result, ageInYears });
        setAvekaMessage("Great news! I've extracted the details from your documents. Please review them below and make any corrections if needed.");
        toast({ title: "Details Extracted", description: "Please review your KYC information." });
      } catch (error) {
        console.error("Error in KYC document processing:", error);
        toast({
          title: "Document Processing Error",
          description: error instanceof Error ? 
            `Failed to process documents: ${error.message}` : 
            "An unknown error occurred while processing your documents. Please try again.",
          variant: "destructive",
        });
        setAvekaMessage("I encountered an issue while extracting details. You might need to re-upload clearer images, or you can try filling the details manually if this persists.");
        setExtractedData({
            idNumber: "Not Specified", idType: idDocumentType, passportNumber: "Not Specified",
            mothersName: "Not Specified", fathersName: "Not Specified",
            passportExpiryDate: "Not Specified", passportIssueDate: "Not Specified",
            nameOnPassport: "Not Specified", countryOfUser: "Not Specified",
            dateOfBirth: "Not Specified", permanentAddress: "Not Specified", ageInYears: "Not Specified"
        });
      } finally {
        setIsLoading(false);
      }
    };

    processKycDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleEditField = (field: keyof EditableKycOutput, currentValue: string | number | undefined) => {
    setEditingField(field);
    setEditValue(String(currentValue !== undefined ? currentValue : ''));
  };

  const handleSaveEdit = () => {
    if (extractedData && editingField) {
      let currentData = { ...extractedData };
      currentData[editingField] = editValue as any; 

      if (editingField === 'dateOfBirth') {
        currentData.ageInYears = calculateAge(editValue);
      }
      setExtractedData(currentData);
      setEditingField(null);
      toast({ title: "Details Updated", description: `${String(editingField).replace(/([A-Z])/g, ' $1').trim()} has been updated.`});
    }
  };

  const handleConfirmAndContinue = async () => {
    if (!userId) {
      toast({ title: "Error", description: "User session not found.", variant: "destructive" });
      return;
    }
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    if (!extractedData) {
      toast({ title: "Error", description: "No data to save.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const docsForReview = JSON.parse(localStorage.getItem('personalDocsForReview') || '{}');

      // Create a clean copy with only valid, serializable fields
      const cleanValue = (value: any): any => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return value;
        }
        if (Array.isArray(value)) {
          return value.map(cleanValue).filter(v => v !== undefined);
        }
        return undefined;
      };

      const personalKycDataToSave: Record<string, any> = {};
      
      // Process extractedData
      if (extractedData) {
        Object.entries(extractedData).forEach(([key, value]) => {
          const cleanVal = cleanValue(value);
          if (cleanVal !== undefined) {
            personalKycDataToSave[key] = cleanVal;
          }
        });
      }

      // Validate and add document URLs
      const isValidUrl = (url: any): boolean => {
        if (typeof url !== 'string') return false;
        try {
          // Basic URL validation
          new URL(url);
          return url.length < 2000; // Reasonable length limit
        } catch {
          return false;
        }
      };

      if (isValidUrl(docsForReview.idDocumentDataUri)) {
        personalKycDataToSave.idDocumentUrl = docsForReview.idDocumentDataUri;
      } else {
        console.warn('Invalid or missing ID document URL');
      }
      if (isValidUrl(docsForReview.passportDataUri)) {
        personalKycDataToSave.passportUrl = docsForReview.passportDataUri;
      } else {
        console.warn('Invalid or missing passport URL');
      }
      personalKycDataToSave.consentTimestamp = new Date().toISOString();
      localStorage.removeItem('personalDocsForReview');
      const result = await saveUserApplicationData(userId, { personalKyc: personalKycDataToSave });
      if (result.success) {
        toast({ title: "Personal KYC Saved!", description: "Proceeding to next step." });
        // Determine next step: for both 'loan' and 'study' (if no offer letter), always go to academic KYC after personal KYC
        const applicationType = (typeof window !== 'undefined' && localStorage.getItem('applicationType')) || 'loan';
        let nextStep = '/loan-application/academic-kyc'; // Default: academic KYC for both study and loan
        if (applicationType === 'work') {
          nextStep = '/loan-application/professional-kyc';
        }
        // Only skip to recommendations if later steps (like offer letter) dictate
        router.push(nextStep);
      } else {
        toast({ title: "Save Failed", description: result.error || "Could not save personal KYC details.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "An error occurred while saving your details.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const dataEntries = extractedData ? (Object.entries(extractedData) as [keyof EditableKycOutput, string | number | undefined][]) : [];

  const renderConsentSection = () => (
    <div className="mt-8 space-y-6 border-t border-gray-500/50 pt-6">
      <div className="flex items-center space-x-2">
        <Checkbox id="consent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
        <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
          I confirm that all the details mentioned above are correct.
        </Label>
      </div>
      <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
      <div className="flex justify-center">
        <Button onClick={handleConfirmAndContinue} disabled={!consentChecked || isSaving || isLoading} size="lg" className="gradient-border-button">
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Confirm & Continue'}
        </Button>
      </div>
    </div>
  );

  const renderEditableTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-white">Field</TableHead>
          <TableHead className="text-white">Value</TableHead>
          <TableHead className="text-white text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dataEntries.map(([key, value]) => {
          const fieldLabel = String(key).replace(/([A-Z])/g, ' $1').trim();
          const isAgeField = key === 'ageInYears';
          return (
            <TableRow key={key}>
              <TableCell className="font-medium capitalize text-gray-300">{fieldLabel}</TableCell>
              <TableCell className="text-gray-200">
                {editingField === key && !isAgeField ? (
                  <Input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-white/80 text-black"
                  />
                ) : (
                  String(value !== undefined && value !== null && String(value).trim() !== '' ? value : 'Not Specified')
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingField === key && !isAgeField ? (
                  <Button onClick={handleSaveEdit} size="sm" className="gradient-border-button">
                    <Save className="mr-1 h-4 w-4" /> Save
                  </Button>
                ) : !isAgeField ? (
                  <Button onClick={() => handleEditField(key, value)} size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white">
                    <Edit3 className="mr-1 h-4 w-4" /> Edit
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  // Only JSX and valid expressions below
  return (
    <div className="flex flex-col items-center">
      <section
        className="relative w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] pt-[5px] px-6 pb-6 md:px-8 md:pb-8 overflow-hidden shadow-[5px_5px_10px_hsl(0,0%,0%/0.2)] shadow-[inset_0_0_2px_hsl(var(--primary)/0.8)]"
        style={{
          backgroundImage:
            "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Untitled%20design.png')",
        }}
      >
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.10)] rounded-2xl z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center py-4">
            <Logo />
            <nav>
              <ul className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
                {navMenuItems.map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => setActiveNavItem(item)}
                      className="text-white hover:opacity-75 transition-opacity focus:outline-none flex items-center text-xs sm:text-sm"
                      aria-current={activeNavItem === item ? "page" : undefined}
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1.5 sm:mr-2 shrink-0 ${
                          activeNavItem === item
                            ? 'progress-dot-active'
                            : 'bg-gray-400/60'
                        }`}
                        aria-hidden="true"
                      ></span>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="default" size="sm">Login</Button>
              <Link href="/loan-application/mobile" passHref>

              </Link>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
          <div className="flex items-center mb-6 mt-4"> 
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/personal-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
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
                    <div
                        className={`bg-[hsl(var(--card)/0.35)] backdrop-blur-xs p-4 rounded-lg shadow-sm text-left md:flex-grow
                                    transform transition-all duration-500 ease-out w-full
                                    ${avekaMessageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    >
                        <p className="font-semibold text-lg mb-1 text-white">Aveka</p>
                        <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
                        <p className="text-base text-white">{avekaMessage}</p>
                    </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-lg text-white">Extracting details from your documents...</p>
                  <p className="text-sm text-gray-300">This might take a few moments.</p>
                </div>
              ) : (
                <>
                  {renderEditableTable()}
                  {renderConsentSection()}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

