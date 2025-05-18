
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
import { Loader2, ArrowLeft, Edit3, Save, AlertCircle } from 'lucide-react';
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';

import { extractCoSignatoryIdDetails, type ExtractCoSignatoryIdInput, type ExtractCoSignatoryIdOutput } from '@/ai/flows/extract-co-signatory-id-flow';
import { extractProfessionalProfileDetails, type ExtractProfessionalProfileInput, type ExtractProfessionalProfileOutput } from '@/ai/flows/extract-professional-profile-flow';

interface ProfessionalKycData {
  coSignatoryChoice: string | null;
  coSignatoryIdDocumentUri?: string | null;
  coSignatoryIdDocumentType?: "PAN Card" | "National ID" | null;
  coSignatoryRelationship?: string | null;
  workExperienceIndustry?: string;
  workExperienceYears?: string;
  workExperienceMonths?: string;
  workExperienceProofType?: 'resume' | 'linkedin' | null;
  resumeFileUri?: string | null; // Can be data URI for image or filename for PDF/DOC
  linkedInUrl?: string | null;
  isCurrentlyWorking?: 'yes' | 'no' | null;
  monthlySalary?: string | null;
  salaryCurrency?: string | null;
  familyMonthlySalary?: string | null;
  familySalaryCurrency?: string | null;
}

interface ExtractedCoSignatoryData extends ExtractCoSignatoryIdOutput {}
interface ExtractedProfessionalProfileData extends ExtractProfessionalProfileOutput {}

type CombinedDataType = ProfessionalKycData & Partial<ExtractedCoSignatoryData> & Partial<ExtractedProfessionalProfileData>;

type EditableCombinedDataKey = keyof CombinedDataType;


