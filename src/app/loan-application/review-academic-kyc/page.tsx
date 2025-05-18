
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
import { ArrowLeft } from 'lucide-react';

// Define a type for the academic data for clarity
interface AcademicData {
  graduation?: { level?: string | null; cgpa?: string; scale?: string | null; completionDate?: Date; pursuingCourse?: string; pursuingType?: string | null; expectedCompletion?: Date; naReason?: string; };
  postGraduation?: { level?: string | null; cgpa?: string; scale?: string | null; completionDate?: Date; pursuingCourse?: string; pursuingType?: string | null; expectedCompletion?: Date; naReason?: string; };
  languageTest?: { given?: string | null; type?: string | null; ieltsScore?: string | null; otherName?: string; score?: string; date?: Date; };
  courseTest?: { given?: string | null; type?: string | null; otherName?: string; score?: string; date?: Date; };
}


export default function ReviewAcademicKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [academicData, setAcademicData] = useState<AcademicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        // Convert date strings back to Date objects
        if (parsedData.graduation?.completionDate) {
          parsedData.graduation.completionDate = new Date(parsedData.graduation.completionDate);
        }
        if (parsedData.graduation?.expectedCompletion) {
          parsedData.graduation.expectedCompletion = new Date(parsedData.graduation.expectedCompletion);
        }
        if (parsedData.postGraduation?.completionDate) {
          parsedData.postGraduation.completionDate = new Date(parsedData.postGraduation.completionDate);
        }
        if (parsedData.postGraduation?.expectedCompletion) {
          parsedData.postGraduation.expectedCompletion = new Date(parsedData.postGraduation.expectedCompletion);
        }
        if (parsedData.languageTest?.date) {
          parsedData.languageTest.date = new Date(parsedData.languageTest.date);
        }
        if (parsedData.courseTest?.date) {
          parsedData.courseTest.date = new Date(parsedData.courseTest.date);
        }
        setAcademicData(parsedData);
      } catch (e) {
        console.error("Failed to parse academicKycData from localStorage", e);
        setAcademicData(null); // Or handle error appropriately
      }
    }
    setIsLoading(false);
  }, []);

  const handleConfirmAndContinue = () => {
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    console.log("Academic KYC Data Confirmed:", academicData);
    console.log("Consent given at:", currentTime);
    toast({ title: "Academic Details Confirmed!", description: "Proceeding to the next step." });
    // router.push('/loan-application/financial-details'); // Example next step
  };

  const renderDetailItem = (label: string, value: string | Date | undefined | null | number) => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    
    let displayValue = String(value);
    if (value instanceof Date && !isNaN(value.getTime())) {
        displayValue = value.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (value instanceof Date && isNaN(value.getTime())) {
        return null; // Invalid date
    }

    return (
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-1 items-baseline">
        <p className="text-sm text-gray-300 sm:col-span-1 sm:text-right">{label}:</p>
        <p className="text-md text-white sm:col-span-2 font-medium">{displayValue}</p>
      </div>
    );
  };

  const renderSection = (title: string, dataObject: Record<string, any> | undefined, fieldLabels: Record<string, string>) => {
    if (!dataObject || Object.values(dataObject).every(val => val === null || val === undefined || val === '')) return null;

    const detailsToRender = Object.entries(fieldLabels)
        .map(([key, label]) => renderDetailItem(label, dataObject[key]))
        .filter(Boolean);

    if (detailsToRender.length === 0) return null;

    return (
      <div className="p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
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
    pursuingCourse: "Pursuing Course",
    pursuingType: "Pursuing Type",
    expectedCompletion: "Expected Completion",
    naReason: "Reason (N/A)"
  };

  const postGraduationLabels = { ...graduationLabels }; // Same labels

  const languageTestLabels = {
    given: "Appeared for Test",
    type: "Test Type",
    ieltsScore: "IELTS > 6.5",
    otherName: "Other Test Name",
    score: "Score",
    date: "Test Date"
  };

  const courseTestLabels = {
    given: "Appeared for Test",
    type: "Test Type",
    otherName: "Other Test Name",
    score: "Score",
    date: "Test Date"
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-white">Loading review data...</p>
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
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.30)] rounded-2xl z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center py-4 mb-6">
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
                            ? 'bg-gradient-to-r from-red-500 to-yellow-400 shadow-[0_0_3px_theme(colors.red.500),0_0_5px_theme(colors.yellow.400)] scale-110'
                            : 'bg-gray-400/60'
                        }`}
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
                <Button variant="default" size="sm" className="gradient-border-button">Get Started</Button>
              </Link>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} />

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

              {academicData ? (
                <div className="space-y-4">
                  {renderSection("Graduation Details", academicData.graduation, graduationLabels)}
                  {renderSection("Post-Graduation Details", academicData.postGraduation, postGraduationLabels)}
                  {renderSection("Language Test Details", academicData.languageTest, languageTestLabels)}
                  {renderSection("Course Test Details", academicData.courseTest, courseTestLabels)}
                </div>
              ) : (
                <p className="text-center text-white">No academic details found to review.</p>
              )}

              <div className="mt-8 space-y-6 border-t border-gray-500/50 pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="consent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                  <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    I confirm that all the details mentioned above are correct.
                  </Label>
                </div>
                <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
                <div className="flex justify-center">
                  <Button onClick={handleConfirmAndContinue} disabled={!consentChecked} size="lg" className="gradient-border-button">
                    Confirm & Continue
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

    