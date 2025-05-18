
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

// Simplified list for demo purposes
const ASIAN_COUNTRY_CODES = ['IN', 'PK', 'CN', 'BD', 'LK']; 

export default function AcademicKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [avekaMessage, setAvekaMessage] = useState("Let's gather some details about your academic background.");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null);

  // Graduation State
  const [gradLevel, setGradLevel] = useState<string | null>(null);
  const [gradCgpa, setGradCgpa] = useState('');
  const [gradCgpaScale, setGradCgpaScale] = useState<string | null>(null);
  const [gradCompletionDate, setGradCompletionDate] = useState<Date | undefined>(undefined);
  const [gradPursuingCourse, setGradPursuingCourse] = useState('');
  const [gradPursuingType, setGradPursuingType] = useState<string | null>(null);
  const [gradExpectedCompletion, setGradExpectedCompletion] = useState<Date | undefined>(undefined);
  const [gradNaReason, setGradNaReason] = useState('');

  // Post-Graduation State (similar to graduation)
  const [postGradLevel, setPostGradLevel] = useState<string | null>(null);
  // ... (add other post-grad state variables as needed)

  // Section Visibility
  const [showPostGradSection, setShowPostGradSection] = useState(false);
  const [showLanguageTestSection, setShowLanguageTestSection] = useState(false);
  // ... (add other section visibility states)

  // Consent
  const [academicConsentChecked, setAcademicConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    const countryVal = localStorage.getItem('selectedCountryValue');
    if (countryVal) {
      setUserCountryCode(countryVal.split('_')[1] || null);
    }
    setCurrentTime(new Date().toLocaleString());
    const timerId = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (gradLevel) { // Once grad level is selected, show post-grad section
      setAvekaMessage("Great! Now, please tell me about your post-graduation, if any.");
      setShowPostGradSection(true);
    }
  }, [gradLevel]);
  
  // Placeholder: useEffect to show language test section after post-grad is filled
  useEffect(() => {
    if (postGradLevel && showPostGradSection) { 
      setAvekaMessage("Thanks! Let's move on to language proficiency tests.");
      setShowLanguageTestSection(true);
    }
  }, [postGradLevel, showPostGradSection]);


  const handleSaveAndContinue = () => {
    if (!academicConsentChecked) {
      toast({ title: "Consent Required", description: "Please confirm your details.", variant: "destructive" });
      return;
    }
    // Process and save data
    console.log("Academic KYC Data:", { gradLevel, gradCgpa, gradCgpaScale /* ... and all other states */ });
    toast({ title: "Academic Details Saved!", description: "Proceeding to the next step." });
    // router.push('/loan-application/financials'); // Example next step
  };

  const renderGraduationDetails = () => (
    <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
      <h3 className="font-semibold text-lg text-center text-white">Graduation Details</h3>
      <div className="space-y-2">
        <Label className="text-white">Which level of graduation have you completed?</Label>
        <RadioGroup value={gradLevel || ''} onValueChange={setGradLevel} className="flex space-x-4 text-white">
          {["Degree", "Diploma", "Pursuing", "Not applicable"].map(level => (
            <div key={level} className="flex items-center space-x-2">
              <RadioGroupItem value={level} id={`grad-${level}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
              <Label htmlFor={`grad-${level}`}>{level}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      { (gradLevel === "Degree" || gradLevel === "Diploma") && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gradCgpa" className="text-white">CGPA/Percentage</Label>
              <Input id="gradCgpa" type="number" value={gradCgpa} onChange={(e) => setGradCgpa(e.target.value)} className="bg-white/80 text-black" />
            </div>
            <div>
              <Label htmlFor="gradCgpaScale" className="text-white">CGPA Scale (if applicable)</Label>
              <Select value={gradCgpaScale || ''} onValueChange={setGradCgpaScale}>
                <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Select scale" /></SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {[4, 5, 7, 8, 10].map(s => <SelectItem key={s} value={String(s)} className="hover:bg-gray-100">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="gradCompletionDate" className="text-white">Month & Year of Completion</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 text-black hover:text-black">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {gradCompletionDate ? format(gradCompletionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar mode="single" selected={gradCompletionDate} onSelect={setGradCompletionDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      { gradLevel === "Pursuing" && (
         <>
          <div>
            <Label htmlFor="gradPursuingCourse" className="text-white">Course Name</Label>
            <Input id="gradPursuingCourse" value={gradPursuingCourse} onChange={(e) => setGradPursuingCourse(e.target.value)} className="bg-white/80 text-black" />
          </div>
          <div>
            <Label className="text-white">Degree/Diploma</Label>
            <RadioGroup value={gradPursuingType || ''} onValueChange={setGradPursuingType} className="flex space-x-4 text-white">
              {["Degree", "Diploma"].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`grad-pursuing-${type}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
                  <Label htmlFor={`grad-pursuing-${type}`}>{type}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
           <div>
            <Label htmlFor="gradExpectedCompletion" className="text-white">Expected Month & Year of Completion</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 text-black hover:text-black">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {gradExpectedCompletion ? format(gradExpectedCompletion, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar mode="single" selected={gradExpectedCompletion} onSelect={setGradExpectedCompletion} initialFocus />
                </PopoverContent>
            </Popover>
          </div>
        </>
      )}
      { gradLevel === "Not applicable" && (
        <div>
          <Label htmlFor="gradNaReason" className="text-white">Please explain reason</Label>
          <Textarea id="gradNaReason" value={gradNaReason} onChange={(e) => setGradNaReason(e.target.value)} className="bg-white/80 text-black" />
        </div>
      )}
    </div>
  );

  // Placeholder for Post-Graduation Details - Similar structure to Graduation
  const renderPostGraduationDetails = () => (
    showPostGradSection && (
      <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
        <h3 className="font-semibold text-lg text-center text-white">Post-Graduation Details</h3>
         <div className="space-y-2">
            <Label className="text-white">Which level of post-graduation have you completed?</Label>
            <RadioGroup value={postGradLevel || ''} onValueChange={(value) => {setPostGradLevel(value); /* Further logic to show next section */}} className="flex space-x-4 text-white">
            {["Masters", "PhD", "Post-Graduate Diploma", "Pursuing", "Not applicable"].map(level => (
                <div key={`postgrad-${level}`} className="flex items-center space-x-2">
                <RadioGroupItem value={level} id={`postgrad-${level}`}  className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
                <Label htmlFor={`postgrad-${level}`}>{level}</Label>
                </div>
            ))}
            </RadioGroup>
        </div>
        {/* ... Conditional fields for Post-Graduation based on postGradLevel ... */}
        { postGradLevel && postGradLevel !== "Not applicable" && postGradLevel !== "Pursuing" && (
             <p className="text-sm text-gray-300 text-center">CGPA, Scale, Completion date fields will appear here.</p>
        )}
        { postGradLevel === "Pursuing" && (
             <p className="text-sm text-gray-300 text-center">Course name, type, expected completion fields will appear here.</p>
        )}
        { postGradLevel === "Not applicable" && (
             <p className="text-sm text-gray-300 text-center">Reason field will appear here.</p>
        )}
      </div>
    )
  );
  
  // Placeholder for Language Test Details
  const renderLanguageTestDetails = () => (
    showLanguageTestSection && (
      <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
        <h3 className="font-semibold text-lg text-center text-white">Language Test Details</h3>
        <p className="text-sm text-gray-300 text-center">Language test questions (IELTS, TOEFL, etc.) and conditional logic based on country ({userCountryCode || 'N/A'}) will appear here.</p>
      </div>
    )
  );

  // Placeholder for Course Test Details
  const renderCourseTestDetails = () => (
    // showCourseTestSection && ( ... )
    showLanguageTestSection && postGradLevel &&  // Simplified condition for now
    <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
      <h3 className="font-semibold text-lg text-center text-white">Course Test Details</h3>
      <p className="text-sm text-gray-300 text-center">Course test questions (GMAT, GRE, etc.) will appear here.</p>
    </div>
  );

  const renderSummaryAndConsent = () => (
     // showSummarySection && ( ... )
     showLanguageTestSection && postGradLevel && // Simplified condition for now
     <div className="mt-8 space-y-6 border-t border-gray-500/50 pt-6">
        <h3 className="font-semibold text-lg text-center text-white">Summary & Consent</h3>
        <p className="text-sm text-gray-300 text-center">A summary of all entered details and CGPA to percentage calculation will be shown here.</p>
        <div className="flex items-center space-x-2 justify-center">
            <Checkbox id="academicConsent" checked={academicConsentChecked} onCheckedChange={(checked) => setAcademicConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
            <Label htmlFor="academicConsent" className="text-sm font-medium text-white">
            I confirm that all academic details are correct.
            </Label>
        </div>
        <p className="text-xs text-gray-400 text-center">Consent captured at: {currentTime}</p>
        <div className="flex justify-center">
            <Button onClick={handleSaveAndContinue} disabled={!academicConsentChecked} size="lg" className="gradient-border-button">
            Save & Continue
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
                        className={`inline-block w-2 h-2 rounded-full mr-1.5 sm:mr-2 transition-all duration-300 ease-in-out ${
                          activeNavItem === item
                            ? 'bg-gradient-to-r from-red-500 to-yellow-400 shadow-[0_0_3px_theme(colors.red.500),0_0_5px_theme(colors.yellow.400)] scale-110'
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
                <Button variant="default" size="sm" className="gradient-border-button">Get Started</Button>
              </Link>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} />
           <div className="flex items-center mb-6 mt-4"> 
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/review-personal-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
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
              
              {renderGraduationDetails()}
              {renderPostGraduationDetails()}
              {renderLanguageTestDetails()}
              {renderCourseTestDetails()}
              {renderSummaryAndConsent()}

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

