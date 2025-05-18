
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
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { ArrowLeft, UploadCloud, Camera, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const yearOptions = Array.from({ length: 26 }, (_, i) => String(i)); // 0-25 years
const monthOptions = Array.from({ length: 12 }, (_, i) => String(i)); // 0-11 months
const currencyOptions = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CNY", "Other"]; // Common currencies

export default function ProfessionalKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [avekaMessage, setAvekaMessage] = useState("Let's gather some professional details. First, about any co-signatories. Adding a co-signatory can often improve loan approval chances!");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);

  // Co-Signatory State
  const [coSignatoryChoice, setCoSignatoryChoice] = useState<string | null>(null);
  const [isIndia, setIsIndia] = useState<boolean | null>(null);
  const [coSignatoryIdDocumentType, setCoSignatoryIdDocumentType] = useState<"PAN Card" | "National ID">("National ID");
  const [coSignatoryIdFile, setCoSignatoryIdFile] = useState<File | null>(null);
  const [coSignatoryIdPreview, setCoSignatoryIdPreview] = useState<string | null>(null);
  const [coSignatoryRelationship, setCoSignatoryRelationship] = useState<string | null>(null);
  const coSignatoryIdFileInputRef = useRef<HTMLInputElement>(null);
  const [showCameraForCoSignatory, setShowCameraForCoSignatory] = useState(false);

  // Work Experience State
  const [workExperienceIndustry, setWorkExperienceIndustry] = useState('');
  const [workExperienceYears, setWorkExperienceYears] = useState<string | undefined>();
  const [workExperienceMonths, setWorkExperienceMonths] = useState<string | undefined>();
  const [workExperienceProofType, setWorkExperienceProofType] = useState<string | null>(null); // 'resume' or 'linkedin'
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null); // For image resumes
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const [showCameraForResume, setShowCameraForResume] = useState(false);


  // Employment Status State
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState<string | null>(null); // 'yes' or 'no'
  const [monthlySalary, setMonthlySalary] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState<string | undefined>();
  const [familyMonthlySalary, setFamilyMonthlySalary] = useState('');
  const [familySalaryCurrency, setFamilySalaryCurrency] = useState<string | undefined>();

  // Section Visibility & Progression
  const [showCoSignatorySection, setShowCoSignatorySection] = useState(true);
  const [showWorkExperience, setShowWorkExperience] = useState(false);
  const [showEmploymentStatus, setShowEmploymentStatus] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    if (typeof window !== 'undefined') {
      const countryValue = localStorage.getItem('selectedCountryValue');
      const isFromIndia = countryValue?.includes('_IN') || false;
      setIsIndia(isFromIndia);
      setCoSignatoryIdDocumentType(isFromIndia ? "PAN Card" : "National ID");
    }
    return () => clearTimeout(timer);
  }, []);

  const isCoSignatorySectionComplete = () => {
    if (!coSignatoryChoice) return false;
    if (coSignatoryChoice === 'yes') {
      return coSignatoryIdPreview && coSignatoryRelationship;
    }
    return true; // 'no' or 'addLater'
  };

  const isWorkExperienceCoreComplete = () => {
    return workExperienceIndustry && workExperienceYears !== undefined && workExperienceMonths !== undefined;
  };
  
  const isEmploymentStatusComplete = () => {
    if (!isCurrentlyWorking) return false;
    if (isCurrentlyWorking === 'yes') {
      return monthlySalary && salaryCurrency;
    }
    if (isCurrentlyWorking === 'no') {
      return familyMonthlySalary && familySalaryCurrency;
    }
    return false;
  };

  useEffect(() => {
    if (isCoSignatorySectionComplete() && !showWorkExperience) {
      setShowWorkExperience(true);
      setAvekaMessage("Co-signatory details noted (or understood). Now, let's discuss your work experience. Please provide your industry and years of experience. Sharing your resume or LinkedIn is optional but can help us process your application faster.");
    }
  }, [coSignatoryChoice, coSignatoryIdPreview, coSignatoryRelationship, showWorkExperience]);
  
  useEffect(() => {
    if (showWorkExperience && isWorkExperienceCoreComplete() && !showEmploymentStatus) {
        setShowEmploymentStatus(true);
        setAvekaMessage("Work experience details look good. Finally, let's confirm your current employment status.");
    }
  }, [workExperienceIndustry, workExperienceYears, workExperienceMonths, showWorkExperience, showEmploymentStatus]);

  useEffect(() => {
    if (showEmploymentStatus && isEmploymentStatusComplete() && isFormComplete()) {
        setAvekaMessage("Excellent! All professional details are complete. Please click 'Save & Continue' to review.");
    }
  }, [isCurrentlyWorking, monthlySalary, salaryCurrency, familyMonthlySalary, familySalaryCurrency, showEmploymentStatus, isCoSignatorySectionComplete, isWorkExperienceCoreComplete]);


  // Camera Logic
   useEffect(() => {
    if (showCameraForCoSignatory || showCameraForResume) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions to use this feature.',
          });
          setShowCameraForCoSignatory(false);
          setShowCameraForResume(false);
        }
      };
      getCameraPermission();
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [showCameraForCoSignatory, showCameraForResume, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'coSignatoryId' | 'resume') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'coSignatoryId') {
          setCoSignatoryIdFile(file);
          setCoSignatoryIdPreview(reader.result as string);
          toast({ title: `${coSignatoryIdDocumentType} Uploaded!` });
        } else if (type === 'resume') {
          setResumeFile(file);
          if (file.type.startsWith('image/')) {
            setResumePreview(reader.result as string);
          } else {
            setResumePreview(null); // No preview for PDF/DOC
          }
          toast({ title: "Resume Uploaded!" });
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
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current && (showCameraForCoSignatory || showCameraForResume)) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const fileType = showCameraForCoSignatory ? 'coSignatoryId' : 'resume';
        const capturedFile = new File([dataURLtoBlob(dataUrl)], `${fileType}_capture.png`, { type: 'image/png' });

        if (showCameraForCoSignatory) {
          setCoSignatoryIdFile(capturedFile);
          setCoSignatoryIdPreview(dataUrl);
          toast({ title: `${coSignatoryIdDocumentType} Captured!` });
          setShowCameraForCoSignatory(false);
        } else if (showCameraForResume) {
          setResumeFile(capturedFile);
          setResumePreview(dataUrl); // Image capture means we have a preview
          toast({ title: "Resume Image Captured!" });
          setShowCameraForResume(false);
        }
      }
    }
  };

  const handleSaveAndContinue = () => {
    // Data URIs are saved separately to avoid localStorage quota issues
    if (coSignatoryIdPreview) {
      localStorage.setItem('coSignatoryIdDataUriForReview', coSignatoryIdPreview);
    } else {
      localStorage.removeItem('coSignatoryIdDataUriForReview');
    }

    if (resumePreview) { // resumePreview means it's an image data URI
      localStorage.setItem('resumeDataUriForReview', resumePreview);
    } else {
      localStorage.removeItem('resumeDataUriForReview');
    }
    
    const professionalData = {
      coSignatoryChoice,
      // coSignatoryIdDocumentUri is handled by separate localStorage item if it's a preview
      coSignatoryIdDocumentType: coSignatoryChoice === 'yes' ? coSignatoryIdDocumentType : null,
      coSignatoryRelationship: coSignatoryChoice === 'yes' ? coSignatoryRelationship : null,
      
      workExperienceIndustry,
      workExperienceYears,
      workExperienceMonths,
      workExperienceProofType,
      // resumeFileUri will store filename for non-image resumes, or be null if image URI is stored separately
      resumeFileUri: workExperienceProofType === 'resume' && resumeFile && !resumePreview ? resumeFile.name : null,
      linkedInUrl: workExperienceProofType === 'linkedin' ? linkedInUrl : null,
      
      isCurrentlyWorking,
      monthlySalary: isCurrentlyWorking === 'yes' ? monthlySalary : null,
      salaryCurrency: isCurrentlyWorking === 'yes' ? salaryCurrency : null,
      familyMonthlySalary: isCurrentlyWorking === 'no' ? familyMonthlySalary : null,
      familySalaryCurrency: isCurrentlyWorking === 'no' ? familySalaryCurrency : null,
    };

    localStorage.setItem('professionalKycData', JSON.stringify(professionalData));
    toast({ title: "Professional Details Saved!", description: "Proceeding to review your professional details." });
    router.push('/loan-application/review-professional-kyc');
  };
  
  const isFormComplete = () => {
    const coSignatoryOk = 
      coSignatoryChoice === 'no' || 
      coSignatoryChoice === 'addLater' || 
      (coSignatoryChoice === 'yes' && !!coSignatoryIdPreview && !!coSignatoryRelationship);

    const workExperienceOk = 
      !!workExperienceIndustry && 
      workExperienceYears !== undefined && 
      workExperienceMonths !== undefined;
      
    const employmentStatusOk = 
      !!isCurrentlyWorking &&
      (isCurrentlyWorking === 'yes' ? (!!monthlySalary && !!salaryCurrency) : (!!familyMonthlySalary && !!familySalaryCurrency));

    return coSignatoryOk && workExperienceOk && employmentStatusOk;
  };


  const renderCoSignatorySection = () => (
    showCoSignatorySection && (
        <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
        <h3 className="font-semibold text-lg text-center text-white">Co-Signatory Details</h3>
        <Label className="text-white">Do you want to add a co-signatory? (This can increase approval chances)</Label>
        <RadioGroup value={coSignatoryChoice || ''} onValueChange={setCoSignatoryChoice} className="flex flex-wrap gap-x-4 gap-y-2 text-white">
            {["yes", "no", "addLater"].map(opt => (
            <div key={`cosign-${opt}`} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`cosign-${opt}`} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
                <Label htmlFor={`cosign-${opt}`}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace('addLater', 'Add Later')}</Label>
            </div>
            ))}
        </RadioGroup>

        {coSignatoryChoice === 'yes' && (
            <div className="space-y-4 mt-4 border-t border-gray-600/20 pt-4">
            <Label className="text-white">{`Upload Co-signatory's ${coSignatoryIdDocumentType}`} <span className="text-red-400">*</span></Label>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button onClick={() => coSignatoryIdFileInputRef.current?.click()} className="gradient-border-button w-auto">
                <UploadCloud className="mr-2 h-5 w-5" /> Upload {coSignatoryIdDocumentType}
                </Button>
                <input type="file" ref={coSignatoryIdFileInputRef} onChange={(e) => handleFileChange(e, 'coSignatoryId')} className="hidden" accept="image/*,.pdf" />
                <Button onClick={() => setShowCameraForCoSignatory(true)} className="gradient-border-button w-auto">
                <Camera className="mr-2 h-5 w-5" /> Take Picture
                </Button>
            </div>
            {coSignatoryIdPreview && (
                <div className="text-center mt-2">
                <Image src={coSignatoryIdPreview} alt={`${coSignatoryIdDocumentType} Preview`} width={150} height={90} className="rounded-md mx-auto object-contain max-h-32" data-ai-hint="ID document"/>
                </div>
            )}
            <div>
                <Label htmlFor="coSignatoryRelationship" className="text-white">Relationship with Co-signatory <span className="text-red-400">*</span></Label>
                <Select value={coSignatoryRelationship || ''} onValueChange={setCoSignatoryRelationship}>
                <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent className="bg-white text-black">
                    {["Parent", "Sibling", "Spouse", "Family Member", "Friend"].map(rel => (
                    <SelectItem key={rel} value={rel.toLowerCase()} className="hover:bg-gray-100">{rel}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            </div>
        )}
        </div>
    )
  );

  const renderWorkExperienceSection = () => (
    showWorkExperience && (
      <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
        <h3 className="font-semibold text-lg text-center text-white">Work Experience</h3>
        <div>
          <Label htmlFor="workExperienceIndustry" className="text-white">Industry you are working in <span className="text-red-400">*</span></Label>
          <Input id="workExperienceIndustry" value={workExperienceIndustry} onChange={(e) => setWorkExperienceIndustry(e.target.value)} className="bg-white/80 text-black" placeholder="E.g., Information Technology, Finance"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Experience in Years <span className="text-red-400">*</span></Label>
            <Select value={workExperienceYears} onValueChange={setWorkExperienceYears}>
              <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Years" /></SelectTrigger>
              <SelectContent className="bg-white text-black">
                {yearOptions.map(y => <SelectItem key={`exp-year-${y}`} value={y} className="hover:bg-gray-100">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white">Experience in Months <span className="text-red-400">*</span></Label>
            <Select value={workExperienceMonths} onValueChange={setWorkExperienceMonths}>
              <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Months" /></SelectTrigger>
              <SelectContent className="bg-white text-black">
                {monthOptions.map(m => <SelectItem key={`exp-month-${m}`} value={m} className="hover:bg-gray-100">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-white">Provide professional proof (Optional):</Label>
          <RadioGroup value={workExperienceProofType || ''} onValueChange={setWorkExperienceProofType} className="flex space-x-4 text-white mt-1">
            <div className="flex items-center space-x-2"><RadioGroupItem value="resume" id="proof-resume" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="proof-resume">Upload Resume</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="linkedin" id="proof-linkedin" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="proof-linkedin">Share LinkedIn Link</Label></div>
          </RadioGroup>
        </div>
        {workExperienceProofType === 'resume' && (
          <div className="space-y-2 mt-2 border-t border-gray-600/20 pt-4">
            <Label className="text-white">Upload Resume (Image, PDF, or DOC)</Label>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button onClick={() => resumeFileInputRef.current?.click()} className="gradient-border-button w-auto">
                <UploadCloud className="mr-2 h-5 w-5" /> Upload Resume
                </Button>
                <input type="file" ref={resumeFileInputRef} onChange={(e) => handleFileChange(e, 'resume')} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                <Button onClick={() => setShowCameraForResume(true)} className="gradient-border-button w-auto">
                <Camera className="mr-2 h-5 w-5" /> Take Picture (of Resume)
                </Button>
            </div>
            {resumeFile && (
              <div className="text-center mt-2">
                {resumePreview ? (
                  <Image src={resumePreview} alt="Resume Preview" width={150} height={200} className="rounded-md mx-auto object-contain max-h-48" data-ai-hint="resume document"/>
                ) : (
                  <p className="text-sm text-gray-300">Uploaded: {resumeFile.name}</p>
                )}
              </div>
            )}
          </div>
        )}
        {workExperienceProofType === 'linkedin' && (
          <div className="mt-2 border-t border-gray-600/20 pt-4">
            <Label htmlFor="linkedInUrl" className="text-white">LinkedIn Profile URL</Label>
            <Input id="linkedInUrl" value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} className="bg-white/80 text-black" placeholder="https://linkedin.com/in/yourprofile"/>
          </div>
        )}
      </div>
    )
  );

  const renderEmploymentStatusSection = () => (
    showEmploymentStatus && (
      <div className="space-y-6 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
        <h3 className="font-semibold text-lg text-center text-white">Current Employment Status</h3>
        <Label className="text-white">Are you currently working? <span className="text-red-400">*</span></Label>
        <RadioGroup value={isCurrentlyWorking || ''} onValueChange={setIsCurrentlyWorking} className="flex space-x-4 text-white">
          <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="working-yes" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="working-yes">Yes</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="working-no" className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><Label htmlFor="working-no">No</Label></div>
        </RadioGroup>

        {isCurrentlyWorking === 'yes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-gray-600/20 pt-4">
            <div>
              <Label htmlFor="monthlySalary" className="text-white">Your Monthly Salary <span className="text-red-400">*</span></Label>
              <Input id="monthlySalary" type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} className="bg-white/80 text-black" placeholder="E.g., 5000"/>
            </div>
            <div>
              <Label htmlFor="salaryCurrency" className="text-white">Salary Currency <span className="text-red-400">*</span></Label>
              <Select value={salaryCurrency} onValueChange={setSalaryCurrency}>
                <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {currencyOptions.map(c => <SelectItem key={`curr-${c}`} value={c} className="hover:bg-gray-100">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {isCurrentlyWorking === 'no' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-gray-600/20 pt-4">
            <div>
              <Label htmlFor="familyMonthlySalary" className="text-white">Estimated Family's Monthly Salary <span className="text-red-400">*</span></Label>
              <Input id="familyMonthlySalary" type="number" value={familyMonthlySalary} onChange={(e) => setFamilyMonthlySalary(e.target.value)} className="bg-white/80 text-black" placeholder="E.g., 8000"/>
            </div>
            <div>
              <Label htmlFor="familySalaryCurrency" className="text-white">Salary Currency <span className="text-red-400">*</span></Label>
              <Select value={familySalaryCurrency} onValueChange={setFamilySalaryCurrency}>
                <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {currencyOptions.map(c => <SelectItem key={`fam-curr-${c}`} value={c} className="hover:bg-gray-100">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
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
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.30)] rounded-2xl z-0"></div>
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
                       <span className={`inline-block w-2 h-2 rounded-full mr-1.5 sm:mr-2 shrink-0 ${ activeNavItem === item ? 'progress-dot-active' : 'bg-gray-400/60'}`} aria-hidden="true"></span>
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
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/review-academic-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
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
              
              {renderCoSignatorySection()}
              {showWorkExperience && renderWorkExperienceSection()}
              {showEmploymentStatus && renderEmploymentStatusSection()}
              
              {isFormComplete() && (
                <div className="mt-8 flex justify-center">
                    <Button onClick={handleSaveAndContinue} size="lg" className="gradient-border-button">
                    Save & Continue to Review
                    </Button>
                </div>
              )}

            </div>
          </div>
        </div>
        {(showCameraForCoSignatory || showCameraForResume) && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="font-semibold mb-4 text-center text-white text-lg">Camera for {showCameraForCoSignatory ? coSignatoryIdDocumentType : 'Resume'}</h3>
                <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                <canvas ref={canvasRef} className="hidden"></canvas>
                {hasCameraPermission === false ? (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>Enable camera permissions in browser settings.</AlertDescription>
                    </Alert>
                ) : (
                    <div className="mt-4 flex justify-around">
                        <Button onClick={() => { setShowCameraForCoSignatory(false); setShowCameraForResume(false); }} variant="outline" className="bg-gray-600 text-white">Cancel</Button>
                        <Button onClick={handleCaptureImage} className="gradient-border-button">Capture Image</Button>
                    </div>
                )}
                </div>
            </div>
        )}
      </section>
    </div>
  );
}
    
