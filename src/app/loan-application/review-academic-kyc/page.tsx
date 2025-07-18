
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { ArrowLeft, Loader2 } from 'lucide-react'; 
import { getOrGenerateUserId } from '@/lib/user-utils';
import { saveUserApplicationData } from '@/services/firebase-service';

interface AcademicDetail {
  level?: string | null;
  cgpa?: string;
  scale?: string | null;
  completionDate?: string;
  pursuingCourse?: string;
  pursuingType?: string | null;
  expectedCompletion?: string;
  naReason?: string;
}

interface TestDetail {
  given?: string | null;
  type?: string | null;
  ieltsScore?: string | null; 
  otherName?: string;
  score?: string;
  date?: string;
}

interface AcademicKycData {
  graduation?: AcademicDetail;
  postGraduation?: AcademicDetail;
  languageTest?: TestDetail;
  courseTest?: TestDetail;
  consentTimestamp?: string; // Added for saving
}


export default function ReviewAcademicKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();
  const userId = getOrGenerateUserId();

  const [academicData, setAcademicData] = useState<AcademicKycData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [avekaMessage, setAvekaMessage] = useState("Let's review your academic details. Please verify everything carefully.");
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
    const data = localStorage.getItem('academicKycData');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setAcademicData(parsedData);
      } catch (e) {
        console.error("Failed to parse academicKycData from localStorage", e);
        setAcademicData(null); 
        toast({
            title: "Error Loading Data",
            description: "Could not load your academic details. Please try again.",
            variant: "destructive",
        });
      }
    } else {
        toast({
            title: "No Data Found",
            description: "Could not find academic details to review. Please go back.",
            variant: "destructive",
        });
    }
    setIsLoading(false);
  }, [toast]);

  const handleConfirmAndContinue = async () => {
    if (!userId) {
        toast({ title: "Error", description: "User session not found.", variant: "destructive" });
        return;
    }
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    if (!academicData) {
      toast({ title: "Error", description: "No academic data to save.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const dataToSave = {
      academicKyc: {
        ...academicData,
        consentTimestamp: currentTime,
      }
    };

    const result = await saveUserApplicationData(userId, dataToSave);
    setIsSaving(false);

    if (result.success) {
        toast({ title: "Academic Details Confirmed!", description: "Proceeding to Professional KYC." });
        router.push('/loan-application/professional-kyc');
    } else {
        toast({ title: "Save Failed", description: result.error || "Could not save academic details.", variant: "destructive" });
    }
  };
  
  const formatDisplayDate = (dateString?: string): string => {
    if (!dateString || dateString === "Not Specified" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return "Not Specified";
    }
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };
  
  const renderSection = (title: string, dataObject: Record<string, any> | undefined, fieldLabels: Record<string, string>) => {
    if (!dataObject || Object.values(dataObject).every(val => val === null || val === undefined || String(val).trim() === '' || String(val).trim() === 'Not Specified')) {
      if (
        dataObject &&
        (title === "Graduation Details" || title === "Post-Graduation Details") &&
        dataObject?.level === "Not applicable" &&
        dataObject?.naReason
      ) {
        // Allow rendering if "Not applicable" is chosen and reason is provided
      } else {
        return null;
      }
    }

    const detailsToRender = Object.entries(fieldLabels)
        .map(([key, label]) => {
            let value = dataObject?.[key];
            
            if (value === null || value === undefined || String(value).trim() === '') {
                if(key === 'naReason' && dataObject.level !== 'Not applicable') return null; 
                if(key === 'scale' && !dataObject.cgpa) return null; 
                if(key === 'ieltsScore' && dataObject.type !== 'IELTS') return null;
                if(key === 'otherName' && !(dataObject.type === 'Other' || dataObject.type === 'Other Test')) return null;
                if(key === 'score' && dataObject.type === 'IELTS' && dataObject.ieltsScore ) return null;
                
                if (key !== 'naReason' && key !== 'scale' && key !== 'ieltsScore' && key !== 'otherName' && key !== 'score') value = "Not Specified"; else return null;
            }

            let displayValue = String(value);

            if (key.toLowerCase().includes('date') || key.toLowerCase().includes('completion')) {
                displayValue = formatDisplayDate(String(value));
            } else if (key === 'ieltsScore') {
                displayValue = value === 'yes' ? 'Yes (Above 6.5)' : value === 'no' ? 'No (6.5 or Below)' : String(value);
            } else if (key === 'given' && (title.includes("Language Test") || title.includes("Course Test"))) {
                displayValue = String(value).charAt(0).toUpperCase() + String(value).slice(1).replace('_', ' ');
            } else if (key === 'level' && (title === "Graduation Details" || title === "Post-Graduation Details")) {
                displayValue = String(value).charAt(0).toUpperCase() + String(value).slice(1);
            } else if (key === 'type' && (title === "Language Test Details" || title === "Course Test Details")) {
                 displayValue = String(value); 
            }

            return (
                <div key={`${title}-${key}`} className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-1 items-baseline">
                    <p className="text-sm text-gray-300 sm:col-span-1 sm:text-right">{label}:</p>
                    <p className="text-md text-white sm:col-span-2 font-medium">{displayValue}</p>
                </div>
            );
        })
        .filter(Boolean);

    if (detailsToRender.length === 0) return null;

    return (
      <div className="p-4 border-0 rounded-lg bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl mt-4">
        <h3 className="font-semibold text-lg text-white mb-3 text-center border-b border-gray-600/20 pb-2">{title}</h3>
        {detailsToRender}
      </div>
    );
  }

  const graduationLabels = {
    level: "Level",
    cgpa: "CGPA/Percentage",
    scale: "CGPA Scale",
    completionDate: "Completion Date",
    pursuingCourse: "Pursuing Course Name",
    pursuingType: "Pursuing Type",
    expectedCompletion: "Expected Completion Date",
    naReason: "Reason (N/A)"
  };

  const postGraduationLabels = { ...graduationLabels }; 

  const languageTestLabels = {
    given: "Appeared for Test",
    type: "Test Type",
    ieltsScore: "IELTS Score (Overall >6.5)", 
    otherName: "Other Test Name",
    score: "Score",
    date: "Test Date / Expected Date"
  };

  const courseTestLabels = {
    given: "Appeared for Test",
    type: "Test Type",
    otherName: "Other Test Name",
    score: "Score",
    date: "Test Date / Expected Date"
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(var(--background))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-white mt-4">Loading review data...</p>
      </div>
    );
  }

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
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/academic-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
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

              {academicData ? (
                <div className="space-y-4">
                  {renderSection("Graduation Details", academicData.graduation, graduationLabels)}
                  {renderSection("Post-Graduation Details", academicData.postGraduation, postGraduationLabels)}
                  {renderSection("Language Test Details", academicData.languageTest, languageTestLabels)}
                  {renderSection("Course Test Details", academicData.courseTest, courseTestLabels)}
                </div>
              ) : (
                <p className="text-center text-white">No academic details found to review. Please go back and fill them.</p>
              )}

              <div className="mt-8 space-y-6 border-t border-gray-500/50 pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="consent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" disabled={isSaving} />
                  <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    I confirm that all the details mentioned above are correct.
                  </Label>
                </div>
                <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
                <div className="flex justify-center">
                  <Button onClick={handleConfirmAndContinue} disabled={!consentChecked || isLoading || isSaving} size="lg" className="gradient-border-button">
                     {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Confirm & Continue'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
