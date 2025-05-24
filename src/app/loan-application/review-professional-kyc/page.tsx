
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
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { getUserApplicationData, saveUserApplicationData, type UserApplicationData } from '@/services/firebase-service'; 

type CoSignatoryData = NonNullable<UserApplicationData['professionalKyc']>['coSignatory'];
type WorkEmploymentData = NonNullable<UserApplicationData['professionalKyc']>['workEmployment'];
type CombinedProfessionalData = Partial<CoSignatoryData & WorkEmploymentData>;
type EditableCombinedDataKey = keyof CombinedProfessionalData;


export default function ReviewProfessionalKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();
  const userId = getOrGenerateUserId();

  const [combinedData, setCombinedData] = useState<CombinedProfessionalData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingField, setEditingField] = useState<EditableCombinedDataKey | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const [avekaMessage, setAvekaMessage] = useState("Let's review all your professional details. Please check everything carefully.");
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
    const loadDataForReview = async () => {
      if (!userId) {
        toast({ title: "Error", description: "User ID not found. Please restart.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setAvekaMessage("Loading your professional information for review...");
      const result = await getUserApplicationData(userId);

      if (result.success && result.data?.professionalKyc) {
        const profKyc = result.data.professionalKyc;
        const mergedData: CombinedProfessionalData = {
          ...(profKyc.coSignatory || {}),
          ...(profKyc.workEmployment || {}),
        };
        setCombinedData(mergedData);
        setAvekaMessage("Great! Here's a summary of your professional information. Please review it carefully and make any corrections if needed.");
      } else if (result.error) {
        toast({ title: "Error Loading Data", description: result.error, variant: "destructive" });
        setAvekaMessage("Could not load your professional details for review. " + result.error);
      } else {
        toast({ title: "No Data", description: "No professional KYC data found to review. Please complete the previous steps.", variant: "destructive" });
        setAvekaMessage("It seems no professional details were found. Please go back and complete the previous steps.");
      }
      setIsLoading(false);
    };
    loadDataForReview();
  }, [userId, toast]);

  const handleEditField = (field: EditableCombinedDataKey, currentValue: string | number | undefined | null | boolean) => {
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

  const handleConfirmAndContinue = async () => {
    if (!userId) {
        toast({ title: "Error", description: "User ID not found.", variant: "destructive" });
        return;
    }
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    const professionalKycToSave: UserApplicationData['professionalKyc'] = {
        coSignatory: {},
        workEmployment: {},
        reviewedTimestamp: currentTime, 
    };

    const coSignatoryFields: (keyof CoSignatoryData)[] = ['coSignatoryChoice', 'coSignatoryIdDocumentType', 'coSignatoryRelationship', 'idNumber', 'idType', 'nameOnId', 'coSignatoryIdUrl', 'consentTimestamp'];
    const workEmploymentFields: (keyof WorkEmploymentData)[] = ['workExperienceIndustry', 'workExperienceYears', 'workExperienceMonths', 'workExperienceProofType', 'resumeUrl', 'linkedInUrl', 'extractedYearsOfExperience', 'extractedGapInLast3YearsMonths', 'extractedCurrentOrLastIndustry', 'extractedCurrentOrLastJobRole', 'isCurrentlyWorking', 'monthlySalary', 'salaryCurrency', 'familyMonthlySalary', 'familySalaryCurrency', 'consentTimestamp'];

    for (const key in combinedData) {
        if (coSignatoryFields.includes(key as any)) {
            professionalKycToSave.coSignatory![key as keyof CoSignatoryData] = combinedData[key as keyof CoSignatoryData];
        } else if (workEmploymentFields.includes(key as any)) {
            professionalKycToSave.workEmployment![key as keyof WorkEmploymentData] = combinedData[key as keyof WorkEmploymentData];
        }
    }
    
    const result = await saveUserApplicationData(userId, { professionalKyc: professionalKycToSave });
    setIsSaving(false);

    if (result.success) {
        toast({ title: "Professional Details Confirmed!", description: "Proceeding to next step." });
        const hasOfferLetter = localStorage.getItem('hasOfferLetterStatus');
        if (hasOfferLetter === 'false') { 
          router.push('/loan-application/preferences');
        } else { 
          router.push('/loan-application/lender-recommendations'); 
        }
    } else {
        toast({title: "Save Failed", description: result.error || "Could not save reviewed details.", variant: "destructive"});
    }
  };

  const displayLabels: Record<string, string> = {
    coSignatoryChoice: "Co-Signatory Added",
    coSignatoryIdDocumentType: "Co-Signatory ID Type",
    coSignatoryRelationship: "Relationship with Co-Signatory",
    idNumber: "Co-Signatory ID Number",
    idType: "Co-Signatory Extracted ID Type",
    nameOnId: "Name on Co-Signatory ID",
    coSignatoryIdUrl: "Co-Signatory ID Document",
    
    workExperienceIndustry: "Industry",
    workExperienceYears: "Experience Years",
    workExperienceMonths: "Experience Months",
    workExperienceProofType: "Professional Proof Type",
    resumeUrl: "Resume Document",
    linkedInUrl: "LinkedIn Profile",
    
    extractedYearsOfExperience: "Years of Experience (AI Extracted)",
    extractedGapInLast3YearsMonths: "Employment Gap (AI Extracted)",
    extractedCurrentOrLastIndustry: "Industry (AI Extracted)",
    extractedCurrentOrLastJobRole: "Job Role (AI Extracted)",
    
    isCurrentlyWorking: "Currently Working",
    monthlySalary: "Your Monthly Salary",
    salaryCurrency: "Your Salary Currency",
    familyMonthlySalary: "Family's Monthly Salary",
    familySalaryCurrency: "Family's Salary Currency",
  };
  
  const getFieldsToDisplay = (data: CombinedProfessionalData): EditableCombinedDataKey[] => {
    if (!data) return [];
    
    const orderedFields: EditableCombinedDataKey[] = [
      'coSignatoryChoice', 'coSignatoryIdDocumentType', 'coSignatoryRelationship', 'idNumber', 'idType', 'nameOnId', 'coSignatoryIdUrl',
      'workExperienceIndustry', 'workExperienceYears', 'workExperienceMonths', 'workExperienceProofType', 'resumeUrl', 'linkedInUrl',
      'extractedYearsOfExperience', 'extractedGapInLast3YearsMonths', 'extractedCurrentOrLastIndustry', 'extractedCurrentOrLastJobRole',
      'isCurrentlyWorking', 'monthlySalary', 'salaryCurrency', 'familyMonthlySalary', 'familySalaryCurrency'
    ];
    
    return orderedFields.filter(key => {
        const value = data[key as keyof typeof data];
        
        if (value === undefined || value === null) return false;
        if (data.coSignatoryChoice !== 'yes' && (key === 'coSignatoryIdDocumentType' || key === 'coSignatoryRelationship' || key === 'idNumber' || key === 'idType' || key === 'nameOnId' || key === 'coSignatoryIdUrl')) return false;
        if (data.workExperienceProofType !== 'resume' && key === 'resumeUrl') return false;
        if (data.workExperienceProofType !== 'linkedin' && key === 'linkedInUrl') return false;
        if (data.isCurrentlyWorking !== 'yes' && (key === 'monthlySalary' || key === 'salaryCurrency')) return false;
        if (data.isCurrentlyWorking !== 'no' && (key === 'familyMonthlySalary' || key === 'familySalaryCurrency')) return false;
        
        return true;
    });
  };

  const fieldsToDisplay = getFieldsToDisplay(combinedData);

  const renderEditableTable = () => {
    if (!combinedData) return <p className="text-center text-white">No professional details found to review.</p>;
    if (fieldsToDisplay.length === 0) return <p className="text-center text-white">No professional details were provided or extracted.</p>;

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
              const value = combinedData[key as keyof CombinedProfessionalData];
              const fieldLabel = displayLabels[key as string] || String(key).replace(/([A-Z])/g, ' $1').trim();
              let displayValue: React.ReactNode = String(value !== undefined && value !== null && String(value).trim() !== '' ? value : 'Not Specified');

              if (key === 'coSignatoryChoice') {
                displayValue = value === 'yes' ? 'Yes' : value === 'no' ? 'No' : value === 'addLater' ? 'Add Later' : 'Not Specified';
              } else if (key === 'isCurrentlyWorking') {
                displayValue = value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Not Specified';
              } else if (key === 'coSignatoryIdUrl' || key === 'resumeUrl') {
                displayValue = value ? <Link href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Document</Link> : "Not Provided";
              } else if (key === 'linkedInUrl' && value) {
                 displayValue = <Link href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{String(value)}</Link>;
              }


              const nonEditableFields: EditableCombinedDataKey[] = ['coSignatoryIdUrl', 'resumeUrl'];

              return (
                <TableRow key={key}>
                  <TableCell className="font-medium capitalize text-gray-300">{fieldLabel}</TableCell>
                  <TableCell className="text-gray-200 break-all">
                    {editingField === key && !nonEditableFields.includes(key) ? (
                      <Input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="bg-white/80 text-black" />
                    ) : ( displayValue )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingField === key && !nonEditableFields.includes(key) ? (
                      <Button onClick={handleSaveEdit} size="sm" className="gradient-border-button"><Save className="mr-1 h-4 w-4" /> Save</Button>
                    ) : !nonEditableFields.includes(key) ? ( 
                      <Button onClick={() => handleEditField(key, value)} size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white"><Edit3 className="mr-1 h-4 w-4" /> Edit</Button>
                    ) : null }
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
        <Checkbox id="consent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" disabled={isSaving}/>
        <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
          I confirm that all the details mentioned above are correct.
        </Label>
      </div>
      <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
      <div className="flex justify-center">
        <Button onClick={handleConfirmAndContinue} disabled={!consentChecked || isLoading || isSaving} size="lg" className="gradient-border-button">
           {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Confirm & Continue'}
        </Button>
      </div>
    </div>
  );


  return (
    <div className="flex flex-col items-center">
      <section
        className="relative w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] pt-[5px] px-6 pb-6 md:px-8 md:pb-8 overflow-hidden shadow-[5px_5px_10px_hsl(0,0%,0%/0.2)] shadow-[inset_0_0_2px_hsl(var(--primary)/0.8)]"
        style={{
          backgroundImage: "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Untitled%20design.png')",
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
                    <button onClick={() => setActiveNavItem(item)} className="text-white hover:opacity-75 transition-opacity focus:outline-none flex items-center text-xs sm:text-sm" aria-current={activeNavItem === item ? "page" : undefined}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 sm:mr-2 shrink-0 ${activeNavItem === item ? 'progress-dot-active' : 'bg-gray-400/60'}`} aria-hidden="true"></span>{item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="default" size="sm">Login</Button>
              <Link href="/loan-application/mobile" passHref><Button variant="default" size="sm" className="gradient-border-button">Get Started</Button></Link>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
          <div className="flex items-center mb-6 mt-4"> 
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/work-employment-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
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
                          width={50} height={50} className="rounded-full border-2 border-white shadow-md" 
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
                renderEditableTable()
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
