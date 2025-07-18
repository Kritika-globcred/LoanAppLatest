
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { ArrowLeft, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { saveUserApplicationData } from '@/services/firebase-service';

const globalCountryList = [
  { value: 'US', label: 'United States' }, { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' }, { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' }, { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' }, { value: 'CN', label: 'China' },
];

const allCourseLevelOptions = ["Graduation", "Post-Graduation", "Masters", "PhD"];

interface AcademicGraduationData {
  level?: string | null;
}
interface AcademicKycDataForPrefs {
  graduation?: AcademicGraduationData;
}

const sampleCourses = [
  { value: "computer-science", label: "Computer Science" },
  { value: "data-science", label: "Data Science" },
  { value: "business-administration", label: "Business Administration (MBA)" },
  { value: "engineering-mechanical", label: "Mechanical Engineering" },
  { value: "engineering-electrical", label: "Electrical Engineering" },
  { value: "arts-humanities", label: "Arts & Humanities" },
  { value: "medicine", label: "Medicine" },
  { value: "law", label: "Law (LLM / JD)" },
  { value: "architecture", label: "Architecture" },
  { value: "project-management", label: "Project Management" },
];


export default function PreferencesPage() {
  // Navigation removed as per requirements
  const { toast } = useToast();
  const router = useRouter();
  const userId = getOrGenerateUserId();

  const [preferredCountry1, setPreferredCountry1] = useState<string | undefined>();
  const [preferredCountry2, setPreferredCountry2] = useState<string | undefined>();
  const [courseLevel, setCourseLevel] = useState<string | undefined>();
  const [selectedCourseName, setSelectedCourseName] = useState<string | undefined>(); 
  const [openCourseCombobox, setOpenCourseCombobox] = useState(false);
  
  const [courseLevelOptions, setCourseLevelOptions] = useState<string[]>(allCourseLevelOptions);
  const [defaultCourseLevel, setDefaultCourseLevel] = useState<string | undefined>("Graduation");

  const [avekaMessage, setAvekaMessage] = useState("Great! Since you're exploring options, let's gather some of your study preferences. This will help us tailor the best choices for you.");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const storedAcademicData = localStorage.getItem('academicKycData');
    if (storedAcademicData) {
      try {
        const parsedData = JSON.parse(storedAcademicData) as AcademicKycDataForPrefs;
        const gradLevel = parsedData.graduation?.level;

        if (gradLevel && (gradLevel === "Degree" || gradLevel === "Diploma" || gradLevel === "Pursuing")) {
          const filteredOptions = ["Post-Graduation", "Masters", "PhD"];
          setCourseLevelOptions(filteredOptions);
          const newDefault = "Post-Graduation";
          setDefaultCourseLevel(newDefault);
          setCourseLevel(newDefault); 
        } else { 
          setCourseLevelOptions(allCourseLevelOptions);
          const newDefault = "Graduation";
          setDefaultCourseLevel(newDefault);
          setCourseLevel(newDefault);
        }
      } catch (e) {
        console.error("Failed to parse academicKycData for preferences", e);
        setCourseLevelOptions(allCourseLevelOptions);
        const newDefault = "Graduation";
        setDefaultCourseLevel(newDefault);
        setCourseLevel(newDefault);
      }
    } else { 
      setCourseLevelOptions(allCourseLevelOptions);
      const newDefault = "Graduation";
      setDefaultCourseLevel(newDefault);
      setCourseLevel(newDefault);
    }
  }, []);

  const handleSaveAndContinue = async () => {
    if (!preferredCountry1 || !courseLevel || !selectedCourseName) {
      toast({
        title: "Missing Information",
        description: "Please select Preferred Country 1, Course Level, and Course Name.",
        variant: "destructive",
      });
      return;
    }
    if(!userId) {
        toast({title: "Error", description: "User session not found.", variant: "destructive"});
        return;
    }
    setIsSaving(true);

    const preferencesDataToSave = {
      preferredCountry1,
      preferredCountry2: preferredCountry2 || null, 
      courseLevel,
      courseName: selectedCourseName, 
    };
    
    const result = await saveUserApplicationData(userId, { preferences: preferencesDataToSave });
    setIsSaving(false);

    if(result.success) {
        toast({ title: "Preferences Saved!", description: "Proceeding to Recommendations." });
        router.push('/loan-application/recommendations');
    } else {
        toast({title: "Save Failed", description: result.error || "Could not save preferences.", variant: "destructive"});
    }
  };

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
            {/* Navigation removed as per requirements */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="default" size="sm">Login</Button>

            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={false} />
          <div className="flex items-center mb-6 mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/review-professional-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-lg mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex flex-col items-center md:flex-row md:items-start md:space-x-4 w-full">
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

                <div className="w-full space-y-6 text-left">
                  <div>
                    <Label htmlFor="preferredCountry1" className="text-white">Preferred Country 1 <span className="text-red-400">*</span></Label>
                    <Select value={preferredCountry1} onValueChange={setPreferredCountry1} disabled={isSaving}>
                      <SelectTrigger id="preferredCountry1" className="bg-white/80 text-black placeholder:text-gray-500">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        <SelectGroup>
                          <SelectLabel className="text-gray-700">Select a Country</SelectLabel>
                          {globalCountryList.map((country) => (
                            <SelectItem key={country.value} value={country.value} className="hover:bg-gray-100 text-black">
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferredCountry2" className="text-white">Preferred Country 2 (Optional)</Label>
                    <Select value={preferredCountry2} onValueChange={setPreferredCountry2} disabled={isSaving}>
                      <SelectTrigger id="preferredCountry2" className="bg-white/80 text-black placeholder:text-gray-500">
                        <SelectValue placeholder="Select country (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        <SelectGroup>
                          <SelectLabel className="text-gray-700">Select a Country</SelectLabel>
                          {globalCountryList.map((country) => (
                            <SelectItem key={`country2-${country.value}`} value={country.value} className="hover:bg-gray-100 text-black">
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="courseLevel" className="text-white">Course Level <span className="text-red-400">*</span></Label>
                    <Select value={courseLevel || defaultCourseLevel} onValueChange={setCourseLevel} disabled={isSaving}>
                      <SelectTrigger id="courseLevel" className="bg-white/80 text-black placeholder:text-gray-500">
                        <SelectValue placeholder="Select course level" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black">
                        <SelectGroup>
                          <SelectLabel className="text-gray-700">Select Level</SelectLabel>
                          {courseLevelOptions.map((level) => (
                            <SelectItem key={level} value={level} className="hover:bg-gray-100 text-black">
                              {level}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="courseName" className="text-white">Course <span className="text-red-400">*</span></Label>
                    <Popover open={openCourseCombobox} onOpenChange={setOpenCourseCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCourseCombobox}
                          className="w-full justify-between bg-white/80 text-black hover:bg-white/70 hover:text-black"
                          disabled={isSaving}
                        >
                          {selectedCourseName
                            ? sampleCourses.find((course) => course.value === selectedCourseName)?.label
                            : "Select course..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white">
                        <Command>
                          <CommandInput placeholder="Search course..." className="text-black" />
                          <CommandList>
                            <CommandEmpty>No course found.</CommandEmpty>
                            <CommandGroup>
                              {sampleCourses.map((course) => (
                                <CommandItem
                                  key={course.value}
                                  value={course.value}
                                  onSelect={(currentValue) => {
                                    setSelectedCourseName(currentValue === selectedCourseName ? undefined : currentValue);
                                    setOpenCourseCombobox(false);
                                  }}
                                  className="text-black hover:bg-gray-100 aria-selected:bg-gray-200"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedCourseName === course.value ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {course.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button onClick={handleSaveAndContinue} size="lg" className="gradient-border-button" disabled={isSaving}>
                      {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save & Continue'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
