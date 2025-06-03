
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UploadCloud, Camera, Edit3, Save, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { extractProfessionalProfileDetails, type ExtractProfessionalProfileInput, type ExtractProfessionalProfileOutput } from '@/ai/flows/extract-professional-profile-flow';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { saveUserApplicationData, uploadFileToStorage } from '@/services/firebase-service';

const yearOptions = Array.from({ length: 26 }, (_, i) => String(i));
const monthOptions = Array.from({ length: 12 }, (_, i) => String(i));
const currencyOptions = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CNY", "Other"];

const industryOptions = [
  "Information Technology",
  "Banking & Financial Services",
  "Consulting",
  "Engineering",
  "Healthcare",
  "Pharmaceuticals & Biotech",
  "Education",
  "Telecommunications",
  "Manufacturing",
  "Retail",
  "FMCG",
  "Media & Entertainment",
  "Hospitality & Tourism",
  "Automotive",
  "Real Estate & Construction",
  "Energy & Utilities",
  "Logistics & Supply Chain",
  "Legal Services",
  "Government & Public Sector",
  "NGO & Social Services",
  "Aerospace & Defense",
  "Agriculture",
  "Insurance",
  "Advertising & Marketing",
  "E-commerce",
  "Research & Development",
  "Others"
];

interface WorkEmploymentDataToSave {
  workExperienceIndustry?: string;
  workExperienceYears?: string;
  workExperienceMonths?: string;
  workExperienceProofType?: 'resume' | 'linkedin' | null;
  resumeUrl?: string | null; // Firebase Storage URL for the resume file
  // Data URIs or text content for AI are handled locally, not saved to Firestore directly
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
  consentTimestamp?: string;
}


