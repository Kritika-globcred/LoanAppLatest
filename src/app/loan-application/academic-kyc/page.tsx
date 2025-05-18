
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const ASIAN_COUNTRY_CODES = ['IN', 'PK', 'CN', 'BD', 'LK'];
const currentYear = new Date().getFullYear();

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
  const [gradCompletionDate, setGradCompletionDate] = useState<Date | undefined>(undefined);
  const [gradCollegeName, setGradCollegeName] = useState('');
  const [gradUniversityName, setGradUniversityName] = useState('');
  const [gradPursuingCourse, setGradPursuingCourse] = useState('');
  const [gradPursuingType, setGradPursuingType] = useState<string | null>(null);
  const [gradExpectedCompletion, setGradExpectedCompletion] = useState<Date | undefined>(undefined);
  const [gradNaReason, setGradNaReason] = useState('');

  // Post-Graduation State
  const [postGradLevel, setPostGradLevel] = useState<string | null>(null);
  const [postGradCgpa, setPostGradCgpa] = useState('');
  const [postGradCgpaScale, setPostGradCgpaScale] = useState<string | null>(null);
  const [postGradCompletionDate, setPostGradCompletionDate] = useState<Date | undefined>(undefined);
  const [postGradCollegeName, setPostGradCollegeName] = useState('');
  const [postGradUniversityName, setPostGradUniversityName] = useState('');
  const [postGradPursuingCourse, setPostGradPursuingCourse] = useState('');
  const [postGradPursuingType, setPostGradPursuingType] = useState<string | null>(null);
  const [postGradExpectedCompletion, setPostGradExpectedCompletion] = useState<Date | undefined>(undefined);
  const [postGradNaReason, setPostGradNaReason] = useState('');

  // Language Test State
  const [languageTestGiven, setLanguageTestGiven] = useState<string | null>(null); // 'yes', 'no', 'yet_to_appear'
  const [languageTestType, setLanguageTestType] = useState<string | null>(null); // 'IELTS', 'TOEFL', 'PTE', 'Duolingo', 'Other'
  const [ieltsAbove65, setIeltsAbove65] = useState<string | null>(null); // 'yes', 'no'
  const [languageTestScore, setLanguageTestScore] = useState('');
  const [languageTestOtherName, setLanguageTestOtherName] = useState('');
  const [languageTestDate, setLanguageTestDate] = useState<Date | undefined>(undefined);

  // Course Test State
  const [courseTestGiven, setCourseTestGiven] = useState<string | null>(null); // 'yes', 'no', 'yet_to_appear'
  const [courseTestType, setCourseTestType] = useState<string | null>(null); // 'GMAT', 'GRE', 'Other'
  const [courseTestScore, setCourseTestScore] = useState('');
  const [courseTestOtherName, setCourseTestOtherName] = useState('');
  const [courseTestDate, setCourseTestDate] = useState<Date | undefined>(undefined);

  // Section Visibility
  const [showPostGradSection, setShowPostGradSection] = useState(false);
  const [showLanguageTestSection, setShowLanguageTestSection] = useState(false);
  const [showCourseTestSection, setShowCourseTestSection] = useState(false);
  const [showSummarySection, setShowSummarySection] = useState(false);

  // Consent
  const [academicConsentChecked, setAcademicConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    const countryVal = localStorage.getItem('selectedCountryValue');
    if (countryVal) {
      const code = countryVal.split('_')[1];
      setUserCountryCode(code || null);
      setIsAsianCountry(ASIAN_COUNTRY_CODES.includes(code || ''));
    }
    setCurrentTime(new Date().toLocaleString());
    const timerId = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (gradLevel && !showPostGradSection) {
      setAvekaMessage("Great! Now, please tell me about your post-graduation, if any.");
      setShowPostGradSection(true);
    }
  }, [gradLevel, showPostGradSection]);

  useEffect(() => {
    if (showPostGradSection && postGradLevel && !showLanguageTestSection) {
      setAvekaMessage("Thanks! Let's move on to language proficiency tests.");
      setShowLanguageTestSection(true);
    }
  }, [postGradLevel, showPostGradSection, showLanguageTestSection]);

  useEffect(() => {
    if (showLanguageTestSection && languageTestGiven && !showCourseTestSection) {
      setAvekaMessage("Almost there! Lastly, any specific course tests like GMAT or GRE?");
      setShowCourseTestSection(true);
    }
  }, [languageTestGiven, showLanguageTestSection, showCourseTestSection]);

  useEffect(() => {
    if (showCourseTestSection && courseTestGiven && !showSummarySection) {
      setAvekaMessage("Fantastic! Please review your academic details and provide consent.");
      setShowSummarySection(true);
    }
  }, [courseTestGiven, showCourseTestSection, showSummarySection]);

  const handleSaveAndContinue = () => {
    if (!academicConsentChecked) {
      toast({ title: "Consent Required", description: "Please confirm your details before proceeding.", variant: "destructive" });
      return;
    }
    // Process and save data
    const academicData = {
      graduation: { level: gradLevel, cgpa: gradCgpa, scale: gradCgpaScale, completionDate: gradCompletionDate, college: gradCollegeName, university: gradUniversityName, pursuingCourse: gradPursuingCourse, pursuingType: gradPursuingType, expectedCompletion: gradExpectedCompletion, naReason: gradNaReason },
      postGraduation: { level: postGradLevel, cgpa: postGradCgpa, scale: postGradCgpaScale, completionDate: postGradCompletionDate, college: postGradCollegeName, university: postGradUniversityName, pursuingCourse: postGradPursuingCourse, pursuingType: postGradPursuingType, expectedCompletion: postGradExpectedCompletion, naReason: postGradNaReason },
      languageTest: { given: languageTestGiven, type: languageTestType, ieltsScoreAbove65: ieltsAbove65, score: languageTestScore, otherName: languageTestOtherName, date: languageTestDate },
      courseTest: { given: courseTestGiven, type: courseTestType, score: courseTestScore, otherName: courseTestOtherName, date: courseTestDate },
      consentTime: currentTime,
    };
    console.log("Academic KYC Data:", academicData);
    toast({ title: "Academic Details Saved!", description: "Proceeding to the next step." });
    // router.push('/loan-application/financials'); // Example next step
  };

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
            <div><Label htmlFor="gradCollegeName" className="text-white">College Name</Label><Input id="gradCollegeName" value={gradCollegeName} onChange={(e) => setGradCollegeName(e.target.value)} className="bg-white/80 text-black" /></div>
            <div><Label htmlFor="gradUniversityName" className="text-white">University Name</Label><Input id="gradUniversityName" value={gradUniversityName} onChange={(e) => setGradUniversityName(e.target.value)} className="bg-white/80 text-black" /></div>
            <div><Label htmlFor="gradCgpa" className="text-white">CGPA/Percentage</Label><Input id="gradCgpa" type="number" value={gradCgpa} onChange={(e) => setGradCgpa(e.target.value)} className="bg-white/80 text-black" /></div>
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
                <Calendar mode="single" selected={gradCompletionDate} onSelect={setGradCompletionDate} captionLayout="dropdown" fromYear={currentYear - 70} toYear={currentYear} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
      { gradLevel === "Pursuing" && (
         <>
          <div><Label htmlFor="gradPursuingCourse" className="text-white">Course Name</Label><Input id="gradPursuingCourse" value={gradPursuingCourse} onChange={(e) => setGradPursuingCourse(e.target.value)} className="bg-white/80 text-black" /></div>
          <div><Label htmlFor="gradCollegeNamePursuing" className="text-white">College Name</Label><Input id="gradCollegeNamePursuing" value={gradCollegeName} onChange={(e) => setGradCollegeName(e.target.value)} className="bg-white/80 text-black" /></div>
          <div><Label htmlFor="gradUniversityNamePursuing" className="text-white">University Name</Label><Input id="gradUniversityNamePursuing" value={gradUniversityName} onChange={(e) => setGradUniversityName(e.target.value)} className="bg-white/80 text-black" /></div>
          <div>
            <Label className="text-white">Degree/Diploma</Label>
            <RadioGroup value={gradPursuingType || ''} onValueChange={setGradPursuingType} className="flex space-x-4 text-white">
              {["Degree", "Diploma"].map(type => (<div key={`grad-pursuing-${type}`} className="flex items-center space-x-2"><RadioGroupItem value={type} id={`grad-pursuing-${type}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor={`grad-pursuing-${type}`}>{type}</Label></div>))}
            </RadioGroup>
          </div>
           <div>
            <Label htmlFor="gradExpectedCompletion" className="text-white">Expected Month & Year of Completion</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 text-black hover:text-black"><CalendarIcon className="mr-2 h-4 w-4" />{gradExpectedCompletion ? format(gradExpectedCompletion, "PPP") : <span>Pick a date</span>}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar mode="single" selected={gradExpectedCompletion} onSelect={setGradExpectedCompletion} captionLayout="dropdown" fromYear={currentYear - 5} toYear={currentYear + 10} initialFocus />
                </PopoverContent>
            </Popover>
          </div>
        </>
      )}
      { gradLevel === "Not applicable" && (<div><Label htmlFor="gradNaReason" className="text-white">Please explain reason</Label><Textarea id="gradNaReason" value={gradNaReason} onChange={(e) => setGradNaReason(e.target.value)} className="bg-white/80 text-black" /></div>)}
    </div>
  );

  const renderPostGraduationDetails = () => (
    showPostGradSection && (
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
              <div><Label htmlFor="postGradCollegeName" className="text-white">College Name</Label><Input id="postGradCollegeName" value={postGradCollegeName} onChange={(e) => setPostGradCollegeName(e.target.value)} className="bg-white/80 text-black" /></div>
              <div><Label htmlFor="postGradUniversityName" className="text-white">University Name</Label><Input id="postGradUniversityName" value={postGradUniversityName} onChange={(e) => setPostGradUniversityName(e.target.value)} className="bg-white/80 text-black" /></div>
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
              <Label htmlFor="postGradCompletionDate" className="text-white">Month & Year of Completion</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 text-black hover:text-black"><CalendarIcon className="mr-2 h-4 w-4" />{postGradCompletionDate ? format(postGradCompletionDate, "PPP") : <span>Pick a date</span>}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar mode="single" selected={postGradCompletionDate} onSelect={setPostGradCompletionDate} captionLayout="dropdown" fromYear={currentYear - 70} toYear={currentYear} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
        { postGradLevel === "Pursuing" && (
           <>
            <div><Label htmlFor="postGradPursuingCourse" className="text-white">Course Name</Label><Input id="postGradPursuingCourse" value={postGradPursuingCourse} onChange={(e) => setPostGradPursuingCourse(e.target.value)} className="bg-white/80 text-black" /></div>
            <div><Label htmlFor="postGradCollegeNamePursuing" className="text-white">College Name</Label><Input id="postGradCollegeNamePursuing" value={postGradCollegeName} onChange={(e) => setPostGradCollegeName(e.target.value)} className="bg-white/80 text-black" /></div>
            <div><Label htmlFor="postGradUniversityNamePursuing" className="text-white">University Name</Label><Input id="postGradUniversityNamePursuing" value={postGradUniversityName} onChange={(e) => setPostGradUniversityName(e.target.value)} className="bg-white/80 text-black" /></div>
            <div>
              <Label className="text-white">Degree/Diploma</Label>
              <RadioGroup value={postGradPursuingType || ''} onValueChange={setPostGradPursuingType} className="flex space-x-4 text-white">
                {["Degree", "Diploma"].map(type => (<div key={`postgrad-pursuing-${type}`} className="flex items-center space-x-2"><RadioGroupItem value={type} id={`postgrad-pursuing-${type}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor={`postgrad-pursuing-${type}`}>{type}</Label></div>))}
              </RadioGroup>
            </div>
             <div>
              <Label htmlFor="postGradExpectedCompletion" className="text-white">Expected Month & Year of Completion</Label>
              <Popover>
                  <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 text-black hover:text-black"><CalendarIcon className="mr-2 h-4 w-4" />{postGradExpectedCompletion ? format(postGradExpectedCompletion, "PPP") : <span>Pick a date</span>}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar mode="single" selected={postGradExpectedCompletion} onSelect={setPostGradExpectedCompletion} captionLayout="dropdown" fromYear={currentYear - 5} toYear={currentYear + 10} initialFocus />
                  </PopoverContent>
              </Popover>
            </div>
          </>
        )}
        { postGradLevel === "Not applicable" && (<div><Label htmlFor="postGradNaReason" className="text-white">Please explain reason</Label><Textarea id="postGradNaReason" value={postGradNaReason} onChange={(e) => setPostGradNaReason(e.target.value)} className="bg-white/80 text-black" /></div>)}
      </div>
    )
  );
  
  const renderLanguageTestDetails = () => (
    showLanguageTestSection && (
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
            {isAsianCountry ? (
              <>
                <Label className="text-white">Which test have you appeared for?</Label>
                <RadioGroup value={languageTestType || ''} onValueChange={setLanguageTestType} className="flex space-x-4 text-white">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="IELTS" id="lang-ielts" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="lang-ielts">IELTS</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Other" id="lang-other-asian" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="lang-other-asian">Other</Label></div>
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
                  <div className="space-y-2">
                    <Label htmlFor="languageTestOtherNameAsian" className="text-white">Specify Test Name</Label>
                    <Input id="languageTestOtherNameAsian" value={languageTestOtherName} onChange={(e) => setLanguageTestOtherName(e.target.value)} className="bg-white/80 text-black" />
                    <Label htmlFor="languageTestScoreAsian" className="text-white">Your Score</Label>
                    <Input id="languageTestScoreAsian" value={languageTestScore} onChange={(e) => setLanguageTestScore(e.target.value)} className="bg-white/80 text-black" />
                  </div>
                )}
              </>
            ) : ( // Not Asian country
              <>
                <Label className="text-white">Which test have you appeared for?</Label>
                <Select value={languageTestType || ''} onValueChange={setLanguageTestType}>
                  <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Select test" /></SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {['TOEFL', 'PTE', 'Duolingo', 'Other'].map(test => <SelectItem key={test} value={test} className="hover:bg-gray-100">{test}</SelectItem>)}
                  </SelectContent>
                </Select>
                {languageTestType === 'Other' && (<div><Label htmlFor="languageTestOtherNameNonAsian" className="text-white">Specify Test Name</Label><Input id="languageTestOtherNameNonAsian" value={languageTestOtherName} onChange={(e) => setLanguageTestOtherName(e.target.value)} className="bg-white/80 text-black" /></div>)}
                <div><Label htmlFor="languageTestScoreNonAsian" className="text-white">Your Score</Label><Input id="languageTestScoreNonAsian" value={languageTestScore} onChange={(e) => setLanguageTestScore(e.target.value)} className="bg-white/80 text-black" /></div>
              </>
            )}
          </div>
        )}
        {languageTestGiven === 'yet_to_appear' && (
          <div>
            <Label htmlFor="languageTestDate" className="text-white">Expected Test Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 text-black hover:text-black"><CalendarIcon className="mr-2 h-4 w-4" />{languageTestDate ? format(languageTestDate, "PPP") : <span>Pick a date</span>}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar mode="single" selected={languageTestDate} onSelect={setLanguageTestDate} captionLayout="dropdown" fromYear={currentYear} toYear={currentYear + 2} initialFocus />
                </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    )
  );
  
  const renderCourseTestDetails = () => (
    showCourseTestSection && (
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
                <Label className="text-white">Which test have you appeared for?</Label>
                <Select value={courseTestType || ''} onValueChange={setCourseTestType}>
                    <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Select test" /></SelectTrigger>
                    <SelectContent className="bg-white text-black">
                        {['GMAT', 'GRE', 'Other'].map(test => <SelectItem key={test} value={test} className="hover:bg-gray-100">{test}</SelectItem>)}
                    </SelectContent>
                </Select>
                {courseTestType === 'Other' && (<div><Label htmlFor="courseTestOtherName" className="text-white">Specify Test Name</Label><Input id="courseTestOtherName" value={courseTestOtherName} onChange={(e) => setCourseTestOtherName(e.target.value)} className="bg-white/80 text-black" /></div>)}
                <div><Label htmlFor="courseTestScore" className="text-white">Your Score</Label><Input id="courseTestScore" value={courseTestScore} onChange={(e) => setCourseTestScore(e.target.value)} className="bg-white/80 text-black" /></div>
            </div>
        )}
        {courseTestGiven === 'yet_to_appear' && (
            <div>
                <Label htmlFor="courseTestDate" className="text-white">Expected Test Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 text-black hover:text-black"><CalendarIcon className="mr-2 h-4 w-4" />{courseTestDate ? format(courseTestDate, "PPP") : <span>Pick a date</span>}</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar mode="single" selected={courseTestDate} onSelect={setCourseTestDate} captionLayout="dropdown" fromYear={currentYear} toYear={currentYear + 2} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
        )}
      </div>
    )
  );

  const renderSummaryAndConsent = () => (
     showSummarySection && (
     <div className="mt-8 space-y-6 border-t border-gray-500/50 pt-6">
        <h3 className="font-semibold text-lg text-center text-white">Summary & Consent</h3>
        <div className="text-sm text-gray-300 text-center bg-gray-800/30 p-4 rounded-md">
            <p className="font-semibold mb-2">Academic Details Summary:</p>
            <p>Graduation Level: {gradLevel || 'Not Specified'}</p>
            { (gradLevel === "Degree" || gradLevel === "Diploma") && <p>Grad CGPA: {gradCgpa || 'N/A'} {gradCgpaScale ? `(Scale ${gradCgpaScale})` : ''}</p>}
            <p>Post-Graduation Level: {postGradLevel || 'Not Specified'}</p>
            { (postGradLevel === "Degree" || postGradLevel === "Diploma") && <p>Post-Grad CGPA: {postGradCgpa || 'N/A'} {postGradCgpaScale ? `(Scale ${postGradCgpaScale})` : ''}</p>}
            <p>Language Test Given: {languageTestGiven || 'Not Specified'}</p>
            <p>Course Test Given: {courseTestGiven || 'Not Specified'}</p>
            <p className="mt-2 italic text-xs">(Note: CGPA to percentage conversion will be done based on university guidelines if applicable.)</p>
        </div>
        <div className="flex items-center space-x-2 justify-center">
            <Checkbox id="academicConsent" checked={academicConsentChecked} onCheckedChange={(checked) => setAcademicConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
            <Label htmlFor="academicConsent" className="text-sm font-medium text-white">
            I confirm that all academic details provided are correct and accurate to the best of my knowledge.
            </Label>
        </div>
        <p className="text-xs text-gray-400 text-center">Consent captured at: {currentTime}</p>
        <div className="flex justify-center">
            <Button onClick={handleSaveAndContinue} disabled={!academicConsentChecked} size="lg" className="gradient-border-button">
            Save & Continue
            </Button>
        </div>
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

    