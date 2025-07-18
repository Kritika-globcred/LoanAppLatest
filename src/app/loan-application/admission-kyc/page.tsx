
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UploadCloud, Camera, Edit3, Save, AlertCircle, ArrowLeft } from 'lucide-react';
import type { ExtractOfferLetterInput, ExtractOfferLetterOutput } from '@/ai/flows/extract-offer-letter-flow';
import { extractOfferLetterDetails } from '@/ai/flows/extract-offer-letter-flow';
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { saveUserApplicationData, uploadFileToStorage } from '@/services/firebase-service';


export default function AdmissionKYCPage() {
  // Navigation removed as per requirements
  const { toast } = useToast();
  const router = useRouter();
  const userId = getOrGenerateUserId();


  const [avekaMessage, setAvekaMessage] = useState("Let's start with your admission details. Do you have your academic offer letter handy? For best results with AI extraction, please upload a clear IMAGE (JPG, PNG). Other formats (PDF, DOC, TXT) are accepted, but AI works best with images.");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [studentFirstName, setStudentFirstName] = useState<string | null>(null);

  const [hasOfferLetter, setHasOfferLetter] = useState<boolean | null>(null);
  const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);
  const [offerLetterPreview, setOfferLetterPreview] = useState<string | null>(null); // For image, PDF, DOC data URI
  const [offerLetterTextContent, setOfferLetterTextContent] = useState<string | null>(null); // For TXT content
  
  // New state for admission details form
  const [universityName, setUniversityName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [country, setCountry] = useState('');
  const [degree, setDegree] = useState('');
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [formError, setFormError] = useState('');

  const [isProcessingLetter, setIsProcessingLetter] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractOfferLetterOutput | null>(null);
  const [editingField, setEditingField] = useState<keyof ExtractOfferLetterOutput | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showCamera) {
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
          setShowCamera(false);
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
  }, [showCamera, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOfferLetterFile(file);
      setOfferLetterPreview(null);
      setOfferLetterTextContent(null);
      setExtractedData(null); // Reset extracted data on new file

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setOfferLetterPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setOfferLetterTextContent(reader.result as string);
        };
        reader.readAsText(file);
        toast({ title: "Text File Selected", description: `${file.name} uploaded. AI will process its content.` });
      } else if (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setOfferLetterPreview(reader.result as string); // Pass data URI for PDF/DOC
        };
        reader.readAsDataURL(file);
        toast({ title: `${file.type.toUpperCase()} Selected`, description: `${file.name} uploaded. AI will attempt to process it. For best results, use clear images or TXT files.` });
      } else {
        toast({ title: "Unsupported File", description: "Please upload an image, PDF, DOC, or TXT file.", variant: "destructive"});
        setOfferLetterFile(null);
        setExtractedData({
          studentName: "Not Specified", universityName: "Not Specified", courseName: "Not Specified",
          admissionLevel: "Not Specified", admissionFees: "Not Specified", courseStartDate: "Not Specified",
          offerLetterType: "Not Specified"
        });
        setAvekaMessage("This file type might not be optimal for AI extraction. Please review and fill in the offer letter details manually below, or upload an image/text file for AI processing.");
      }
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

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setOfferLetterPreview(dataUrl);
        setOfferLetterTextContent(null);
        setOfferLetterFile(new File([dataURLtoBlob(dataUrl)], "offer_letter_capture.png", { type: "image/png" }));
        setShowCamera(false);
      }
    }
  };

  const processOfferLetterAI = async () => {
    if (!offerLetterPreview && !offerLetterTextContent) {
      toast({ title: "AI Extraction Skipped", description: "No suitable document content (image or text) to process. Please review and fill details manually.", variant: "default" });
      setExtractedData({
          studentName: "Not Specified", universityName: "Not Specified", courseName: "Not Specified",
          admissionLevel: "Not Specified", admissionFees: "Not Specified", courseStartDate: "Not Specified",
          offerLetterType: "Not Specified"
      });
      setAvekaMessage("Please review and fill in the offer letter details manually below, or upload an image/text file for AI processing.");
      return;
    }
    setIsProcessingLetter(true);
    setExtractedData(null);
    setAvekaMessage("Great! I'm currently analyzing your offer letter. This might take a few moments...");
    try {
      const input: ExtractOfferLetterInput = {
        offerLetterImageUri: offerLetterFile?.type.startsWith('image/') ? offerLetterPreview : (offerLetterFile?.type === 'application/pdf' || offerLetterFile?.name.endsWith('.doc') || offerLetterFile?.name.endsWith('.docx')) ? offerLetterPreview : null,
        offerLetterTextContent: offerLetterTextContent,
      };
      const result = await extractOfferLetterDetails(input);
      setExtractedData(result);
      if (result && typeof result.studentName === 'string' && result.studentName.trim() !== '' && result.studentName !== "Not Specified") {
        setStudentFirstName(result.studentName.split(' ')[0]);
      } else {
        setStudentFirstName(null);
      }
      toast({ title: "Information Extracted", description: "Please review the details below." });
    } catch (error) {
      console.error("Error processing offer letter:", error);
      toast({ title: "Extraction Failed", description: "Could not extract details. Please ensure it's a clear image/document or try re-uploading.", variant: "destructive" });
      setAvekaMessage("I had trouble extracting details. Please review the fields and fill them manually if needed.");
      setExtractedData({
        studentName: "Not Specified", universityName: "Not Specified", courseName: "Not Specified",
        admissionLevel: "Not Specified", admissionFees: "Not Specified", courseStartDate: "Not Specified",
        offerLetterType: "Not Specified"
      });
    } finally {
      setIsProcessingLetter(false);
    }
  };

  useEffect(() => {
    if (offerLetterFile && (offerLetterPreview || offerLetterTextContent) && !extractedData && !isProcessingLetter) {
      processOfferLetterAI();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerLetterPreview, offerLetterTextContent, offerLetterFile]);

  const handleEditField = (field: keyof ExtractOfferLetterOutput, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (extractedData && editingField) {
      const newData = { ...extractedData, [editingField]: editValue };
      setExtractedData(newData);
      if (editingField === 'studentName' && typeof editValue === 'string' && editValue.trim() !== '' && editValue !== "Not Specified") {
        setStudentFirstName(editValue.split(' ')[0]);
      }
      setEditingField(null);
      toast({ title: "Details Updated", description: `${editingField.replace(/([A-Z])/g, ' $1').trim()} has been updated.`});
    }
  };

  const handleFinalSaveAndContinue = async () => {
    if (!userId) {
      toast({ title: "Error", description: "User session not found. Please restart.", variant: "destructive" });
      return;
    }
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    if (!extractedData || Object.values(extractedData).some(val => val === "Not Specified" || val === "")) {
      toast({ title: "Incomplete Details", description: "Please ensure all offer letter details are filled or corrected.", variant: "destructive" });
      return;
    }

    // If the manual admission form is displayed (rare edge-case), ensure required fields are filled.
    if (showAdmissionForm && (!universityName.trim() || !courseName.trim() || !country.trim() || !degree.trim())) {
      toast({ title: "Incomplete Form", description: "Please fill in all admission details.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    let uploadedOfferLetterUrl: string | null = null;

    if (offerLetterFile) {
        const uploadResult = await uploadFileToStorage(userId, offerLetterFile, `offer_letter/${offerLetterFile.name}`);
        if (uploadResult.success && uploadResult.downloadURL) {
            uploadedOfferLetterUrl = uploadResult.downloadURL;
        } else {
            toast({ title: "Offer Letter Upload Failed", description: uploadResult.error || "Could not upload offer letter file.", variant: "destructive" });
            setIsUploading(false);
            return;
        }
    }

    const admissionDataToSave = {
      ...extractedData,
      universityName: universityName || extractedData.universityName,
      courseName: courseName || extractedData.courseName,
      country: country,
      degreeLevel: degree,
      offerLetterUrl: uploadedOfferLetterUrl || undefined, // Convert null to undefined for type safety
      consentTimestamp: currentTime,
    };

    const result = await saveUserApplicationData(userId, {
        admissionKyc: admissionDataToSave,
        hasOfferLetter: true // Since this function is for "Yes" path
    });
    setIsUploading(false);

    if (result.success) {
        localStorage.setItem('hasOfferLetterStatus', 'true');
        toast({ title: "Admission Details Saved!", description: "Proceeding to Personal KYC." });
        router.push('/loan-application/personal-kyc'); // Corrected Navigation
    } else {
        toast({ title: "Save Failed", description: result.error || "Could not save admission details.", variant: "destructive"});
    }
  };

  const handleNoOfferLetter = async () => {
    setHasOfferLetter(false); // Update local state
     if (!userId) {
      toast({ title: "Error", description: "User session not found. Please restart.", variant: "destructive" });
      return;
    }
    setIsUploading(true); // To disable buttons if needed
    const result = await saveUserApplicationData(userId, { hasOfferLetter: false });
    setIsUploading(false);
    if (result.success) {
        localStorage.setItem('hasOfferLetterStatus', 'false');
        localStorage.removeItem('admissionKycData'); // Clear any potentially saved admission data
        toast({ title: "Okay", description: "Proceeding to Personal KYC." });
        router.push('/loan-application/personal-kyc');
    } else {
         toast({ title: "Save Failed", description: result.error || "Could not update status.", variant: "destructive"});
    }
  };

  const handleYesClick = () => {
    // User has an offer letter; skip manual admission details and directly prompt for upload
    setHasOfferLetter(true);
    setShowAdmissionForm(false); // skip the extra form step
    setAvekaMessage("Great! Please upload your offer letter so I can extract the details for you.");
  };

  const handleAdmissionFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityName.trim() || !courseName.trim() || !country.trim() || !degree.trim()) {
      setFormError('All fields are required');
      return;
    }
    setFormError('');
    setShowAdmissionForm(false);
    setAvekaMessage("Excellent! Now please upload a clear IMAGE (JPG, PNG) of your offer letter or take a picture. Other document types like PDF, DOC, or TXT are also accepted, but images work best for AI extraction.");
  };

  const renderInitialQuestion = () => (
    <div className="text-center">
      {!showAdmissionForm ? (
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={handleYesClick} 
              size="lg" 
              className="gradient-border-button" 
              disabled={isUploading}
            >
              Yes, I have it
            </Button>
            <Button 
              onClick={handleNoOfferLetter} 
              size="lg" 
              variant="outline" 
              className="bg-white text-black hover:bg-gray-100" 
              disabled={isUploading}
            >
              No, not yet
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleAdmissionFormSubmit} className="space-y-4 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="universityName" className="text-white">University Name *</Label>
              <Input
                id="universityName"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder="Enter university name"
                className="bg-white/10 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-white">Course Name *</Label>
              <Input
                id="courseName"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Enter course name"
                className="bg-white/10 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-white">Country *</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter country"
                className="bg-white/10 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="degree" className="text-white">Degree Level *</Label>
              <select
                id="degree"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-600 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <option value="">Select degree level</option>
                <option value="Masters">Masters</option>
                <option value="Diploma">Diploma</option>
                <option value="Under-Graduation">Under-Graduation</option>
              </select>
            </div>
          </div>
          {formError && (
            <p className="text-red-400 text-sm">{formError}</p>
          )}
          <Button 
            type="submit" 
            className="gradient-border-button mt-4"
            disabled={isUploading}
          >
            Continue to Upload Offer Letter
          </Button>
        </form>
      )}
    </div>
  );

  const renderFileUpload = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Button onClick={() => fileInputRef.current?.click()} size="lg" className="gradient-border-button w-full sm:w-auto" disabled={isUploading || isProcessingLetter}>
          <UploadCloud className="mr-2 h-5 w-5" /> Upload Document
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/jpeg,image/png,.pdf,.doc,.docx,.txt" />
        <Button onClick={() => setShowCamera(true)} size="lg" className="gradient-border-button w-full sm:w-auto" disabled={isUploading || isProcessingLetter}>
          <Camera className="mr-2 h-5 w-5" /> Take Picture
        </Button>
      </div>
      {offerLetterFile && (
        <div className="mt-6 p-4 border border-gray-600 rounded-lg bg-gray-700/30 max-w-md mx-auto">
          <h3 className="font-semibold mb-2 text-center text-white">Preview/Status:</h3>
          {offerLetterPreview && offerLetterFile.type.startsWith('image/') ? (
            <Image src={offerLetterPreview} alt="Offer Letter Preview" width={400} height={500} className="rounded-md mx-auto max-h-[500px] object-contain" data-ai-hint="document offer letter" />
          ) : offerLetterPreview && !offerLetterFile.type.startsWith('image/') && offerLetterFile.type !== 'text/plain' ? (
            <p className="text-center text-sm text-white">Uploaded: {offerLetterFile?.name} (Preview not available for this type. AI will attempt to process.)</p>
          ) : offerLetterTextContent ? (
            <div className="bg-gray-800 p-3 rounded-md max-h-60 overflow-y-auto">
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{offerLetterTextContent.substring(0,500)}{offerLetterTextContent.length > 500 ? "..." : ""}</p>
            </div>
          ) : (
            <p className="text-center text-sm text-white">Uploaded: {offerLetterFile?.name} ({offerLetterFile?.type})</p>
          )}
        </div>
      )}
       {showCamera && (
        <div className="mt-6 p-4 border border-gray-600 rounded-lg bg-gray-700/30 max-w-md mx-auto">
            <h3 className="font-semibold mb-2 text-center text-white">Camera View</h3>
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden"></canvas>
            { !(hasCameraPermission === false) && (
                 <div className="mt-4 flex justify-center">
                    <Button onClick={handleCaptureImage} size="default" className="gradient-border-button">Capture Image</Button>
                </div>
            )}
            { hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                        Please enable camera permissions in your browser settings to use this feature.
                    </AlertDescription>
                </Alert>
            )}
        </div>
      )}
    </div>
  );

  const renderExtractedDataTable = () => {
    if (!extractedData) return null;
    const dataEntries = Object.entries(extractedData) as [keyof ExtractOfferLetterOutput, string | number | boolean | undefined][];

    return (
      <div className="space-y-6">
         {isProcessingLetter && (
            <div className="mt-4 flex flex-col items-center text-white">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <p>Extracting details, please wait...</p>
            </div>
          )}
        <Table className="bg-white/10 rounded-md">
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
                  {editingField === key ? (
                    <Input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-white/80 text-black"
                    />
                  ) : (
                    String(value !== undefined && value !== null && String(value).trim() !== '' ? value : 'Not Specified')
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingField === key ? (
                    <Button onClick={handleSaveEdit} size="sm" className="gradient-border-button">
                      <Save className="mr-1 h-4 w-4" /> Save
                    </Button>
                  ) : (
                    <Button onClick={() => handleEditField(key, String(value !== undefined ? value : ''))} size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white">
                      <Edit3 className="mr-1 h-4 w-4" /> Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {renderConsentSection()}
      </div>
    );
  };

  const renderConsentSection = () => (
    <div className="mt-8 space-y-6 border-t border-gray-500/50 pt-6">
      <div className="flex items-center space-x-2">
        <Checkbox id="consent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
        <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
          I confirm that all the details mentioned above are correct.
        </Label>
      </div>
      <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
      <div className="flex justify-center">
        <Button onClick={handleFinalSaveAndContinue} disabled={!consentChecked || isProcessingLetter || isUploading} size="lg" className="gradient-border-button">
          {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save & Continue'}
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
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.10)] rounded-2xl z-0"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center py-4">
            <Logo />
            {/* Navigation removed as per requirements */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="default" size="sm">Login</Button>
              <Link href="/loan-application/mobile" passHref>

              </Link>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={hasOfferLetter || false} />
          <div className="flex items-center mb-6 mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/mobile')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
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
                        <p className="text-base text-white">
                          {(studentFirstName && typeof studentFirstName === 'string' && studentFirstName.trim() !== '' && extractedData) ?
                           `Thanks, ${studentFirstName}! I've extracted the following details from your offer letter. Please review them carefully.`
                           : avekaMessage }
                        </p>
                    </div>
                </div>

                {hasOfferLetter === null && renderInitialQuestion()}
                {hasOfferLetter === true && showAdmissionForm && !extractedData && renderInitialQuestion()}
                {hasOfferLetter === true && !showAdmissionForm && !extractedData && renderFileUpload()}
                {hasOfferLetter === true && extractedData && renderExtractedDataTable()}

              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

    