export default function ReviewProfessionalKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<ProfessionalKycData | null>(null);
  const [combinedData, setCombinedData] = useState<CombinedDataType | null>(null);
  
  const [isLoading, setIsLoading] = useState(true); // For initial data load
  const [isProcessingAi, setIsProcessingAi] = useState(false); // For AI calls

  const [editingField, setEditingField] = useState<EditableCombinedDataKey | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const [avekaMessage, setAvekaMessage] = useState("Let's review your professional details. I'll also try to extract some information using AI if you provided documents or links.");
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

  useEffect(() => {
    const storedDataString = localStorage.getItem('professionalKycData');
    if (storedDataString) {
      const parsedData: ProfessionalKycData = JSON.parse(storedDataString);
      setInitialData(parsedData);
      setCombinedData(parsedData); // Initialize combinedData with manual entries
      setIsLoading(false);
    } else {
      toast({ title: "Error", description: "Could not load professional KYC data. Please go back.", variant: "destructive" });
      router.push('/loan-application/professional-kyc');
      setIsLoading(false);
    }
  }, [router, toast]);


  useEffect(() => {
    const processWithAI = async () => {
      if (!initialData || isProcessingAi) return;

      setIsProcessingAi(true);
      setAvekaMessage("Working with AI to extract details from your documents/links. This might take a moment...");
      
      let coSignatoryExtracted: Partial<ExtractedCoSignatoryData> = {};
      let profileExtracted: Partial<ExtractedProfessionalProfileData> = {};
      let aiError = false;

      const promises = [];

      if (initialData.coSignatoryChoice === 'yes' && initialData.coSignatoryIdDocumentUri && initialData.coSignatoryIdDocumentType) {
        promises.push(
          extractCoSignatoryIdDetails({
            coSignatoryIdImageUri: initialData.coSignatoryIdDocumentUri,
            idDocumentType: initialData.coSignatoryIdDocumentType,
          }).then(res => { coSignatoryExtracted = res; })
          .catch(err => {
            console.error("Co-signatory ID extraction failed:", err);
            toast({ title: "Co-signatory ID Extraction Failed", description: "Could not extract details. Please verify manually.", variant: "destructive" });
            coSignatoryExtracted = { idNumber: "Error - Check Manually", idType: initialData.coSignatoryIdDocumentType, nameOnId: "Error - Check Manually"};
            aiError = true;
          })
        );
      }

      if (initialData.workExperienceProofType === 'resume' && initialData.resumeFileUri) {
        // For simplicity, assuming resumeFileUri is an image data URI for AI processing
        // If it's a PDF/DOC name, this flow would need modification or pre-processing
        if (initialData.resumeFileUri.startsWith('data:image')) {
            promises.push(
              extractProfessionalProfileDetails({
                profileDataSource: initialData.resumeFileUri,
                sourceType: "resumeImage",
              }).then(res => { profileExtracted = { ...profileExtracted, ...res }; })
              .catch(err => {
                console.error("Resume extraction failed:", err);
                toast({ title: "Resume Extraction Failed", description: "Could not extract resume details. Please verify manually.", variant: "destructive" });
                profileExtracted = { ...profileExtracted, yearsOfExperience: "Error", currentOrLastIndustry: "Error", currentOrLastJobRole: "Error", gapInLast3YearsMonths: "Error"};
                aiError = true;
              })
            );
        } else {
             toast({ title: "Resume AI Skipped", description: "AI processing for non-image resumes is not yet supported. Please verify details manually.", variant: "default" });
             profileExtracted = { ...profileExtracted, yearsOfExperience: "Not Specified (Non-Image)", currentOrLastIndustry: "Not Specified", currentOrLastJobRole: "Not Specified", gapInLast3YearsMonths: "Not Specified"};
        }
      } else if (initialData.workExperienceProofType === 'linkedin' && initialData.linkedInUrl) {
        promises.push(
          extractProfessionalProfileDetails({
            profileDataSource: initialData.linkedInUrl,
            sourceType: "linkedinUrl",
          }).then(res => { profileExtracted = { ...profileExtracted, ...res }; })
          .catch(err => {
            console.error("LinkedIn extraction failed:", err);
            toast({ title: "LinkedIn Extraction Failed", description: "Could not extract LinkedIn details. Please verify manually.", variant: "destructive" });
            profileExtracted = { ...profileExtracted, yearsOfExperience: "Error", currentOrLastIndustry: "Error", currentOrLastJobRole: "Error", gapInLast3YearsMonths: "Error"};
            aiError = true;
          })
        );
      }
      
      await Promise.allSettled(promises);

      setCombinedData(prev => ({
        ...(prev || initialData!), // Ensure we don't lose manually entered data
        ...coSignatoryExtracted,
        ...profileExtracted,
      }));

      setIsProcessingAi(false);
      if (aiError) {
        setAvekaMessage("Some AI extractions had issues. Please carefully review and correct the details below.");
      } else if (promises.length > 0) {
        setAvekaMessage("AI processing complete! Please review all your professional details below and make any corrections.");
      } else {
        setAvekaMessage("Please review your professional details below and make any corrections.");
      }
    };

    if (initialData && !isProcessingAi && combinedData === initialData) { // Process only once initially
        processWithAI();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);


  const handleEditField = (field: EditableCombinedDataKey, currentValue: string | number | undefined | null) => {
    setEditingField(field);
    setEditValue(String(currentValue !== undefined && currentValue !== null ? currentValue : ''));
  };

  const handleSaveEdit = () => {
    if (combinedData && editingField) {
      const newData = { ...combinedData, [editingField]: editValue };
      setCombinedData(newData);
      setEditingField(null);
      toast({ title: "Details Updated", description: `${String(editingField).replace(/([A-Z])/g, ' $1').trim()} has been updated.`});
    }
  };

  const handleConfirmAndContinue = () => {
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    console.log("Professional KYC Data Confirmed:", combinedData);
    console.log("Consent given at:", currentTime);
    // Update localStorage if needed, then navigate
    localStorage.setItem('professionalKycDataReviewed', JSON.stringify(combinedData)); 
    toast({ title: "Step 4 Complete!", description: "Moving to the next step." });
    // router.push('/loan-application/financial-details'); // Example next step
  };

  const displayLabels: Record<EditableCombinedDataKey, string> = {
    coSignatoryChoice: "Co-Signatory Added",
    coSignatoryIdDocumentUri: "Co-Signatory ID Uploaded", // Not usually displayed directly
    coSignatoryIdDocumentType: "Co-Signatory ID Type (Provided)",
    idType: "Co-Signatory ID Type (Extracted)",
    idNumber: "Co-Signatory ID Number",
    nameOnId: "Name on Co-Signatory ID",
    coSignatoryRelationship: "Relationship with Co-Signatory",
    workExperienceIndustry: "Industry",
    workExperienceYears: "Experience (Years)",
    workExperienceMonths: "Experience (Months)",
    workExperienceProofType: "Professional Proof Type",
    resumeFileUri: "Resume File", // Not usually displayed directly
    linkedInUrl: "LinkedIn URL",
    yearsOfExperience: "Years of Experience (Extracted)",
    gapInLast3YearsMonths: "Gap in Last 3 Years (Extracted)",
    currentOrLastIndustry: "Industry (Extracted)",
    currentOrLastJobRole: "Job Role (Extracted)",
    isCurrentlyWorking: "Currently Working",
    monthlySalary: "Your Monthly Salary",
    salaryCurrency: "Your Salary Currency",
    familyMonthlySalary: "Family's Monthly Salary",
    familySalaryCurrency: "Family's Salary Currency",
  };
  
  const fieldsToDisplay: EditableCombinedDataKey[] = [
    'coSignatoryChoice',
    // Co-Signatory AI Extracted (if applicable)
    ...(combinedData?.coSignatoryChoice === 'yes' ? ['coSignatoryIdDocumentType', 'idType', 'idNumber', 'nameOnId', 'coSignatoryRelationship'] : []),
    // Work Experience Manual
    'workExperienceIndustry', 'workExperienceYears', 'workExperienceMonths', 'workExperienceProofType',
    ...(combinedData?.workExperienceProofType === 'linkedin' ? ['linkedInUrl'] : []),
    // Professional Profile AI Extracted (if applicable)
    ...(combinedData?.workExperienceProofType ? ['yearsOfExperience', 'gapInLast3YearsMonths', 'currentOrLastIndustry', 'currentOrLastJobRole'] : []),
    // Employment & Salary
    'isCurrentlyWorking',
    ...(combinedData?.isCurrentlyWorking === 'yes' ? ['monthlySalary', 'salaryCurrency'] : []),
    ...(combinedData?.isCurrentlyWorking === 'no' ? ['familyMonthlySalary', 'familySalaryCurrency'] : []),
  ].filter(Boolean) as EditableCombinedDataKey[];


  const renderEditableTable = () => {
    if (!combinedData) return <p className="text-center text-white">No data to review.</p>;

    return (
      <div className="space-y-6">
        <Table className="bg-white/10 rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Field</TableHead>
              <TableHead className="text-white">Value</TableHead>
              <TableHead className="text-white text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fieldsToDisplay.map((key) => {
              const value = combinedData[key];
              const fieldLabel = displayLabels[key] || String(key).replace(/([A-Z])/g, ' $1').trim();
              
              // Skip rendering if value is null/undefined unless it's a specifically relevant field like choice fields
               if (value === null || value === undefined) {
                 if (!['coSignatoryChoice', 'workExperienceProofType', 'isCurrentlyWorking'].includes(key) && !(combinedData?.coSignatoryChoice === 'yes' && ['idNumber', 'nameOnId', 'idType'].includes(key))) {
                    return null;
                 }
               }

              return (
                <TableRow key={key}>
                  <TableCell className="font-medium capitalize text-gray-300">{fieldLabel}</TableCell>
                  <TableCell className="text-gray-200">
                    {editingField === key ? (
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
                    {editingField === key ? (
                      <Button onClick={handleSaveEdit} size="sm" className="gradient-border-button">
                        <Save className="mr-1 h-4 w-4" /> Save
                      </Button>
                    ) : ( // Allow editing for most fields
                      <Button onClick={() => handleEditField(key, value)} size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white">
                        <Edit3 className="mr-1 h-4 w-4" /> Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {renderConsentSection()}
      </div>
    );
  };

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
        <Button onClick={handleConfirmAndContinue} disabled={!consentChecked || isProcessingAi || isLoading} size="lg" className="gradient-border-button">
          Confirm & Continue
        </Button>
      </div>
    </div>
  );


  return (
    <div className="flex flex-col items-center">
      <section
        className="relative w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] pt-[5px] px-6 pb-6 md:px-8 md:pb-8 overflow-hidden shadow-[5px_5px_10px_hsl(0,0%,0%/0.2)] shadow-[inset_0_0_2px_hsl(var(--primary)/0.8)]"
        style={{
          backgroundImage:
            "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Untitled%20design.png')",
        }}
      >
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.30)] rounded-2xl z-0"></div>
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
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 sm:mr-2 shrink-0 ${ activeNavItem === item ? 'progress-dot-active' : 'bg-gray-400/60'}`} aria-hidden="true"></span>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="default" size="sm">Login</Button>
              <Link href="/loan-application/mobile" passHref>
                <Button variant="default" size="sm" className="gradient-border-button">Get Started</Button>
              </Link>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} />

          <div className="flex items-center mb-6 mt-4"> 
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/professional-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-4 w-full">
                    <div className="flex-shrink-0 mb-3 md:mb-0">
                        <Image
                        src="https://placehold.co/50x50.png"
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

              {(isLoading || isProcessingAi) && (!combinedData || Object.keys(combinedData).length <= Object.keys(initialData || {}).length) ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-lg text-white">
                    {isProcessingAi ? "AI is extracting details..." : "Loading your information..."}
                  </p>
                  <p className="text-sm text-gray-300">This might take a few moments.</p>
                </div>
              ) : (
                renderEditableTable()
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
