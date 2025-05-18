
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

const yearOptions = Array.from({ length: 26 }, (_, i) => String(i)); // 0-25 years
const monthOptions = Array.from({ length: 12 }, (_, i) => String(i)); // 0-11 months
const currencyOptions = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CNY", "Other"];

interface WorkEmploymentData {
  workExperienceIndustry?: string;
  workExperienceYears?: string;
  workExperienceMonths?: string;
  workExperienceProofType?: 'resume' | 'linkedin' | null;
  resumeFileName?: string | null; // Store filename for non-image resumes
  linkedInUrl?: string | null;
  isCurrentlyWorking?: 'yes' | 'no' | null;
  monthlySalary?: string | null;
  salaryCurrency?: string | null;
  familyMonthlySalary?: string | null;
  familySalaryCurrency?: string | null;
  // AI Extracted for Profile
  extractedYearsOfExperience?: string;
  extractedGapInLast3YearsMonths?: string;
  extractedCurrentOrLastIndustry?: string;
  extractedCurrentOrLastJobRole?: string;
}


export default function WorkEmploymentKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [avekaMessage, setAvekaMessage] = useState("Great! Now, let's talk about your work experience.");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);

  const [workExperienceIndustry, setWorkExperienceIndustry] = useState('');
  const [workExperienceYears, setWorkExperienceYears] = useState<string | undefined>();
  const [workExperienceMonths, setWorkExperienceMonths] = useState<string | undefined>();
  const [workExperienceProofType, setWorkExperienceProofType] = useState<'resume' | 'linkedin' | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null); // For image resumes (data URI)
  const [linkedInUrl, setLinkedInUrl] = useState('');
  
  const [isProcessingProfile, setIsProcessingProfile] = useState(false);
  const [extractedProfileData, setExtractedProfileData] = useState<Partial<ExtractProfessionalProfileOutput>>({});
  const [editingProfileField, setEditingProfileField] = useState<keyof ExtractProfessionalProfileOutput | null>(null);
  const [editProfileValue, setEditProfileValue] = useState('');

  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState<string | null>(null);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState<string | undefined>();
  const [familyMonthlySalary, setFamilyMonthlySalary] = useState('');
  const [familySalaryCurrency, setFamilySalaryCurrency] = useState<string | undefined>();

  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

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

  const processProfile = async (source: ExtractProfessionalProfileInput['profileDataSource'], type: ExtractProfessionalProfileInput['sourceType']) => {
    if (!source) return;
    setIsProcessingProfile(true);
    setAvekaMessage(`Analyzing your ${type === 'resumeImage' ? 'resume' : 'LinkedIn profile'}...`);
    try {
      const result = await extractProfessionalProfileDetails({ profileDataSource: source, sourceType: type });
      setExtractedProfileData(result);
      setAvekaMessage("I've extracted some details from your professional profile. Please review them.");
      toast({ title: "Profile Details Extracted", description: "Review the details below." });
    } catch (error) {
      console.error(`Error processing ${type}:`, error);
      setExtractedProfileData({ yearsOfExperience: "Error", gapInLast3YearsMonths: "Error", currentOrLastIndustry: "Error", currentOrLastJobRole: "Error" });
      toast({ title: "Profile Extraction Failed", description: "Could not extract details. Please verify manually.", variant: "destructive" });
      setAvekaMessage("I had trouble analyzing your profile. Please review and fill in the details manually.");
    } finally {
      setIsProcessingProfile(false);
    }
  };

  const handleResumeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (file.type.startsWith('image/')) {
          setResumePreview(dataUrl);
          processProfile(dataUrl, 'resumeImage');
        } else {
          setResumePreview(null); // No preview for PDF/DOC
          toast({ title: "Resume Uploaded", description: "PDF/DOC resumes are not automatically processed by AI here. Please ensure details are accurate."});
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
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
        setResumeFile(new File([dataURLtoBlob(dataUrl)], "resume_capture.png", { type: "image/png" }));
        setResumePreview(dataUrl);
        setShowCameraForResume(false);
        processProfile(dataUrl, 'resumeImage');
      }
    }
  };

  const handleAnalyzeLinkedIn = () => {
    if (linkedInUrl) {
      processProfile(linkedInUrl, 'linkedinUrl');
    } else {
      toast({ title: "LinkedIn URL Missing", description: "Please enter your LinkedIn profile URL.", variant: "destructive" });
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

  const isFormComplete = () => {
    const workExpOk = workExperienceIndustry && workExperienceYears !== undefined && workExperienceMonths !== undefined;
    const employmentOk = isCurrentlyWorking && 
                         (isCurrentlyWorking === 'yes' ? (monthlySalary && salaryCurrency) : (familyMonthlySalary && familySalaryCurrency));
    return workExpOk && employmentOk && consentChecked && !isProcessingProfile;
  };

  const handleSaveAndContinue = () => {
    const workEmploymentData: WorkEmploymentData = {
      workExperienceIndustry,
      workExperienceYears,
      workExperienceMonths,
      workExperienceProofType,
      resumeFileName: workExperienceProofType === 'resume' && resumeFile && !resumePreview ? resumeFile.name : null,
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
    };
    localStorage.setItem('workEmploymentKycData', JSON.stringify(workEmploymentData));
    // Large resumePreview (image data URI) is NOT saved to localStorage.
    localStorage.removeItem('resumeDataUriForReview'); // Clean up old item

    toast({ title: "Work & Employment Details Saved!", description: "Proceeding to review all professional details." });
    router.push('/loan-application/review-professional-kyc');
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
    const dataEntries = Object.entries(extractedProfileData) as [keyof ExtractProfessionalProfileOutput, string][];

    return (
      <div className="mt-4 space-y-2 p-3 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.10)] backdrop-blur-xs">
        <h4 className="font-semibold text-sm text-center text-white">Extracted Profile Details:</h4>
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
        <div className="absolute inset-0 bg-[hsl(var(--primary)/0.10)] rounded-2xl z-0 backdrop-blur-lg"></div>
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
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/professional-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
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

              {/* Work Experience Section */}
              <div className="space-y-6 p-4 border-0 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
                <h3 className="font-semibold text-lg text-center text-white">Work Experience</h3>
                <div>
                  <Label htmlFor="workExperienceIndustry" className="text-white">Industry you are working in <span className="text-red-400">*</span></Label>
                  <Input id="workExperienceIndustry" value={workExperienceIndustry} onChange={(e) => setWorkExperienceIndustry(e.target.value)} className="bg-white/80 text-black" placeholder="E.g., Information Technology"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Experience in Years <span className="text-red-400">*</span></Label>
                    <Select value={workExperienceYears} onValueChange={setWorkExperienceYears}>
                      <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Years" /></SelectTrigger>
                      <SelectContent className="bg-white text-black">{yearOptions.map(y => <SelectItem key={`exp-year-${y}`} value={y} className="hover:bg-gray-100">{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Experience in Months <span className="text-red-400">*</span></Label>
                    <Select value={workExperienceMonths} onValueChange={setWorkExperienceMonths}>
                      <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Months" /></SelectTrigger>
                      <SelectContent className="bg-white text-black">{monthOptions.map(m => <SelectItem key={`exp-month-${m}`} value={m} className="hover:bg-gray-100">{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Provide professional proof (Optional):</Label>
                  <RadioGroup value={workExperienceProofType || ''} onValueChange={setWorkExperienceProofType} className="flex space-x-4 text-white mt-1">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="resume" id="proof-resume" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="proof-resume">Upload Resume</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="linkedin" id="proof-linkedin" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="proof-linkedin">Share LinkedIn Link</Label></div>
                  </RadioGroup>
                </div>
                {workExperienceProofType === 'resume' && (
                  <div className="space-y-2 mt-2 border-t border-gray-600/20 pt-4">
                    <Label className="text-white">Upload Resume (Image, PDF, or DOC)</Label>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <Button onClick={() => resumeFileInputRef.current?.click()} className="gradient-border-button w-auto" disabled={isProcessingProfile}><UploadCloud className="mr-2 h-5 w-5" /> Upload Resume</Button>
                      <input type="file" ref={resumeFileInputRef} onChange={handleResumeFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                      <Button onClick={() => setShowCameraForResume(true)} className="gradient-border-button w-auto" disabled={isProcessingProfile}><Camera className="mr-2 h-5 w-5" /> Take Picture (Resume)</Button>
                    </div>
                    {resumeFile && (<div className="text-center mt-2">{resumePreview ? <Image src={resumePreview} alt="Resume Preview" width={150} height={200} className="rounded-md mx-auto object-contain max-h-48" data-ai-hint="resume document" /> : <p className="text-sm text-gray-300">Uploaded: {resumeFile.name}</p>}</div>)}
                    {isProcessingProfile && workExperienceProofType === 'resume' && <div className="text-center text-white"><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" /> Processing Resume...</div>}
                  </div>
                )}
                {workExperienceProofType === 'linkedin' && (
                  <div className="mt-2 border-t border-gray-600/20 pt-4 space-y-2">
                    <Label htmlFor="linkedInUrl" className="text-white">LinkedIn Profile URL</Label>
                    <Input id="linkedInUrl" value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} className="bg-white/80 text-black" placeholder="https://linkedin.com/in/yourprofile" />
                    <Button onClick={handleAnalyzeLinkedIn} className="gradient-border-button w-auto" disabled={isProcessingProfile}><Sparkles className="mr-2 h-4 w-4" /> Analyze LinkedIn</Button>
                    {isProcessingProfile && workExperienceProofType === 'linkedin' && <div className="text-center text-white"><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" /> Processing LinkedIn...</div>}
                  </div>
                )}
                {renderProfileTable()}
              </div>

              {/* Current Employment Status Section */}
              <div className="space-y-6 p-4 border-0 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
                <h3 className="font-semibold text-lg text-center text-white">Current Employment Status</h3>
                <Label className="text-white">Are you currently working? <span className="text-red-400">*</span></Label>
                <RadioGroup value={isCurrentlyWorking || ''} onValueChange={setIsCurrentlyWorking} className="flex space-x-4 text-white">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="working-yes" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="working-yes">Yes</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="working-no" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="working-no">No</Label></div>
                </RadioGroup>
                {isCurrentlyWorking === 'yes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-gray-600/20 pt-4">
                    <div><Label htmlFor="monthlySalary" className="text-white">Your Monthly Salary <span className="text-red-400">*</span></Label><Input id="monthlySalary" type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} className="bg-white/80 text-black" placeholder="E.g., 5000" /></div>
                    <div><Label htmlFor="salaryCurrency" className="text-white">Salary Currency <span className="text-red-400">*</span></Label><Select value={salaryCurrency} onValueChange={setSalaryCurrency}><SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Currency" /></SelectTrigger><SelectContent className="bg-white text-black">{currencyOptions.map(c => <SelectItem key={`curr-${c}`} value={c} className="hover:bg-gray-100">{c}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                )}
                {isCurrentlyWorking === 'no' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-gray-600/20 pt-4">
                    <div><Label htmlFor="familyMonthlySalary" className="text-white">Estimated Family's Monthly Salary <span className="text-red-400">*</span></Label><Input id="familyMonthlySalary" type="number" value={familyMonthlySalary} onChange={(e) => setFamilyMonthlySalary(e.target.value)} className="bg-white/80 text-black" placeholder="E.g., 8000" /></div>
                    <div><Label htmlFor="familySalaryCurrency" className="text-white">Salary Currency <span className="text-red-400">*</span></Label><Select value={familySalaryCurrency} onValueChange={setFamilySalaryCurrency}><SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Currency" /></SelectTrigger><SelectContent className="bg-white text-black">{currencyOptions.map(c => <SelectItem key={`fam-curr-${c}`} value={c} className="hover:bg-gray-100">{c}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                )}
              </div>
              
              {/* Consent Section */}
              <div className="mt-8 space-y-4 border-t border-gray-500/50 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="workEmploymentConsent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                  <Label htmlFor="workEmploymentConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    I confirm all work and employment details are correct.
                  </Label>
                </div>
                <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
              </div>

              <div className="mt-8 flex justify-center">
                <Button onClick={handleSaveAndContinue} size="lg" className="gradient-border-button" disabled={!isFormComplete() || isProcessingProfile}>
                  Save & Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
        {showCameraForResume && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="font-semibold mb-4 text-center text-white text-lg">Camera for Resume</h3>
              <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
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
