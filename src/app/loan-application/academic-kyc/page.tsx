
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PercentageSlider } from "@/components/ui/percentage-slider";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
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
  const [gradPercentage, setGradPercentage] = useState('0');
  const [gradCompletionDate, setGradCompletionDate] = useState<Date | undefined>();
  const [gradPursuingCourse, setGradPursuingCourse] = useState('');
  const [gradPursuingType, setGradPursuingType] = useState<string | null>(null);
  const [gradExpectedCompletionMonth, setGradExpectedCompletionMonth] = useState<string | undefined>();
  const [gradExpectedCompletionYear, setGradExpectedCompletionYear] = useState<string | undefined>();
  const [gradNaReason, setGradNaReason] = useState('');

  // Post-Graduation State
  const [postGradLevel, setPostGradLevel] = useState<string | null>(null);
  const [postGradPercentage, setPostGradPercentage] = useState('0');
  const [postGradCompletionDate, setPostGradCompletionDate] = useState<Date | undefined>();
  const [postGradPursuingCourse, setPostGradPursuingCourse] = useState('');
  const [postGradPursuingType, setPostGradPursuingType] = useState<string | null>(null);
  const [postGradExpectedCompletionMonth, setPostGradExpectedCompletionMonth] = useState<string | undefined>();
  const [postGradExpectedCompletionYear, setPostGradExpectedCompletionYear] = useState<string | undefined>();
  const [postGradNaReason, setPostGradNaReason] = useState('');

  // Language Test State
  const [languageTestGiven, setLanguageTestGiven] = useState<string | null>(null);
  const [languageTestType, setLanguageTestType] = useState<string | null>(null); 
  const [languageTestOtherName, setLanguageTestOtherName] = useState(''); 
  const [languageTestScore, setLanguageTestScore] = useState('');
  const [languageTestDate, setLanguageTestDate] = useState<Date | undefined>();
  const [ieltsAbove65, setIeltsAbove65] = useState<string | null>(null);
  const [pteAbove585, setPteAbove585] = useState<string | null>(null);
  const [skipLanguageTest, setSkipLanguageTest] = useState(false);


  // Course Test State
  const [courseTestGiven, setCourseTestGiven] = useState<string | null>(null);
  const [courseTestType, setCourseTestType] = useState<string | null>(null); 
  const [courseTestOtherName, setCourseTestOtherName] = useState(''); 
  const [courseTestScore, setCourseTestScore] = useState('');
  const [courseTestDate, setCourseTestDate] = useState<Date | undefined>();

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

      // determine if user is from English-speaking country (skip language test)
      const ENGLISH_SPEAKING_CODES = ['+1', '+44', 'US', 'USA', 'UNITED STATES', 'UK', 'UNITED KINGDOM'];
      if (ENGLISH_SPEAKING_CODES.includes((code || '').toUpperCase())) {
        setSkipLanguageTest(true);
        setShowLanguageTest(false);
        setLanguageTestGiven('No');
      } else {
        setSkipLanguageTest(false);
      }
    }
    return () => clearTimeout(timer);
  }, []);

  const isGraduationComplete = () => {
    if (!gradLevel) return false;
    if (gradLevel === "Degree" || gradLevel === "Diploma") {
      return gradPercentage && gradCompletionDate;
    }
    if (gradLevel === "Pursuing") {
      return gradPursuingCourse && gradPursuingType && gradExpectedCompletionMonth && gradExpectedCompletionYear;
    }
    if (gradLevel === "In Senior Secondary School") {
      return gradNaReason.trim() !== '';
    }
    return false;
  };

  const isPostGraduationComplete = () => {
    if (!postGradLevel) return false;
    if (postGradLevel === "Degree" || postGradLevel === "Diploma") {
      return postGradPercentage && postGradCompletionDate;
    }
    if (postGradLevel === "Pursuing") {
      return postGradPursuingCourse && postGradPursuingType && postGradExpectedCompletionMonth && postGradExpectedCompletionYear;
    }
    return true;
  };
  
  const isLanguageTestComplete = () => {
    if (skipLanguageTest) return true;
    if (!languageTestGiven) return false;
    if (languageTestGiven === 'no') return true;
    if (languageTestGiven === 'yet_to_appear') {
      return languageTestDate;
    }
    if (languageTestGiven === 'yes') {
      if (isAsianCountry) { 
        if (languageTestType === 'IELTS') return ieltsAbove65 !== null;
        if (languageTestType === 'PTE') return pteAbove585 !== null;
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
      return courseTestDate;
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
  }, [gradLevel, gradPercentage, gradCompletionDate, gradPursuingCourse, gradPursuingType, gradExpectedCompletionMonth, gradExpectedCompletionYear, gradNaReason, showPostGraduation, isGraduationComplete]);

  useEffect(() => {
    if (showPostGraduation && isPostGraduationComplete() && !showLanguageTest && !showCourseTest) {
      if (skipLanguageTest) {
        setAvekaMessage("Since you don't need a language proficiency test, let's move on to course exams like GRE or GMAT.");
        setShowCourseTest(true);
      } else {
        setAvekaMessage("Thanks! Let's move on to language proficiency tests. Have you appeared for any?");
        setShowLanguageTest(true);
      }
    }
  }, [postGradLevel, postGradPercentage, postGradCompletionDate, postGradPursuingCourse, postGradPursuingType, postGradExpectedCompletionMonth, postGradExpectedCompletionYear, postGradNaReason, showPostGraduation, showLanguageTest, showCourseTest, skipLanguageTest, isPostGraduationComplete]);

  useEffect(() => {
    if (showLanguageTest && isLanguageTestComplete() && !showCourseTest) {
      setAvekaMessage("Almost there! Lastly, any specific course tests like GMAT or GRE?");
      setShowCourseTest(true);
    }
  }, [languageTestGiven, languageTestType, ieltsAbove65, languageTestOtherName, languageTestScore, languageTestDate, isAsianCountry, showLanguageTest, showCourseTest, isLanguageTestComplete]);
  
  useEffect(() => {
    if (showCourseTest && isCourseTestComplete()) {
      setAvekaMessage("Fantastic! You've completed the academic details. Please click 'Save & Continue' to proceed to the review page.");
    }
  }, [courseTestGiven, courseTestType, courseTestOtherName, courseTestScore, courseTestDate, showCourseTest, isCourseTestComplete]);


  const constructDateString = (year?: string, month?: string, day?: string): string | undefined => {
    if (year && month && day) {
      const formattedMonth = month.padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    }
    return undefined;
  };

  const handleSaveAndContinue = () => {

    const academicData = {
      graduation: { 
        level: gradLevel, 
        percentage: gradPercentage, 
        completionDate: gradCompletionDate ? format(gradCompletionDate, 'yyyy-MM-dd') : undefined,
        pursuingCourse: gradPursuingCourse, 
        pursuingType: gradPursuingType, 
        expectedCompletion: gradExpectedCompletionMonth && gradExpectedCompletionYear ? `${gradExpectedCompletionYear}-${gradExpectedCompletionMonth}` : undefined,
        naReason: gradNaReason 
      },
      postGraduation: { 
        level: postGradLevel, 
        percentage: postGradPercentage, 
        completionDate: postGradCompletionDate ? format(postGradCompletionDate, 'yyyy-MM-dd') : undefined, 
        pursuingCourse: postGradPursuingCourse, 
        pursuingType: postGradPursuingType, 
        expectedCompletion: postGradExpectedCompletionMonth && postGradExpectedCompletionYear ? `${postGradExpectedCompletionYear}-${postGradExpectedCompletionMonth}` : undefined,
        naReason: postGradNaReason 
      },
      languageTest: { 
        given: languageTestGiven, 
        type: languageTestType, 
        ieltsScore: ieltsAbove65, 
        otherName: languageTestOtherName, 
        score: languageTestScore, 
        date: languageTestDate ? format(languageTestDate, 'yyyy-MM-dd') : undefined
      },
      courseTest: { 
        given: courseTestGiven, 
        type: courseTestType, 
        otherName: courseTestOtherName, 
        score: courseTestScore, 
        date: courseTestDate ? format(courseTestDate, 'yyyy-MM-dd') : undefined
      },
    };
    
    localStorage.setItem('academicKycData', JSON.stringify(academicData));
    toast({ title: "Academic Details Saved!", description: "Proceeding to review your academic details." });
    router.push('/loan-application/review-academic-kyc');
  };

  const renderDateField = (
    label: string,
    value: Date | undefined,
    onChange: (date: Date | undefined) => void
  ) => {
    const isMonthYearPicker =
      label === "Expected Completion Date" || label.includes("Month & Year");

    const handleDateChange = (date: Date | undefined) => {
      if (isMonthYearPicker && date) {
        const adjustedDate = new Date(date);
        adjustedDate.setDate(1);
        onChange(adjustedDate);
      } else {
        onChange(date);
      }
    };

    return (
      <div className="w-full">
        <Label className="text-white">{label}</Label>
        <DatePicker
          value={value}
          onChange={handleDateChange}
          placeholder="Select date"
          fromYear={1950}
          toYear={new Date().getFullYear() + 10}
          maxDate={isMonthYearPicker ? undefined : new Date()}
          pickerMode={isMonthYearPicker ? "monthYear" : "date"}
        />
      </div>
    );
  };

  const isFormComplete = () => {
    // Check if graduation details are complete if shown
    if (showGraduation && !isGraduationComplete()) {
      return false;
    }
    
    // Check if post-graduation details are complete if shown
    if (showPostGraduation && !isPostGraduationComplete()) {
      return false;
    }
    
    // Check if language test details are complete if shown
    if (languageTestGiven === 'Yes' && !isLanguageTestComplete()) {
      return false;
    }
    
    // Check if course test details are complete if shown
    if (courseTestGiven === 'Yes' && !isCourseTestComplete()) {
      return false;
    }
    
    return true;
  };

  const renderSaveButton = () => (
    <div className="mt-8 flex justify-end">
      <Button
        onClick={handleSaveAndContinue}
        disabled={!isFormComplete()}
        variant="default" className="px-8 py-6 text-lg"
      >
        Save & Continue
      </Button>
    </div>
  );

  const renderGraduationDetails = () => (
    <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
      <h3 className="font-semibold text-lg text-center text-white">Under Graduation (UG) Details</h3>
      <div className="space-y-2">
        <Label className="text-white">Which level of graduation have you completed?</Label>
        <RadioGroup value={gradLevel || ''} onValueChange={setGradLevel} className="flex flex-wrap gap-x-4 gap-y-2 text-white">
          {["Degree", "Diploma", "Pursuing", "In Senior Secondary School"].map(level => (
            <div key={`grad-${level}`} className="flex items-center space-x-2">
              <RadioGroupItem value={level} id={`grad-${level}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
              <Label htmlFor={`grad-${level}`}>{level}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      { (gradLevel === "Degree" || gradLevel === "Diploma") && (
        <>
          <div className="w-full">
          <Label className="text-white">Percentage</Label>
          <PercentageSlider
            value={gradPercentage}
            onChange={setGradPercentage}
            min={0}
            max={100}
            step={0.1}
            className="mt-4"
          />
        </div>
          <div>
            {renderDateField("Month & Year of Completion", gradCompletionDate, setGradCompletionDate)}
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
             {renderDateField(
               "Expected Completion Date",
               gradExpectedCompletionMonth && gradExpectedCompletionYear
                 ? new Date(parseInt(gradExpectedCompletionYear), parseInt(gradExpectedCompletionMonth) - 1, 1)
                 : undefined,
               (date) => {
                 if (date) {
                   setGradExpectedCompletionMonth(String(date.getMonth() + 1));
                   setGradExpectedCompletionYear(String(date.getFullYear()));
                 } else {
                   setGradExpectedCompletionMonth(undefined);
                   setGradExpectedCompletionYear(undefined);
                 }
               }
             )}
           </div>
        </>
      )}
      { gradLevel === "In Senior Secondary School" && (<div><Label htmlFor="gradNaReason" className="text-white">Please explain reason</Label><Textarea id="gradNaReason" value={gradNaReason} onChange={(e) => setGradNaReason(e.target.value)} className="bg-white/80 text-black" /></div>)}
    </div>
  );

  const renderLanguageTestDetails = () => (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-lg mt-6 space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">Language Test Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-white">Have you taken any language proficiency tests?</Label>
          <div className="flex space-x-4 mt-2">
            <Button
              variant={languageTestGiven === 'Yes' ? 'default' : 'outline'}
              onClick={() => {
                setLanguageTestGiven('Yes');
                setShowLanguageTest(true);
              }}
              className={`${languageTestGiven === 'Yes' ? 'bg-primary' : 'bg-transparent border-white/50 text-white hover:bg-white/10'}`}
            >
              Yes
            </Button>
            <Button
              variant={languageTestGiven === 'No' ? 'default' : 'outline'}
              onClick={() => {
                setLanguageTestGiven('No');
                setShowLanguageTest(false);
                setShowCourseTest(true);
                setAvekaMessage('Great, let\'s proceed to course exams like GRE or GMAT.');
              }}
              className={`${languageTestGiven === 'No' ? 'bg-primary' : 'bg-transparent border-white/50 text-white hover:bg-white/10'}`}
            >
              No
            </Button>
          </div>
        </div>

        {languageTestGiven === 'Yes' && (
          <>
            <div>
              <Label className="text-white">Test Type</Label>
              <Select
                value={languageTestType || ''}
                onValueChange={(value) => {
                  setLanguageTestType(value);
                  if (value !== 'Other') {
                    setLanguageTestOtherName('');
                  }
                }}
              >
                <SelectTrigger className="bg-white/80 text-black">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IELTS">IELTS</SelectItem>
                  <SelectItem value="TOEFL">TOEFL</SelectItem>
                  <SelectItem value="PTE">PTE</SelectItem>
                  <SelectItem value="Duolingo">Duolingo</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {languageTestType === 'Other' && (
                <Input
                  value={languageTestOtherName}
                  onChange={(e) => setLanguageTestOtherName(e.target.value)}
                  placeholder="Please specify test name"
                  className="mt-2 bg-white/80 text-black"
                />
              )}
            </div>

            <div>
              <Label className="text-white">Test Score</Label>

              {languageTestType === 'IELTS' && (
                <div className="mt-2 space-x-4">
                  <span className="text-white mr-2">Band ≥ 6.5 ?</span>
                  <Button
                    variant={ieltsAbove65 === 'yes' ? 'default' : 'outline'}
                    onClick={() => setIeltsAbove65('yes')}
                    className={`${ieltsAbove65 === 'yes' ? 'bg-primary' : 'bg-transparent border-white/50 text-white hover:bg-white/10'}`}
                  >Yes</Button>
                  <Button
                    variant={ieltsAbove65 === 'no' ? 'default' : 'outline'}
                    onClick={() => setIeltsAbove65('no')}
                    className={`${ieltsAbove65 === 'no' ? 'bg-primary' : 'bg-transparent border-white/50 text-white hover:bg-white/10'}`}
                  >No</Button>
                </div>
              )}

              {languageTestType === 'PTE' && (
                <div className="mt-2 space-x-4">
                  <span className="text-white mr-2">Score ≥ 58.5 ?</span>
                  <Button
                    variant={pteAbove585 === 'yes' ? 'default' : 'outline'}
                    onClick={() => setPteAbove585('yes')}
                    className={`${pteAbove585 === 'yes' ? 'bg-primary' : 'bg-transparent border-white/50 text-white hover:bg-white/10'}`}
                  >Yes</Button>
                  <Button
                    variant={pteAbove585 === 'no' ? 'default' : 'outline'}
                    onClick={() => setPteAbove585('no')}
                    className={`${pteAbove585 === 'no' ? 'bg-primary' : 'bg-transparent border-white/50 text-white hover:bg-white/10'}`}
                  >No</Button>
                </div>
              )}

              {languageTestType && !['IELTS', 'PTE'].includes(languageTestType) && (
                <Input
                  value={languageTestScore}
                  onChange={(e) => setLanguageTestScore(e.target.value)}
                  placeholder="Enter your score"
                  className="bg-white/80 text-black mt-2"
                />
              )}
            </div>

            <div>
              {renderDateField("Test Date", languageTestDate, setLanguageTestDate)}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderCourseTestDetails = () => (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-lg mt-6 space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">Course Test Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-white">Have you taken any course-related tests?</Label>
          <div className="flex space-x-4 mt-2">
            <Button
              variant={courseTestGiven === 'Yes' ? 'default' : 'outline'}
              onClick={() => {
                setCourseTestGiven('Yes');
                setShowCourseTest(true);
              }}
              className={`${courseTestGiven === 'Yes' ? 'bg-primary' : 'bg-transparent border-white/50 text-white hover:bg-white/10'}`}
            >
              Yes
            </Button>
            <Button
              variant={courseTestGiven === 'No' ? 'default' : 'outline'}
              onClick={() => {
                setCourseTestGiven('No');
                // keep section visible so user can review
                 //setShowCourseTest(false);
              }}
              className={`${courseTestGiven === 'No' ? 'bg-primary' : 'bg-transparent border-white/50 text-white hover:bg-white/10'}`}
            >
              No
            </Button>
          </div>
        </div>

        {courseTestGiven === 'Yes' && (
          <>
            <div>
              <Label className="text-white">Test Type</Label>
              <Select
                value={courseTestType || ''}
                onValueChange={(value) => {
                  setCourseTestType(value);
                  if (value !== 'Other') {
                    setCourseTestOtherName('');
                  }
                }}
              >
                <SelectTrigger className="bg-white/80 text-black">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRE">GRE</SelectItem>
                  <SelectItem value="GMAT">GMAT</SelectItem>
                  <SelectItem value="SAT">SAT</SelectItem>
                  <SelectItem value="ACT">ACT</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {courseTestType === 'Other' && (
                <Input
                  value={courseTestOtherName}
                  onChange={(e) => setCourseTestOtherName(e.target.value)}
                  placeholder="Please specify test name"
                  className="mt-2 bg-white/80 text-black"
                />
              )}
            </div>

            <div>
              <Label htmlFor="courseTestScore" className="text-white">Test Score</Label>
              <Input
                id="courseTestScore"
                value={courseTestScore}
                onChange={(e) => setCourseTestScore(e.target.value)}
                placeholder="Enter your score"
                className="bg-white/80 text-black"
              />
            </div>
            <div>
              {renderDateField("Test Date", courseTestDate, setCourseTestDate)}
            </div>
          </>
        )}
      </div>
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
            <div className="w-full">
              <Label className="text-white">Percentage</Label>
              <PercentageSlider
                value={postGradPercentage}
                onChange={setPostGradPercentage}
                min={0}
                max={100}
                step={0.1}
                className="mt-4"
              />
            </div>
            <div>
              {renderDateField("Month & Year of Completion", postGradCompletionDate, setPostGradCompletionDate)}
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
              <div className="grid grid-cols-1 gap-4 items-end">
                {renderDateField(
                  "Expected Completion Date",
                  postGradExpectedCompletionYear && postGradExpectedCompletionMonth 
                    ? new Date(parseInt(postGradExpectedCompletionYear), parseInt(postGradExpectedCompletionMonth) - 1, 1)
                    : undefined,
                  (date) => {
                    if (date) {
                      const year = date.getFullYear().toString();
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      setPostGradExpectedCompletionYear(year);
                      setPostGradExpectedCompletionMonth(month);
                    } else {
                      setPostGradExpectedCompletionYear(undefined);
                      setPostGradExpectedCompletionMonth(undefined);
                    }
                  }
                )}
              </div>
            </div>
          </>
        )}
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
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="default" size="sm">Login</Button>
              <Link href="/loan-application/mobile" passHref>
                <Button variant="outline" size="sm" className="text-white border-white/50 hover:bg-white/10">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
          
          <div className="flex items-center mb-6 mt-4"> 
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/loan-application/review-personal-kyc')} 
              className="bg-white/20 hover:bg-white/30 text-white"
            >
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
            {renderLanguageTestDetails()}
            {showCourseTest && renderCourseTestDetails()}
            {renderSaveButton()}
          </div>
        </div>
      </div>
    </section>
  </div>
  );
}
