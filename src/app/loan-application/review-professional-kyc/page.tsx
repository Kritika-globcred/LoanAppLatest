
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

interface CoSignatoryData {
  coSignatoryChoice?: string | null;
  coSignatoryIdDocumentType?: "PAN Card" | "National ID" | null;
  coSignatoryRelationship?: string | null;
  idNumber?: string;
  idType?: string;
  nameOnId?: string;
}

interface WorkEmploymentData {
  workExperienceIndustry?: string;
  workExperienceYears?: string;
  workExperienceMonths?: string;
  workExperienceProofType?: 'resume' | 'linkedin' | null;
  resumeFileName?: string | null;
  linkedInUrl?: string | null;
  isCurrentlyWorking?: 'yes' | 'no' | null;
  monthlySalary?: string | null;
  salaryCurrency?: string | null;
  familyMonthlySalary?: string | null;
  familySalaryCurrency?: string | null;
  extractedYearsOfExperience?: string;
  extractedGapInLast3YearsMonths?: string;
  extractedCurrentOrLastIndustry?: string;
  extractedCurrentOrLastJobRole?: string;
}

type CombinedProfessionalData = CoSignatoryData & WorkEmploymentData;
type EditableCombinedDataKey = keyof CombinedProfessionalData;

export default function ReviewProfessionalKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [combinedData, setCombinedData] = useState<CombinedProfessionalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
    setIsLoading(true);
    const coSignatoryDataString = localStorage.getItem('coSignatoryKycData');
    const workEmploymentDataString = localStorage.getItem('workEmploymentKycData');
    
    let loadedCoSignatoryData: Partial<CoSignatoryData> = {};
    let loadedWorkEmploymentData: Partial<WorkEmploymentData> = {};

    if (coSignatoryDataString) {
      try {
        loadedCoSignatoryData = JSON.parse(coSignatoryDataString);
      } catch (e) {
        console.error("Failed to parse coSignatoryKycData", e);
        toast({ title: "Error", description: "Could not load co-signatory data.", variant: "destructive" });
      }
    }

    if (workEmploymentDataString) {
      try {
        loadedWorkEmploymentData = JSON.parse(workEmploymentDataString);
      } catch (e) {
        console.error("Failed to parse workEmploymentKycData", e);
        toast({ title: "Error", description: "Could not load work/employment data.", variant: "destructive" });
      }
    }
    
    const mergedData: CombinedProfessionalData = { ...loadedCoSignatoryData, ...loadedWorkEmploymentData };
    if (Object.keys(mergedData).length > 0) {
      setCombinedData(mergedData);
      setAvekaMessage("Great! Here's a summary of your professional information. Please review it carefully and make any corrections if needed.");
    } else {
      setCombinedData(null);
      setAvekaMessage("It seems no professional details were found. Please go back and complete the previous steps.");
    }
    setIsLoading(false);

  }, [toast]);

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
    localStorage.setItem('professionalKycDataReviewed', JSON.stringify(combinedData));
    
    const hasOfferLetterStatus = localStorage.getItem('hasOfferLetterStatus');

    if (hasOfferLetterStatus === 'false') {
      toast({ title: "Professional Details Confirmed!", description: "Proceeding to Preferences." });
      router.push('/loan-application/preferences');
    } else {
      // Path for users who had an offer letter (or if status is unknown)
      toast({ title: "Professional Details Confirmed!", description: "Proceeding to Final Summary." });
      router.push('/loan-application/final-summary'); 
    }
  };

  const displayLabels: Record<string, string> = {
    coSignatoryChoice: "Co-Signatory Added",
    coSignatoryIdDocumentType: "Co-Signatory ID Type (Selected)",
    coSignatoryRelationship: "Relationship with Co-Signatory",
    idNumber: "Co-Signatory ID Number (Extracted)",
    idType: "Co-Signatory ID Type (Extracted)",
    nameOnId: "Name on Co-Signatory ID (Extracted)",
    
    workExperienceIndustry: "Industry (Manual)",
    workExperienceYears: "Experience (Years - Manual)",
    workExperienceMonths: "Experience (Months - Manual)",
    workExperienceProofType: "Professional Proof Type",
    resumeFileName: "Resume File Name",
    linkedInUrl: "LinkedIn URL",
    
    extractedYearsOfExperience: "Years of Experience (Extracted)",
    extractedGapInLast3YearsMonths: "Gap in Last 3 Years (Extracted)",
    extractedCurrentOrLastIndustry: "Industry (Extracted)",
    extractedCurrentOrLastJobRole: "Job Role (Extracted)",
    
    isCurrentlyWorking: "Currently Working",
    monthlySalary: "Your Monthly Salary",
    salaryCurrency: "Your Salary Currency",
    familyMonthlySalary: "Family's Monthly Salary",
    familySalaryCurrency: "Family's Salary Currency",
  };
  
  const getFieldsToDisplay = (data: CombinedProfessionalData | null): EditableCombinedDataKey[] => {
    if (!data) return [];
    
    let fields: EditableCombinedDataKey[] = [];

    // Co-Signatory section
    if (data.coSignatoryChoice !== undefined) fields.push('coSignatoryChoice');
    if (data.coSignatoryChoice === 'yes') {
      if (data.coSignatoryIdDocumentType) fields.push('coSignatoryIdDocumentType');
      if (data.coSignatoryRelationship) fields.push('coSignatoryRelationship');
      if (data.idNumber) fields.push('idNumber');
      if (data.idType) fields.push('idType');
      if (data.nameOnId) fields.push('nameOnId');
    }

    // Work Experience (Manual)
    if (data.workExperienceIndustry) fields.push('workExperienceIndustry');
    if (data.workExperienceYears) fields.push('workExperienceYears');
    if (data.workExperienceMonths) fields.push('workExperienceMonths');
    
    // Professional Proof
    if (data.workExperienceProofType) fields.push('workExperienceProofType');
    if (data.workExperienceProofType === 'resume' && data.resumeFileName) fields.push('resumeFileName');
    if (data.workExperienceProofType === 'linkedin' && data.linkedInUrl) fields.push('linkedInUrl');

    // Professional Profile (Extracted from Resume/LinkedIn)
    if (data.extractedYearsOfExperience) fields.push('extractedYearsOfExperience');
    if (data.extractedGapInLast3YearsMonths) fields.push('extractedGapInLast3YearsMonths');
    if (data.extractedCurrentOrLastIndustry) fields.push('extractedCurrentOrLastIndustry');
    if (data.extractedCurrentOrLastJobRole) fields.push('extractedCurrentOrLastJobRole');

    // Employment Status
    if (data.isCurrentlyWorking) fields.push('isCurrentlyWorking');
    if (data.isCurrentlyWorking === 'yes') {
      if (data.monthlySalary) fields.push('monthlySalary');
      if (data.salaryCurrency) fields.push('salaryCurrency');
    } else if (data.isCurrentlyWorking === 'no') {
      if (data.familyMonthlySalary) fields.push('familyMonthlySalary');
      if (data.familySalaryCurrency) fields.push('familySalaryCurrency');
    }
    
    return fields.filter((value, index, self) => self.indexOf(value) === index && data[value as keyof CombinedProfessionalData] !== undefined && data[value as keyof CombinedProfessionalData] !== null && String(data[value as keyof CombinedProfessionalData]).trim() !== '');
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
              const fieldLabel = displayLabels[key] || String(key).replace(/([A-Z])/g, ' $1').trim();
              let displayValue = String(value !== undefined && value !== null && String(value).trim() !== '' ? value : 'Not Specified');
              if (key === 'coSignatoryChoice') {
                displayValue = value === 'yes' ? 'Yes' : value === 'no' ? 'No' : value === 'addLater' ? 'Add Later' : 'Not Specified';
              } else if (key === 'isCurrentlyWorking') {
                displayValue = value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Not Specified';
              }

              return (
                <TableRow key={key}>
                  <TableCell className="font-medium capitalize text-gray-300">{fieldLabel}</TableCell>
                  <TableCell className="text-gray-200">
                    {editingField === key ? (
                      <Input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="bg-white/80 text-black" />
                    ) : ( displayValue )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingField === key ? (
                      <Button onClick={handleSaveEdit} size="sm" className="gradient-border-button"><Save className="mr-1 h-4 w-4" /> Save</Button>
                    ) : ( 
                      <Button onClick={() => handleEditField(key, value)} size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white"><Edit3 className="mr-1 h-4 w-4" /> Edit</Button>
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
        <Button onClick={handleConfirmAndContinue} disabled={!consentChecked || isLoading} size="lg" className="gradient-border-button">
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
          backgroundImage: "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Untitled%20design.png')",
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
          <LoanProgressBar steps={loanAppSteps} />

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
                        <Image src="https://placehold.co/50x50.png" alt="Aveka" width={50} height={50} className="rounded-full border-2 border-white shadow-md" data-ai-hint="robot avatar" />
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
                  <p className="mt-4 text-lg text-white">Loading your professional information...</p>
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
