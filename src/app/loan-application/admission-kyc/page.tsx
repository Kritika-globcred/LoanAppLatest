
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


export default function AdmissionKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const { toast } = useToast();
  const router = useRouter();

  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [studentFirstName, setStudentFirstName] = useState<string | null>(null);

  const [hasOfferLetter, setHasOfferLetter] = useState<boolean | null>(null);
  const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);
  const [offerLetterPreview, setOfferLetterPreview] = useState<string | null>(null);

  const [isProcessingLetter, setIsProcessingLetter] = useState(false);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setOfferLetterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        fetch(dataUrl).then(res => res.blob()).then(blob => {
          setOfferLetterFile(new File([blob], "camera_capture.png", { type: "image/png" }));
        });
        setShowCamera(false);
      }
    }
  };

  const processOfferLetter = async () => {
    if (!offerLetterPreview) {
      toast({ title: "No Offer Letter", description: "Please upload or capture your offer letter.", variant: "destructive" });
      return;
    }
    setIsProcessingLetter(true);
    setExtractedData(null);
    try {
      const input: ExtractOfferLetterInput = { offerLetterImageUri: offerLetterPreview };
      const result = await extractOfferLetterDetails(input);
      setExtractedData(result);
      if (result && typeof result.studentName === 'string' && result.studentName.trim() !== '') {
        setStudentFirstName(result.studentName.split(' ')[0]);
      } else {
        setStudentFirstName(null);
      }
      toast({ title: "Information Extracted", description: "Please review the details below." });
    } catch (error) {
      console.error("Error processing offer letter:", error);
      toast({ title: "Extraction Failed", description: "Could not extract details from the offer letter. Please ensure it's a clear image.", variant: "destructive" });
    } finally {
      setIsProcessingLetter(false);
    }
  };

  useEffect(() => {
    if (offerLetterPreview && !extractedData && !isProcessingLetter) {
      processOfferLetter();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerLetterPreview]);

  const handleEditField = (field: keyof ExtractOfferLetterOutput, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (extractedData && editingField) {
      const newData = { ...extractedData, [editingField]: editValue };
      setExtractedData(newData);
      if (editingField === 'studentName' && typeof editValue === 'string' && editValue.trim() !== '') {
        setStudentFirstName(editValue.split(' ')[0]);
      }
      setEditingField(null);
      toast({ title: "Details Updated", description: `${editingField.replace(/([A-Z])/g, ' $1').trim()} has been updated.`});
    }
  };

  const handleFinalSaveAndContinue = () => {
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    console.log("Admission KYC Data:", extractedData);
    console.log("Consent given at:", currentTime);
    toast({ title: "Step 1 Complete!", description: "Moving to Personal KYC." });
    router.push('/loan-application/personal-kyc');
  };

  const handleNoOfferLetter = () => {
    setHasOfferLetter(false);
    toast({ title: "Okay", description: "Proceeding to Personal KYC." });
    router.push('/loan-application/personal-kyc');
  };

  const renderInitialQuestion = () => (
    <div className="text-center">
      <div className="flex justify-center space-x-4">
        <Button onClick={() => setHasOfferLetter(true)} size="lg" className="gradient-border-button">Yes, I have it</Button>
        <Button onClick={handleNoOfferLetter} size="lg" variant="outline" className="bg-white text-black hover:bg-gray-100">No, not yet</Button>
      </div>
    </div>
  );

  const renderFileUpload = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Button onClick={() => fileInputRef.current?.click()} size="lg" className="gradient-border-button w-full sm:w-auto">
          <UploadCloud className="mr-2 h-5 w-5" /> Upload Document
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" />
        <Button onClick={() => setShowCamera(true)} size="lg" className="gradient-border-button w-full sm:w-auto">
          <Camera className="mr-2 h-5 w-5" /> Take Picture
        </Button>
      </div>
      {offerLetterPreview && (
        <div className="mt-6 p-4 border border-gray-600 rounded-lg bg-gray-700/30 max-w-md mx-auto">
          <h3 className="font-semibold mb-2 text-center text-white">Preview:</h3>
          {offerLetterFile?.type.startsWith('image/') ? (
            <Image src={offerLetterPreview} alt="Offer Letter Preview" width={400} height={500} className="rounded-md mx-auto max-h-[500px] object-contain" />
          ) : (
            <p className="text-center text-sm text-white">Preview for {offerLetterFile?.name} (Non-image file)</p>
          )}
          {isProcessingLetter && (
            <div className="mt-4 flex flex-col items-center text-white">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <p>Extracting details, please wait...</p>
            </div>
          )}
        </div>
      )}
       {showCamera && (
        <div className="mt-6 p-4 border border-gray-600 rounded-lg bg-gray-700/30 max-w-md mx-auto">
            <h3 className="font-semibold mb-2 text-center text-white">Camera View</h3>
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
            <canvas ref={canvasRef} className="hidden"></canvas>
            { !(hasCameraPermission === false) && (
                 <div className="mt-4 flex justify-center">
                    <Button onClick={handleCaptureImage} size="md" className="gradient-border-button">Capture Image</Button>
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
        <Button onClick={handleFinalSaveAndContinue} disabled={!consentChecked || isProcessingLetter} size="lg" className="gradient-border-button">
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
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.50)] rounded-2xl z-0"></div>

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

          <div className="flex items-center mb-6 mt-4"> {/* Added mt-4 for spacing below progress bar */}
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/mobile')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex flex-col items-center md:flex-row md:items-start md:space-x-4">
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
                                    transform transition-all duration-500 ease-out
                                    ${avekaMessageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    >
                        <p className="font-semibold text-lg mb-1 text-white">Aveka</p>
                        <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
                        {hasOfferLetter === null && !extractedData && (
                           <p className="text-base text-white">
                             {(studentFirstName && typeof studentFirstName === 'string' && studentFirstName.trim() !== '') ? `Hi ${studentFirstName}! ` : "Hi there! "}
                             Let's start with your admission details. Do you have your academic offer letter handy?
                           </p>
                        )}
                        {hasOfferLetter === true && !extractedData && !isProcessingLetter && !offerLetterPreview && (
                            <p className="text-base text-white">
                                Excellent! Please upload your offer letter or take a picture of it. For best results with AI extraction, please provide a clear image (JPG, PNG).
                            </p>
                        )}
                        {hasOfferLetter === true && offerLetterPreview && !extractedData && isProcessingLetter && (
                            <p className="text-base text-white">
                                Great! I'm currently analyzing your offer letter. This might take a few moments...
                            </p>
                        )}
                         {extractedData && (
                            <p className="text-base text-white">
                                Thanks, {(studentFirstName && typeof studentFirstName === 'string' && studentFirstName.trim() !== '') ? studentFirstName : "there"}! I've extracted the following details from your offer letter. Please review them carefully.
                            </p>
                        )}
                    </div>
                </div>

                {hasOfferLetter === null && renderInitialQuestion()}
                {hasOfferLetter === true && !extractedData && renderFileUpload()}
                {hasOfferLetter === true && extractedData && renderExtractedDataTable()}

              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