export default function WorkEmploymentKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();
  const userId = getOrGenerateUserId();

  const [avekaMessage, setAvekaMessage] = useState("Co-signatory details noted (or understood). Now, let's discuss your work experience. Please provide your industry and years of experience. Sharing your resume (image, PDF, DOC, TXT) or LinkedIn is optional but can help us process your application faster.");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);

  const [workExperienceIndustry, setWorkExperienceIndustry] = useState(industryOptions[0]);
  const [workExperienceYears, setWorkExperienceYears] = useState<string | undefined>();
  const [workExperienceMonths, setWorkExperienceMonths] = useState<string | undefined>();
  const [workExperienceProofType, setWorkExperienceProofType] = useState<'resume' | 'linkedin' | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null); // data URI for image, PDF, DOC
  const [resumeTextContent, setResumeTextContent] = useState<string | null>(null); // For .txt content

  const [linkedInUrl, setLinkedInUrl] = useState('');

  const [isProcessingProfile, setIsProcessingProfile] = useState(false);
  const [extractedProfileData, setExtractedProfileData] = useState<Partial<ExtractProfessionalProfileOutput>>({});
  const [editingProfileField, setEditingProfileField] = useState<keyof ExtractProfessionalProfileOutput | null>(null);
  const [editProfileValue, setEditProfileValue] = useState('');

  const [showEmploymentStatus, setShowEmploymentStatus] = useState(false);
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState<'yes' | 'no' | null>(null);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState<string | undefined>('INR');
  const [familyMonthlySalary, setFamilyMonthlySalary] = useState('');
  const [familySalaryCurrency, setFamilySalaryCurrency] = useState<string | undefined>('INR');

  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCameraForResume, setShowCameraForResume] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const timerId = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const isWorkExperienceCoreComplete = () => {
    return workExperienceIndustry.trim() !== '' && workExperienceYears !== undefined && workExperienceMonths !== undefined;
  };

  useEffect(() => {
    if (isWorkExperienceCoreComplete() && !showEmploymentStatus) {
      setShowEmploymentStatus(true);
      setAvekaMessage("Work experience details look good. Sharing a resume or LinkedIn is optional. Finally, let's confirm your current employment status.");
    }
  }, [workExperienceIndustry, workExperienceYears, workExperienceMonths, showEmploymentStatus]);


  const processProfile = async () => {
    let sourceForAI: string | null = null;
    let typeForAI: ExtractProfessionalProfileInput['sourceType'] | null = null;
    let textContentForAI: string | null = null;

    if (workExperienceProofType === 'resume') {
      if (resumePreview) { // Data URI for image, PDF, DOC
        sourceForAI = resumePreview;
        typeForAI = 'resumeImage'; // Treat PDF/DOC as image for current Genkit flow
      } else if (resumeTextContent) { // TXT file content
        textContentForAI = resumeTextContent;
        typeForAI = 'resumeText';
      }
    } else if (workExperienceProofType === 'linkedin' && linkedInUrl) {
      if (!/linkedin\.com\/in\//.test(linkedInUrl)) {
        toast({ title: "Invalid LinkedIn URL", description: "Please enter a valid LinkedIn profile URL.", variant: "destructive" });
        return;
      }
      sourceForAI = linkedInUrl;
      typeForAI = 'linkedinUrl';
    }

    if (!typeForAI || (!sourceForAI && !textContentForAI)) {
      // Don't show error if it's optional and nothing provided
      // toast({ title: "Missing Information", description: `Cannot process ${workExperienceProofType} without data.`, variant: "destructive"});
      return;
    }

    setIsProcessingProfile(true);
    setAvekaMessage(`Analyzing your ${workExperienceProofType}... This might take a moment.`);
    try {
      const input: ExtractProfessionalProfileInput = {
        profileDataSource: sourceForAI,
        sourceType: typeForAI,
        resumeTextContent: textContentForAI,
      };
      const result = await extractProfessionalProfileDetails(input);
      setExtractedProfileData(result);
      setAvekaMessage("I've extracted some details from your professional profile. Please review them below. You can edit if needed.");
      toast({ title: "Profile Details Extracted", description: "Review the details below." });
    } catch (error: any) {
      console.error(`Error processing ${typeForAI}:`, error);
      setExtractedProfileData({ yearsOfExperience: "Error - Check Manually", gapInLast3YearsMonths: "Error - Check Manually", currentOrLastIndustry: "Error - Check Manually", currentOrLastJobRole: "Error - Check Manually" });
      toast({ title: "Profile Extraction Failed", description: error.message || "Could not extract details. Please verify manually.", variant: "destructive" });
      setAvekaMessage("I had trouble analyzing your profile. Please review and fill in the details manually.");
    } finally {
      setIsProcessingProfile(false);
    }
  };

  const handleResumeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setResumePreview(null);
      setResumeTextContent(null);
      setExtractedProfileData({}); // Reset on new file

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setResumePreview(dataUrl);
          // processProfile will be called by useEffect
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain') {
         const reader = new FileReader();
        reader.onloadend = () => {
          setResumeTextContent(reader.result as string);
          // processProfile will be called by useEffect
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setResumePreview(reader.result as string); // Pass data URI for PDF/DOC
          // processProfile will be called by useEffect
        };
        reader.readAsDataURL(file);
        toast({ title: "Document Uploaded", description: `${file.name} uploaded. AI will attempt to process it. Clear images work best.` });
      } else {
        toast({ title: "Unsupported File", description: "Please upload an image, PDF, DOC, or TXT file.", variant: "destructive"});
        setResumeFile(null);
      }
    }
  };

  useEffect(() => {
    if (workExperienceProofType === 'resume' && (resumePreview || resumeTextContent) && Object.keys(extractedProfileData).length === 0 && !isProcessingProfile) {
        processProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumePreview, resumeTextContent, workExperienceProofType]); // Added workExperienceProofType


  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], {type:mime});
  };

  const handleResumeCaptureImage = () => {
    if (videoRef.current && canvasRef.current && showCameraForResume) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const capturedFile = new File([dataURLtoBlob(dataUrl)], "resume_capture.png", { type: "image/png" });
        setResumeFile(capturedFile);
        setResumePreview(dataUrl);
        setResumeTextContent(null);
        setShowCameraForResume(false);
        // processProfile() will be called by useEffect watching resumePreview
      }
    }
  };

  const handleEditProfileField = (field: keyof ExtractProfessionalProfileOutput, currentValue: string | undefined) => {
    setEditingProfileField(field);
    setEditProfileValue(currentValue || '');
  };

  const handleSaveProfileEdit = () => {
    if (editingProfileField) {
      setExtractedProfileData(prev => ({ ...prev, [editingProfileField]: editProfileValue }));
      setEditingProfileField(null);
      toast({ title: "Profile Detail Updated"});
    }
  };

  const isEmploymentStatusComplete = () => {
    if (!isCurrentlyWorking) return false;
    if (isCurrentlyWorking === 'yes') return monthlySalary.trim() !== '' && salaryCurrency !== undefined;
    if (isCurrentlyWorking === 'no') return familyMonthlySalary.trim() !== '' && familySalaryCurrency !== undefined;
    return false;
  };

  const isFormCompleteForSave = () => {
    return isWorkExperienceCoreComplete() && isEmploymentStatusComplete() && consentChecked && !isProcessingProfile;
  };

  const handleSaveAndContinue = async () => {
     if (!userId) {
      toast({ title: "Error", description: "User ID not found. Please refresh.", variant: "destructive" });
      return;
    }
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    if (!isWorkExperienceCoreComplete() || !isEmploymentStatusComplete()) {
        toast({ title: "Incomplete Details", description: "Please fill all mandatory work experience and employment status fields.", variant: "destructive"});
        return;
    }

    setIsSaving(true);

    let uploadedResumeFirebaseUrl: string | undefined = undefined;
    if (workExperienceProofType === 'resume' && resumeFile) {
      const uploadResult = await uploadFileToStorage(userId, resumeFile, `resume/${resumeFile.name}`);
      if (uploadResult.success && uploadResult.downloadURL) {
        uploadedResumeFirebaseUrl = uploadResult.downloadURL;
      } else {
        toast({ title: "Resume Upload Failed", description: uploadResult.error || "Could not upload resume.", variant: "destructive" });
        setIsSaving(false);
        return;
      }
    }

    const workEmploymentDataToSave: WorkEmploymentDataToSave = {
      workExperienceIndustry,
      workExperienceYears,
      workExperienceMonths,
      workExperienceProofType,
      resumeUrl: uploadedResumeFirebaseUrl,
      linkedInUrl: workExperienceProofType === 'linkedin' ? linkedInUrl : null,
      isCurrentlyWorking,
      monthlySalary: isCurrentlyWorking === 'yes' ? monthlySalary : null,
      salaryCurrency: isCurrentlyWorking === 'yes' ? salaryCurrency : null,
      familyMonthlySalary: isCurrentlyWorking === 'no' ? familyMonthlySalary : null,
      familySalaryCurrency: isCurrentlyWorking === 'no' ? familySalaryCurrency : null,
      extractedYearsOfExperience: extractedProfileData?.yearsOfExperience,
      extractedGapInLast3YearsMonths: extractedProfileData?.gapInLast3YearsMonths,
      extractedCurrentOrLastIndustry: extractedProfileData?.currentOrLastIndustry,
      extractedCurrentOrLastJobRole: extractedProfileData?.currentOrLastJobRole,
      consentTimestamp: currentTime,
    };

    try {
      // Save to Firestore
      const result = await saveUserApplicationData(userId, {
        professionalKyc: {
          workEmployment: workEmploymentDataToSave
        }
      });

      // Also save to localStorage for the review page
      localStorage.setItem('workEmploymentKycData', JSON.stringify(workEmploymentDataToSave));
      
      setIsSaving(false);

      if(result.success) {
        toast({ title: "Work & Employment Details Saved!", description: "Proceeding to review all professional details." });
        router.push('/loan-application/review-professional-kyc');
      } else {
        toast({ title: "Save Failed", description: result.error || "Could not save work/employment details.", variant: "destructive"});
      }
    } catch (error) {
      console.error('Error saving work employment data:', error);
      setIsSaving(false);
      toast({ title: "Error", description: "An error occurred while saving your data. Please try again.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (showCameraForResume) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
          setShowCameraForResume(false);
        }
      };
      getCameraPermission();
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [showCameraForResume, toast]);

  const renderProfileTable = () => {
    if (!extractedProfileData || Object.keys(extractedProfileData).length === 0 || isProcessingProfile) return null;

    const validEntries = Object.entries(extractedProfileData).filter(([_, value]) => value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== 'Not Specified');
    if (validEntries.length === 0) return null;
    const dataEntries = validEntries as [keyof ExtractProfessionalProfileOutput, string][];


    return (
      <div className="mt-4 space-y-2 p-3 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.10)] backdrop-blur-xs">
        <h4 className="font-semibold text-sm text-center text-white">Extracted Profile Details (from Resume/LinkedIn):</h4>
        <Table className="bg-white/5 rounded-md text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Field</TableHead>
              <TableHead className="text-white">Value</TableHead>
              <TableHead className="text-white text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataEntries.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="font-medium capitalize text-gray-300">{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell className="text-gray-200">
                  {editingProfileField === key ? (
                    <Input type="text" value={editProfileValue} onChange={(e) => setEditProfileValue(e.target.value)} className="bg-white/80 text-black text-xs" />
                  ) : ( value || "Not Specified" )}
                </TableCell>
                <TableCell className="text-right">
                  {editingProfileField === key ? (
                    <Button onClick={handleSaveProfileEdit} size="sm" className="gradient-border-button text-xs"><Save className="mr-1 h-3 w-3" /> Save</Button>
                  ) : (
                    <Button onClick={() => handleEditProfileField(key, value)} size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white text-xs"><Edit3 className="mr-1 h-3 w-3" /> Edit</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
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

            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
          <div className="flex items-center mb-6 mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/professional-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
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

              {/* Work Experience Section */}
              <div className="space-y-6 p-4 border-0 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
                <h3 className="font-semibold text-lg text-center text-white">Work Experience</h3>
                <div>
                  <Label htmlFor="workExperienceIndustry" className="text-white">Industry you are working in <span className="text-red-400">*</span></Label>
                  <Select value={workExperienceIndustry} onValueChange={setWorkExperienceIndustry} disabled={isSaving}>
                    <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Select Industry" /></SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      {industryOptions.map(ind => (
                        <SelectItem key={ind} value={ind} className="hover:bg-gray-100">{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Experience in Years <span className="text-red-400">*</span></Label>
                    <Select value={workExperienceYears} onValueChange={setWorkExperienceYears} disabled={isSaving}>
                      <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Years" /></SelectTrigger>
                      <SelectContent className="bg-white text-black">{yearOptions.map(y => <SelectItem key={`exp-year-${y}`} value={y} className="hover:bg-gray-100">{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Experience in Months <span className="text-red-400">*</span></Label>
                    <Select value={workExperienceMonths} onValueChange={setWorkExperienceMonths} disabled={isSaving}>
                      <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Months" /></SelectTrigger>
                      <SelectContent className="bg-white text-black">{monthOptions.map(m => <SelectItem key={`exp-month-${m}`} value={m} className="hover:bg-gray-100">{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Provide professional proof (Optional - Image, PDF, DOC, TXT):</Label>
                  <RadioGroup value={workExperienceProofType || ''} onValueChange={(value) => { setWorkExperienceProofType(value as 'resume' | 'linkedin' | null); setExtractedProfileData({}); setResumeFile(null); setResumePreview(null); setResumeTextContent(null); setLinkedInUrl(''); if (value === 'resume') { setAvekaMessage("Okay, please upload your resume. Clear images work best for AI!");} else if (value === 'linkedin') {setAvekaMessage("Great, please paste your LinkedIn profile URL.");} }} className="flex space-x-4 text-white mt-1" >
                    <div className="flex items-center space-x-2"><RadioGroupItem value="resume" id="proof-resume" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" disabled={isSaving || isProcessingProfile}/><Label htmlFor="proof-resume">Upload Resume</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="linkedin" id="proof-linkedin" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" disabled={isSaving || isProcessingProfile}/><Label htmlFor="proof-linkedin">Share LinkedIn Link</Label></div>
                  </RadioGroup>
                </div>
                {workExperienceProofType === 'resume' && (
                  <div className="space-y-2 mt-2 border-t border-gray-600/20 pt-4">
                    <Label className="text-white">Upload Resume (Image, PDF, DOC, TXT)</Label>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <Button onClick={() => resumeFileInputRef.current?.click()} className="gradient-border-button" disabled={isProcessingProfile || isSaving}><UploadCloud className="mr-2 h-5 w-5" /> Upload Resume</Button>
                      <input type="file" ref={resumeFileInputRef} onChange={handleResumeFileChange} className="hidden" accept="image/jpeg,image/png,.pdf,.doc,.docx,.txt" />
                      <Button onClick={() => setShowCameraForResume(true)} className="gradient-border-button" disabled={isProcessingProfile || isSaving}><Camera className="mr-2 h-5 w-5" /> Take Picture (Resume)</Button>
                    </div>
                    {resumeFile && (<div className="text-center mt-2">
                        {resumePreview && resumeFile.type.startsWith('image/') ? <Image src={resumePreview} alt="Resume Preview" width={150} height={200} className="rounded-md mx-auto object-contain max-h-48" data-ai-hint="resume document" />
                        : resumePreview && !resumeFile.type.startsWith('image/') && resumeFile.type !== 'text/plain' ? <p className="text-sm text-gray-300">Uploaded: {resumeFile.name} (Preview N/A)</p>
                        : resumeTextContent ? <div className="bg-gray-800 p-2 rounded-md max-h-32 overflow-y-auto mt-2"><p className="text-xs text-gray-300 whitespace-pre-wrap">{resumeTextContent.substring(0,300)}{resumeTextContent.length > 300 ? "..." : ""}</p></div>
                        : <p className="text-sm text-gray-300">Uploaded: {resumeFile.name}</p>}
                    </div>)}
                    {isProcessingProfile && workExperienceProofType === 'resume' && <div className="text-center text-white"><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" /> Processing Resume...</div>}
                  </div>
                )}
                {workExperienceProofType === 'linkedin' && (
                  <div className="mt-2 border-t border-gray-600/20 pt-4 space-y-2">
                    <Label htmlFor="linkedInUrl" className="text-white">LinkedIn Profile URL</Label>
                    <Input id="linkedInUrl" value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} className="bg-white/80 text-black" placeholder="https://linkedin.com/in/yourprofile" disabled={isProcessingProfile || isSaving}/>
                    <Button onClick={processProfile} className="gradient-border-button" disabled={isProcessingProfile || isSaving || !linkedInUrl}><Sparkles className="mr-2 h-4 w-4" /> Analyze LinkedIn</Button>
                    {isProcessingProfile && workExperienceProofType === 'linkedin' && <div className="text-center text-white"><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" /> Processing LinkedIn...</div>}
                  </div>
                )}
                {renderProfileTable()}
              </div>

              {showEmploymentStatus && (
                <div className="space-y-6 p-4 border-0 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
                  <h3 className="font-semibold text-lg text-center text-white">Current Employment Status</h3>
                  <Label className="text-white">Are you currently working? <span className="text-red-400">*</span></Label>
                  <RadioGroup value={isCurrentlyWorking || ''} onValueChange={(value) => { setIsCurrentlyWorking(value as 'yes' | 'no' | null); if (value === 'yes') {setAvekaMessage("Great, please provide your monthly salary.");} else {setAvekaMessage("Okay, please provide your estimated family's monthly salary.");} }} className="flex space-x-4 text-white" >
                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="working-yes" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" disabled={isSaving}/><Label htmlFor="working-yes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="working-no" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" disabled={isSaving}/><Label htmlFor="working-no">No</Label></div>
                  </RadioGroup>
                  {isCurrentlyWorking === 'yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-gray-600/20 pt-4">
                      <div><Label htmlFor="monthlySalary" className="text-white">Your Monthly Salary <span className="text-red-400">*</span></Label><Input id="monthlySalary" type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} className="bg-white/80 text-black" placeholder="E.g., 5000" disabled={isSaving}/></div>
                      <div><Label htmlFor="salaryCurrency" className="text-white">Salary Currency <span className="text-red-400">*</span></Label><Select value={salaryCurrency} onValueChange={setSalaryCurrency} disabled={isSaving}><SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Currency" /></SelectTrigger><SelectContent className="bg-white text-black">{currencyOptions.map(c => <SelectItem key={`curr-${c}`} value={c} className="hover:bg-gray-100">{c}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                  )}
                  {isCurrentlyWorking === 'no' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-gray-600/20 pt-4">
                      <div><Label htmlFor="familyMonthlySalary" className="text-white">Estimated Family's Monthly Salary <span className="text-red-400">*</span></Label><Input id="familyMonthlySalary" type="number" value={familyMonthlySalary} onChange={(e) => setFamilyMonthlySalary(e.target.value)} className="bg-white/80 text-black" placeholder="E.g., 8000" disabled={isSaving}/></div>
                      <div><Label htmlFor="familySalaryCurrency" className="text-white">Salary Currency <span className="text-red-400">*</span></Label><Select value={familySalaryCurrency} onValueChange={setFamilySalaryCurrency} disabled={isSaving}><SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Currency" /></SelectTrigger><SelectContent className="bg-white text-black">{currencyOptions.map(c => <SelectItem key={`fam-curr-${c}`} value={c} className="hover:bg-gray-100">{c}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 space-y-4 border-t border-gray-500/50 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="workEmploymentConsent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" disabled={isSaving}/>
                  <Label htmlFor="workEmploymentConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    I confirm all work and employment details are correct.
                  </Label>
                </div>
                <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
              </div>

              <div className="mt-8 flex justify-center">
                <Button onClick={handleSaveAndContinue} size="lg" className="gradient-border-button" disabled={!isFormCompleteForSave() || isSaving || isProcessingProfile }>
                   {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save & Continue to Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {showCameraForResume && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="font-semibold mb-4 text-center text-white text-lg">Camera for Resume</h3>
              <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden"></canvas>
              {hasCameraPermission === false ? (
                <Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /> <AlertTitle>Camera Access Denied</AlertTitle> <AlertDescription>Enable camera permissions.</AlertDescription></Alert>
              ) : (
                <div className="mt-4 flex justify-around">
                  <Button onClick={() => setShowCameraForResume(false)} variant="outline" className="bg-gray-600 text-white">Cancel</Button>
                  <Button onClick={handleResumeCaptureImage} className="gradient-border-button">Capture Image</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

    