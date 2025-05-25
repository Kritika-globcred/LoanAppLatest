
'use client';

import type { ChangeEvent } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { ArrowLeft } from 'lucide-react';

const ASIAN_COUNTRY_CODES = ['IN', 'PK', 'CN', 'BD', 'LK']; // Example list
const currentYear = new Date().getFullYear();

const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
const months = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const pastYears = Array.from({ length: 71 }, (_, i) => String(currentYear - i));
const futureYearsShort = Array.from({ length: 16 }, (_, i) => String(currentYear - 5 + i)); // current - 5 to current + 10
const futureYearsTest = Array.from({ length: 3 }, (_, i) => String(currentYear + i)); // current to current + 2

export default function AcademicKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [avekaMessage, setAvekaMessage] = useState("Let's gather some details about your academic background. Start with your graduation.");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null);
  const [isAsianCountry, setIsAsianCountry] = useState<boolean | null>(null);

  // Graduation State
  const [gradLevel, setGradLevel] = useState<string | null>(null);
  const [gradCgpa, setGradCgpa] = useState('');
  const [gradCgpaScale, setGradCgpaScale] = useState<string | null>(null);
  const [gradCompletionDay, setGradCompletionDay] = useState<string | undefined>();
  const [gradCompletionMonth, setGradCompletionMonth] = useState<string | undefined>();
  const [gradCompletionYear, setGradCompletionYear] = useState<string | undefined>();
  const [gradPursuingCourse, setGradPursuingCourse] = useState('');
  const [gradPursuingType, setGradPursuingType] = useState<string | null>(null);
  const [gradExpectedCompletionDay, setGradExpectedCompletionDay] = useState<string | undefined>();
  const [gradExpectedCompletionMonth, setGradExpectedCompletionMonth] = useState<string | undefined>();
  const [gradExpectedCompletionYear, setGradExpectedCompletionYear] = useState<string | undefined>();
  const [gradNaReason, setGradNaReason] = useState('');

  // Post-Graduation State
  const [postGradLevel, setPostGradLevel] = useState<string | null>(null);
  const [postGradCgpa, setPostGradCgpa] = useState('');
  const [postGradCgpaScale, setPostGradCgpaScale] = useState<string | null>(null);
  const [postGradCompletionDay, setPostGradCompletionDay] = useState<string | undefined>();
  const [postGradCompletionMonth, setPostGradCompletionMonth] = useState<string | undefined>();
  const [postGradCompletionYear, setPostGradCompletionYear] = useState<string | undefined>();
  const [postGradPursuingCourse, setPostGradPursuingCourse] = useState('');
  const [postGradPursuingType, setPostGradPursuingType] = useState<string | null>(null);
  const [postGradExpectedCompletionDay, setPostGradExpectedCompletionDay] = useState<string | undefined>();
  const [postGradExpectedCompletionMonth, setPostGradExpectedCompletionMonth] = useState<string | undefined>();
  const [postGradExpectedCompletionYear, setPostGradExpectedCompletionYear] = useState<string | undefined>();
  const [postGradNaReason, setPostGradNaReason] = useState('');

  // Language Test State
  const [languageTestGiven, setLanguageTestGiven] = useState<string | null>(null);
  const [languageTestType, setLanguageTestType] = useState<string | null>(null); 
  const [languageTestOtherName, setLanguageTestOtherName] = useState(''); 
  const [languageTestScore, setLanguageTestScore] = useState('');
  const [languageTestDay, setLanguageTestDay] = useState<string | undefined>();
  const [languageTestMonth, setLanguageTestMonth] = useState<string | undefined>();
  const [languageTestYear, setLanguageTestYear] = useState<string | undefined>();
  const [ieltsAbove65, setIeltsAbove65] = useState<string | null>(null); 

  // Course Test State
  const [courseTestGiven, setCourseTestGiven] = useState<string | null>(null);
  const [courseTestType, setCourseTestType] = useState<string | null>(null); 
  const [courseTestOtherName, setCourseTestOtherName] = useState(''); 
  const [courseTestScore, setCourseTestScore] = useState('');
  const [courseTestDay, setCourseTestDay] = useState<string | undefined>();
  const [courseTestMonth, setCourseTestMonth] = useState<string | undefined>();
  const [courseTestYear, setCourseTestYear] = useState<string | undefined>();

  // Section Visibility & Progression
  const [showGraduation, setShowGraduation] = useState(true);
  const [showPostGraduation, setShowPostGraduation] = useState(false);
  const [showLanguageTest, setShowLanguageTest] = useState(false);
  const [showCourseTest, setShowCourseTest] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    const countryVal = localStorage.getItem('selectedCountryValue');
    if (countryVal) {
      const code = countryVal.split('_')[1];
      setUserCountryCode(code || null);
      setIsAsianCountry(ASIAN_COUNTRY_CODES.includes(code || ''));
    }
    return () => clearTimeout(timer);
  }, []);

  const isGraduationComplete = () => {
    if (!gradLevel) return false;
    if (gradLevel === "Degree" || gradLevel === "Diploma") {
      return gradCgpa && gradCompletionYear && gradCompletionMonth && gradCompletionDay;
    }
    if (gradLevel === "Pursuing") {
      return gradPursuingCourse && gradPursuingType && gradExpectedCompletionYear && gradExpectedCompletionMonth && gradExpectedCompletionDay;
    }
    if (gradLevel === "Not applicable") {
      return gradNaReason.trim() !== '';
    }
    return false;
  };

  const isPostGraduationComplete = () => {
    if (!postGradLevel) return false;
    if (postGradLevel === "Degree" || postGradLevel === "Diploma") {
      return postGradCgpa && postGradCompletionYear && postGradCompletionMonth && postGradCompletionDay;
    }
    if (postGradLevel === "Pursuing") {
      return postGradPursuingCourse && postGradPursuingType && postGradExpectedCompletionYear && postGradExpectedCompletionMonth && postGradExpectedCompletionDay;
    }
    // Removed the requirement for naReason when postGradLevel is "Not applicable"
    return true;
  };
  
  const isLanguageTestComplete = () => {
    if (!languageTestGiven) return false;
    if (languageTestGiven === 'no') return true;
    if (languageTestGiven === 'yet_to_appear') {
      return languageTestDay && languageTestMonth && languageTestYear;
    }
    if (languageTestGiven === 'yes') {
      if (isAsianCountry) { 
        if (languageTestType === 'IELTS') return ieltsAbove65 !== null;
        if (languageTestType === 'Other') return languageTestOtherName.trim() !== '' && languageTestScore.trim() !== '';
      } else { 
        if (!languageTestType) return false; 
        if (languageTestType === 'Other Test') return languageTestOtherName.trim() !== '' && languageTestScore.trim() !== ''; 
        return languageTestScore.trim() !== ''; 
      }
    }
    return false;
  };

  const isCourseTestComplete = () => {
    if (!courseTestGiven) return false;
    if (courseTestGiven === 'no') return true;
    if (courseTestGiven === 'yet_to_appear') {
      return courseTestDay && courseTestMonth && courseTestYear;
    }
    if (courseTestGiven === 'yes') {
      if (!courseTestType) return false;
      if (courseTestType === 'Other') return courseTestOtherName.trim() !== '' && courseTestScore.trim() !== '';
      return courseTestScore.trim() !== ''; 
    }
    return false;
  };


  useEffect(() => {
    if (isGraduationComplete() && !showPostGraduation) {
      setAvekaMessage("Great! Now, please tell me about your post-graduation, if any.");
      setShowPostGraduation(true);
    }
  }, [gradLevel, gradCgpa, gradCompletionYear, gradCompletionMonth, gradCompletionDay, gradPursuingCourse, gradPursuingType, gradExpectedCompletionYear, gradExpectedCompletionMonth, gradExpectedCompletionDay, gradNaReason, showPostGraduation, isGraduationComplete]);

  useEffect(() => {
    if (showPostGraduation && isPostGraduationComplete() && !showLanguageTest) {
      setAvekaMessage("Thanks! Let's move on to language proficiency tests. Have you appeared for any?");
      setShowLanguageTest(true);
    }
  }, [postGradLevel, postGradCgpa, postGradCompletionYear, postGradCompletionMonth, postGradCompletionDay, postGradPursuingCourse, postGradPursuingType, postGradExpectedCompletionYear, postGradExpectedCompletionMonth, postGradExpectedCompletionDay, postGradNaReason, showPostGraduation, showLanguageTest, isPostGraduationComplete]);

  useEffect(() => {
    if (showLanguageTest && isLanguageTestComplete() && !showCourseTest) {
      setAvekaMessage("Almost there! Lastly, any specific course tests like GMAT or GRE?");
      setShowCourseTest(true);
    }
  }, [languageTestGiven, languageTestType, ieltsAbove65, languageTestOtherName, languageTestScore, languageTestDay, languageTestMonth, languageTestYear, isAsianCountry, showLanguageTest, showCourseTest, isLanguageTestComplete]);
  
  useEffect(() => {
    if (showCourseTest && isCourseTestComplete()) {
      setAvekaMessage("Fantastic! You've completed the academic details. Please click 'Save & Continue' to proceed to the review page.");
    }
  }, [courseTestGiven, courseTestType, courseTestOtherName, courseTestScore, courseTestDay, courseTestMonth, courseTestYear, showCourseTest, isCourseTestComplete]);


  const handleSaveAndContinue = () => {
    const constructDateString = (year?: string, month?: string, day?: string): string | undefined => {
      if (year && month && day) {
        const formattedMonth = month.padStart(2, '0');
        const formattedDay = day.padStart(2, '0');
        return `${year}-${formattedMonth}-${formattedDay}`;
      }
      return undefined;
    };

    const academicData = {
      graduation: { 
        level: gradLevel, 
        cgpa: gradCgpa, 
        scale: gradCgpaScale, 
        completionDate: constructDateString(gradCompletionYear, gradCompletionMonth, gradCompletionDay),
        pursuingCourse: gradPursuingCourse, 
        pursuingType: gradPursuingType, 
        expectedCompletion: constructDateString(gradExpectedCompletionYear, gradExpectedCompletionMonth, gradExpectedCompletionDay),
        naReason: gradNaReason 
      },
      postGraduation: { 
        level: postGradLevel, 
        cgpa: postGradCgpa, 
        scale: postGradCgpaScale, 
        completionDate: constructDateString(postGradCompletionYear, postGradCompletionMonth, postGradCompletionDay), 
        pursuingCourse: postGradPursuingCourse, 
        pursuingType: postGradPursuingType, 
        expectedCompletion: constructDateString(postGradExpectedCompletionYear, postGradExpectedCompletionMonth, postGradExpectedCompletionDay),
        naReason: postGradNaReason 
      },
      languageTest: { 
        given: languageTestGiven, 
        type: languageTestType, 
        ieltsScore: ieltsAbove65, 
        otherName: languageTestOtherName, 
        score: languageTestScore, 
        date: constructDateString(languageTestYear, languageTestMonth, languageTestDay)
      },
      courseTest: { 
        given: courseTestGiven, 
        type: courseTestType, 
        otherName: courseTestOtherName, 
        score: courseTestScore, 
        date: constructDateString(courseTestYear, courseTestMonth, courseTestDay)
      },
    };
    
    localStorage.setItem('academicKycData', JSON.stringify(academicData));
    toast({ title: "Academic Details Saved!", description: "Proceeding to review your academic details." });
    router.push('/loan-application/review-academic-kyc');
  };

  const renderDateDropdowns = (
    dayValue: string | undefined, onDayChange: (value: string) => void,
    monthValue: string | undefined, onMonthChange: (value: string) => void,
    yearValue: string | undefined, onYearChange: (value: string) => void,
    yearOptions: string[]
  ) => (
    <div className="grid grid-cols-3 gap-2 items-center">
      <Select value={dayValue} onValueChange={onDayChange}>
        <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Day" /></SelectTrigger>
        <SelectContent className="bg-white text-black">
          {days.map(d => <SelectItem key={`day-${d}`} value={d} className="hover:bg-gray-100">{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={monthValue} onValueChange={onMonthChange}>
        <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Month" /></SelectTrigger>
        <SelectContent className="bg-white text-black">
          {months.map(m => <SelectItem key={`month-${m.value}`} value={m.value} className="hover:bg-gray-100">{m.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={yearValue} onValueChange={onYearChange}>
        <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Year" /></SelectTrigger>
        <SelectContent className="bg-white text-black">
          {yearOptions.map(y => <SelectItem key={`year-${y}`} value={y} className="hover:bg-gray-100">{y}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const renderGraduationDetails = () => (
    <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
      <h3 className="font-semibold text-lg text-center text-white">Graduation Details</h3>
      <div className="space-y-2">
        <Label className="text-white">Which level of graduation have you completed?</Label>
        <RadioGroup value={gradLevel || ''} onValueChange={setGradLevel} className="flex flex-wrap gap-x-4 gap-y-2 text-white">
          {["Degree", "Diploma", "Pursuing", "Not applicable"].map(level => (
            <div key={`grad-${level}`} className="flex items-center space-x-2">
              <RadioGroupItem value={level} id={`grad-${level}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
              <Label htmlFor={`grad-${level}`}>{level}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      { (gradLevel === "Degree" || gradLevel === "Diploma") && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="gradCgpa" className="text-white">CGPA/Percentage</Label><Input id="gradCgpa" type="number" value={gradCgpa} onChange={(e) => setGradCgpa(e.target.value)} className="bg-white/80 text-black" /></div>
            <div>
              <Label htmlFor="gradCgpaScale" className="text-white">CGPA Scale (if applicable)</Label>
              <Select value={gradCgpaScale || ''} onValueChange={setGradCgpaScale}>
                <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Select scale" /></SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {[4, 5, 7, 8, 10].map(s => <SelectItem key={`grad-scale-${s}`} value={String(s)} className="hover:bg-gray-100">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-white">Month & Year of Completion</Label>
            {renderDateDropdowns(gradCompletionDay, setGradCompletionDay, gradCompletionMonth, setGradCompletionMonth, gradCompletionYear, setGradCompletionYear, pastYears)}
          </div>
        </>
      )}
      { gradLevel === "Pursuing" && (
         <>
          <div>
            <Label htmlFor="gradPursuingCourse" className="text-white">Course Name</Label>
            <Input id="gradPursuingCourse" value={gradPursuingCourse} onChange={(e) => setGradPursuingCourse(e.target.value)} placeholder="E.g., Bachelor of Technology in CS" className="bg-white/80 text-black" />
          </div>
          <div>
            <Label className="text-white">Degree/Diploma</Label>
            <RadioGroup value={gradPursuingType || ''} onValueChange={setGradPursuingType} className="flex space-x-4 text-white">
              {["Degree", "Diploma"].map(type => (<div key={`grad-pursuing-${type}`} className="flex items-center space-x-2"><RadioGroupItem value={type} id={`grad-pursuing-${type}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor={`grad-pursuing-${type}`}>{type}</Label></div>))}
            </RadioGroup>
          </div>
           <div>
            <Label className="text-white">Expected Month & Year of Completion</Label>
            {renderDateDropdowns(gradExpectedCompletionDay, setGradExpectedCompletionDay, gradExpectedCompletionMonth, setGradExpectedCompletionMonth, gradExpectedCompletionYear, setGradExpectedCompletionYear, futureYearsShort)}
          </div>
        </>
      )}
      { gradLevel === "Not applicable" && (<div><Label htmlFor="gradNaReason" className="text-white">Please explain reason</Label><Textarea id="gradNaReason" value={gradNaReason} onChange={(e) => setGradNaReason(e.target.value)} className="bg-white/80 text-black" /></div>)}
    </div>
  );

  const renderPostGraduationDetails = () => (
    showPostGraduation && (
      <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
        <h3 className="font-semibold text-lg text-center text-white">Post-Graduation Details</h3>
        <div className="space-y-2">
            <Label className="text-white">Which level of post-graduation have you completed?</Label>
            <RadioGroup value={postGradLevel || ''} onValueChange={setPostGradLevel} className="flex flex-wrap gap-x-4 gap-y-2 text-white">
            {["Degree", "Diploma", "Pursuing", "Not applicable"].map(level => (
                <div key={`postgrad-${level}`} className="flex items-center space-x-2">
                <RadioGroupItem value={level} id={`postgrad-${level}`}  className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
                <Label htmlFor={`postgrad-${level}`}>{level}</Label>
                </div>
            ))}
            </RadioGroup>
        </div>
        { (postGradLevel === "Degree" || postGradLevel === "Diploma") && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="postGradCgpa" className="text-white">CGPA/Percentage</Label><Input id="postGradCgpa" type="number" value={postGradCgpa} onChange={(e) => setPostGradCgpa(e.target.value)} className="bg-white/80 text-black" /></div>
              <div>
                <Label htmlFor="postGradCgpaScale" className="text-white">CGPA Scale (if applicable)</Label>
                <Select value={postGradCgpaScale || ''} onValueChange={setPostGradCgpaScale}>
                  <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Select scale" /></SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {[4, 5, 7, 8, 10].map(s => <SelectItem key={`postgrad-scale-${s}`} value={String(s)} className="hover:bg-gray-100">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white">Month & Year of Completion</Label>
              {renderDateDropdowns(postGradCompletionDay, setPostGradCompletionDay, postGradCompletionMonth, setPostGradCompletionMonth, postGradCompletionYear, setPostGradCompletionYear, pastYears)}
            </div>
          </>
        )}
        { postGradLevel === "Pursuing" && (
           <>
            <div>
              <Label htmlFor="postGradPursuingCourse" className="text-white">Course Name</Label>
              <Input id="postGradPursuingCourse" value={postGradPursuingCourse} onChange={(e) => setPostGradPursuingCourse(e.target.value)} placeholder="E.g., Master of Business Administration" className="bg-white/80 text-black" />
            </div>
            <div>
              <Label className="text-white">Degree/Diploma</Label>
              <RadioGroup value={postGradPursuingType || ''} onValueChange={setPostGradPursuingType} className="flex space-x-4 text-white">
                {["Degree", "Diploma"].map(type => (<div key={`postgrad-pursuing-${type}`} className="flex items-center space-x-2"><RadioGroupItem value={type} id={`postgrad-pursuing-${type}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor={`postgrad-pursuing-${type}`}>{type}</Label></div>))}
              </RadioGroup>
            </div>
             <div>
              <Label className="text-white">Expected Month & Year of Completion</Label>
              {renderDateDropdowns(postGradExpectedCompletionDay, setPostGradExpectedCompletionDay, postGradExpectedCompletionMonth, setPostGradExpectedCompletionMonth, postGradExpectedCompletionYear, setPostGradExpectedCompletionYear, futureYearsShort)}
            </div>
          </>
        )}
      </div>
    )
  );
  
  const renderLanguageTestDetails = () => (
    showLanguageTest && (
      <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
        <h3 className="font-semibold text-lg text-center text-white">Language Test Details</h3>
        <Label className="text-white">Have you appeared for any language proficiency test (e.g., IELTS, TOEFL)?</Label>
        <RadioGroup value={languageTestGiven || ''} onValueChange={setLanguageTestGiven} className="flex flex-wrap gap-x-4 gap-y-2 text-white">
          {[{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}, {value: 'yet_to_appear', label: 'Yet to Appear'}].map(opt => (
            <div key={`lang-given-${opt.value}`} className="flex items-center space-x-2">
              <RadioGroupItem value={opt.value} id={`lang-given-${opt.value}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
              <Label htmlFor={`lang-given-${opt.value}`}>{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>

        {languageTestGiven === 'yes' && (
          <div className="space-y-4">
            {isAsianCountry === null && <p className="text-white text-sm">Loading country information...</p>}
            {isAsianCountry === true && ( 
              <>
                <Label className="text-white">Which test have you appeared for?</Label>
                <RadioGroup value={languageTestType || ''} onValueChange={(value) => { setLanguageTestType(value); setLanguageTestOtherName(''); setLanguageTestScore(''); setIeltsAbove65(null); }} className="flex space-x-4 text-white">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="IELTS" id="lang-ielts" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="lang-ielts">IELTS</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Other" id="lang-other-asian" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="lang-other-asian">Other (e.g., PTE, TOEFL)</Label></div>
                </RadioGroup>

                {languageTestType === 'IELTS' && (
                  <div>
                    <Label className="text-white">Have you scored above 6.5 overall in IELTS?</Label>
                    <RadioGroup value={ieltsAbove65 || ''} onValueChange={setIeltsAbove65} className="flex space-x-4 text-white">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="ielts-yes" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="ielts-yes">Yes</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="ielts-no" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="ielts-no">No</Label></div>
                    </RadioGroup>
                  </div>
                )}
                {languageTestType === 'Other' && ( 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <Label htmlFor="languageTestOtherNameAsian" className="text-white">Specify Test Name</Label>
                        <Input id="languageTestOtherNameAsian" value={languageTestOtherName} onChange={(e) => setLanguageTestOtherName(e.target.value)} className="bg-white/80 text-black w-full" />
                    </div>
                    <div>
                        <Label htmlFor="languageTestScoreAsian" className="text-white">Your Score</Label>
                        <Input id="languageTestScoreAsian" value={languageTestScore} onChange={(e) => setLanguageTestScore(e.target.value)} className="bg-white/80 text-black w-full" />
                    </div>
                  </div>
                )}
              </>
            )}
            {isAsianCountry === false && ( 
              <>
                <Label className="text-white">Which test have you appeared for?</Label>
                 <Select value={languageTestType || ''} onValueChange={(value) => {setLanguageTestType(value); if (value !== 'Other Test') {setLanguageTestOtherName('');} setLanguageTestScore(''); }}>
                  <SelectTrigger className="bg-white/80 text-black w-full md:w-auto"><SelectValue placeholder="Select test" /></SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {['TOEFL', 'PTE', 'Duolingo', 'Other Test'].map(test => <SelectItem key={`lang-test-nonasian-${test}`} value={test} className="hover:bg-gray-100">{test}</SelectItem>)}
                  </SelectContent>
                </Select>
                
                {languageTestType === 'Other Test' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                      <div>
                          <Label htmlFor="languageTestOtherNameNonAsian" className="text-white">Specify Test Name</Label>
                          <Input id="languageTestOtherNameNonAsian" value={languageTestOtherName} onChange={(e) => setLanguageTestOtherName(e.target.value)} className="bg-white/80 text-black w-full" />
                      </div>
                      <div>
                          <Label htmlFor="languageTestScoreNonAsianOther" className="text-white">Your Score</Label>
                          <Input id="languageTestScoreNonAsianOther" value={languageTestScore} onChange={(e) => setLanguageTestScore(e.target.value)} className="bg-white/80 text-black w-full" />
                      </div>
                  </div>
                )}
                {(languageTestType && languageTestType !== '' && languageTestType !== 'Other Test') && ( 
                    <div className="mt-4"> 
                        <Label htmlFor="languageTestScoreNonAsianDirect" className="text-white">Your Score for {languageTestType}</Label>
                        <Input id="languageTestScoreNonAsianDirect" value={languageTestScore} onChange={(e) => setLanguageTestScore(e.target.value)} className="bg-white/80 text-black w-full md:w-1/2" />
                    </div>
                )}
              </>
            )}
          </div>
        )}
        {languageTestGiven === 'yet_to_appear' && (
          <div>
            <Label className="text-white">Expected Test Date</Label>
            {renderDateDropdowns(languageTestDay, setLanguageTestDay, languageTestMonth, setLanguageTestMonth, languageTestYear, setLanguageTestYear, futureYearsTest)}
          </div>
        )}
      </div>
    )
  );
  
  const renderCourseTestDetails = () => (
    showCourseTest && (
      <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
        <h3 className="font-semibold text-lg text-center text-white">Course Test Details</h3>
        <Label className="text-white">Have you appeared for any course-specific test (e.g., GMAT, GRE)?</Label>
        <RadioGroup value={courseTestGiven || ''} onValueChange={setCourseTestGiven} className="flex flex-wrap gap-x-4 gap-y-2 text-white">
            {[{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}, {value: 'yet_to_appear', label: 'Yet to Appear'}].map(opt => (
                <div key={`course-given-${opt.value}`} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`course-given-${opt.value}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
                <Label htmlFor={`course-given-${opt.value}`}>{opt.label}</Label>
                </div>
            ))}
        </RadioGroup>

        {courseTestGiven === 'yes' && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <Label className="text-white">Which test have you appeared for?</Label>
                        <Select value={courseTestType || ''} onValueChange={(value) => {setCourseTestType(value); if (value !== 'Other') setCourseTestOtherName(''); setCourseTestScore(''); }}>
                            <SelectTrigger className="bg-white/80 text-black w-full"><SelectValue placeholder="Select test" /></SelectTrigger>
                            <SelectContent className="bg-white text-black">
                                {['GMAT', 'GRE', 'Other'].map(test => <SelectItem key={`course-test-${test}`} value={test} className="hover:bg-gray-100">{test}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     {(courseTestType && courseTestType !== '' && courseTestType !== 'Other') && (
                        <div>
                            <Label htmlFor="courseTestScoreDirect" className="text-white">Your Score</Label>
                            <Input id="courseTestScoreDirect" value={courseTestScore} onChange={(e) => setCourseTestScore(e.target.value)} className="bg-white/80 text-black w-full" />
                        </div>
                    )}
                </div>
                {courseTestType === 'Other' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                        <div>
                            <Label htmlFor="courseTestOtherName" className="text-white">Specify Test Name</Label>
                            <Input id="courseTestOtherName" value={courseTestOtherName} onChange={(e) => setCourseTestOtherName(e.target.value)} className="bg-white/80 text-black w-full" />
                        </div>
                        <div>
                            <Label htmlFor="courseTestScoreOther" className="text-white">Your Score</Label>
                            <Input id="courseTestScoreOther" value={courseTestScore} onChange={(e) => setCourseTestScore(e.target.value)} className="bg-white/80 text-black w-full" />
                        </div>
                    </div>
                )}
            </div>
        )}
        {courseTestGiven === 'yet_to_appear' && (
            <div>
                <Label className="text-white">Expected Test Date</Label>
                {renderDateDropdowns(courseTestDay, setCourseTestDay, courseTestMonth, setCourseTestMonth, courseTestYear, setCourseTestYear, futureYearsTest)}
            </div>
        )}
      </div>
    )
  );

  const renderSaveButton = () => (
    isGraduationComplete() && isPostGraduationComplete() && isLanguageTestComplete() && isCourseTestComplete() && (
      <div className="mt-8 flex justify-center">
        <Button onClick={handleSaveAndContinue} size="lg" className="gradient-border-button">
          Save & Continue to Review
        </Button>
      </div>
    )
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
                <Button variant="default" size="sm" className="gradient-border-button">Get Started</Button>
              </Link>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
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
              
              {showGraduation && renderGraduationDetails()}
              {showPostGraduation && renderPostGraduationDetails()}
              {showLanguageTest && renderLanguageTestDetails()}
              {showCourseTest && renderCourseTestDetails()}
              {renderSaveButton()}

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
