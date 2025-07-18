
'use client';

import type { ChangeEvent} from 'react';
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
import { extractCoSignatoryIdDetails, type ExtractCoSignatoryIdInput, type ExtractCoSignatoryIdOutput } from '@/ai/flows/extract-co-signatory-id-flow';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { saveUserApplicationData, uploadFileToStorage } from '@/services/firebase-service';

interface CoSignatoryDataToSave {
  coSignatoryChoice?: string | null;
  coSignatoryIdDocumentType?: "PAN Card" | "National ID" | null;
  coSignatoryRelationship?: string | null;
  coSignatoryIdUrl?: string | null; // Firebase Storage URL
  idNumber?: string; // AI Extracted
  idType?: string;   // AI Extracted
  nameOnId?: string; // AI Extracted
  consentTimestamp?: string;
}


export default function CoSignatoryKYCPage() {
  // Navigation removed as per requirements
  const router = useRouter();
  const { toast } = useToast();
  const userId = getOrGenerateUserId();

  const [avekaMessage, setAvekaMessage] = useState("Let's start with co-signatory details. Adding a co-signatory can often improve loan approval chances! For best AI results with ID documents, please upload a clear IMAGE (JPG, PNG). Other formats (PDF, DOC, TXT) are also accepted.");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);

  const [coSignatoryChoice, setCoSignatoryChoice] = useState<string | null>(null);
  const [isIndia, setIsIndia] = useState<boolean | null>(null);
  const [coSignatoryIdDocumentType, setCoSignatoryIdDocumentType] = useState<"PAN Card" | "National ID">("National ID");

  const [coSignatoryIdFile, setCoSignatoryIdFile] = useState<File | null>(null);
  const [coSignatoryIdPreview, setCoSignatoryIdPreview] = useState<string | null>(null); // For image, PDF, DOC Data URI
  const [coSignatoryIdTextContent, setCoSignatoryIdTextContent] = useState<string | null>(null); // For TXT content


  const [coSignatoryRelationship, setCoSignatoryRelationship] = useState<string | null>(null);

  const [isProcessingCoSignatoryId, setIsProcessingCoSignatoryId] = useState(false);
  const [extractedCoSignatoryData, setExtractedCoSignatoryData] = useState<Partial<ExtractCoSignatoryIdOutput>>({});
  const [editingCoSignatoryField, setEditingCoSignatoryField] = useState<keyof ExtractCoSignatoryIdOutput | null>(null);
  const [editCoSignatoryValue, setEditCoSignatoryValue] = useState('');

  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const coSignatoryIdFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
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

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const timerId = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const processCoSignatoryIdAI = async () => {
    if ((!coSignatoryIdPreview && !coSignatoryIdTextContent) || !coSignatoryIdDocumentType || !userId) {
      toast({ title: "Missing Information", description: "Cannot process ID without document content or type.", variant: "destructive"});
      setExtractedCoSignatoryData({ idNumber: "Not Specified", idType: coSignatoryIdDocumentType, nameOnId: "Not Specified"});
      return;
    }

    setIsProcessingCoSignatoryId(true);
    setAvekaMessage(`Processing your co-signatory's ${coSignatoryIdDocumentType}... This might take a moment.`);
    try {
      const input: ExtractCoSignatoryIdInput = {
        coSignatoryIdImageUri: coSignatoryIdPreview,
        coSignatoryIdTextContent: coSignatoryIdTextContent,
        idDocumentType: coSignatoryIdDocumentType
      };
      const result = await extractCoSignatoryIdDetails(input);
      setExtractedCoSignatoryData(result);
      setAvekaMessage("I've extracted details from the co-signatory's ID. Please review them below. You can edit them if needed.");
      toast({ title: "Co-Signatory ID Processed", description: "Please review the extracted details." });
    } catch (error: any) {
      console.error("Error processing co-signatory ID:", error);
      setExtractedCoSignatoryData({ idNumber: "Error - Check Manually", idType: coSignatoryIdDocumentType, nameOnId: "Error - Check Manually"});
      toast({ title: "Co-Signatory ID Extraction Failed", description: error.message || "Could not extract details. Please verify manually.", variant: "destructive" });
      setAvekaMessage("I encountered an issue processing the ID. Please review and fill the details manually if needed.");
    } finally {
      setIsProcessingCoSignatoryId(false);
    }
  };

  useEffect(() => {
    if (coSignatoryChoice === 'yes' && (coSignatoryIdPreview || coSignatoryIdTextContent) && coSignatoryIdDocumentType && Object.keys(extractedCoSignatoryData).length === 0 && !isProcessingCoSignatoryId) {
      processCoSignatoryIdAI();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coSignatoryIdPreview, coSignatoryIdTextContent, coSignatoryChoice, coSignatoryIdDocumentType]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoSignatoryIdFile(file);
      setCoSignatoryIdPreview(null);
      setCoSignatoryIdTextContent(null);
      setExtractedCoSignatoryData({}); // Reset on new file

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoSignatoryIdPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoSignatoryIdTextContent(reader.result as string);
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoSignatoryIdPreview(reader.result as string); // Pass data URI for PDF/DOC
        };
        reader.readAsDataURL(file);
        toast({ title: "Document Uploaded", description: `${file.name} uploaded. AI will attempt to process it. Clear images work best.` });
      } else {
        toast({ title: "Unsupported File", description: "Please upload an image, PDF, DOC, or TXT file.", variant: "destructive"});
        setCoSignatoryIdFile(null);
        return;
      }
      toast({ title: `${coSignatoryIdDocumentType} File Selected!` });
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
    if (videoRef.current && canvasRef.current && showCamera) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCoSignatoryIdFile(new File([dataURLtoBlob(dataUrl)], "co_signatory_id.png", { type: "image/png" }));
        setCoSignatoryIdPreview(dataUrl);
        setCoSignatoryIdTextContent(null);
        toast({ title: `${coSignatoryIdDocumentType} Captured!` });
        setShowCamera(false);
      }
    }
  };

  const handleEditCoSignatoryField = (field: keyof ExtractCoSignatoryIdOutput, currentValue: string | undefined) => {
    setEditingCoSignatoryField(field);
    setEditCoSignatoryValue(currentValue || '');
  };

  const handleSaveCoSignatoryEdit = () => {
    if (editingCoSignatoryField) {
      setExtractedCoSignatoryData(prev => ({ ...prev, [editingCoSignatoryField]: editCoSignatoryValue }));
      setEditingCoSignatoryField(null);
      toast({ title: "Co-Signatory Detail Updated"});
    }
  };

  const isCoSignatoryDataCompleteForSave = () => {
    if (coSignatoryChoice === 'yes') {
      return (coSignatoryIdFile) && // Ensure file is present for upload
             coSignatoryRelationship &&
             consentChecked &&
             !isProcessingCoSignatoryId &&
             Object.keys(extractedCoSignatoryData).length > 0 && // Ensure AI tried to extract
             extractedCoSignatoryData.nameOnId !== "Error - Check Manually" && // Ensure extraction didn't fail critically
             extractedCoSignatoryData.nameOnId?.trim() !== "" && extractedCoSignatoryData.nameOnId !== "Not Specified";
    }
    return coSignatoryChoice === 'no' || coSignatoryChoice === 'addLater';
  };

  const handleSaveAndContinue = async () => {
    if (!userId) {
      toast({ title: "Error", description: "User ID not found. Please refresh.", variant: "destructive" });
      return;
    }
    if (coSignatoryChoice === 'yes' && !consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent for co-signatory details to proceed.", variant: "destructive" });
      return;
    }
    if (coSignatoryChoice === 'yes' && (!coSignatoryIdFile || !coSignatoryRelationship || Object.keys(extractedCoSignatoryData).length === 0 || extractedCoSignatoryData.nameOnId === "Error - Check Manually" || extractedCoSignatoryData.nameOnId?.trim() === "" || extractedCoSignatoryData.nameOnId === "Not Specified")) {
        toast({ title: "Incomplete Details", description: "Please ensure co-signatory ID is uploaded, relationship is selected, and ID details are extracted/verified.", variant: "destructive"});
        return;
    }

    setIsSaving(true);

    let coSignatoryFirebaseUrl: string | undefined = undefined;

    if (coSignatoryChoice === 'yes' && coSignatoryIdFile) {
        const uploadResult = await uploadFileToStorage(userId, coSignatoryIdFile, `co_signatory_id/${coSignatoryIdFile.name}`);
        if (uploadResult.success && uploadResult.downloadURL) {
          coSignatoryFirebaseUrl = uploadResult.downloadURL;
        } else {
          toast({ title: "Co-Signatory ID Upload Failed", description: uploadResult.error || "Could not upload ID.", variant: "destructive" });
          setIsSaving(false);
          return;
        }
    }

    const dataToSave: CoSignatoryDataToSave = {
      coSignatoryChoice,
      coSignatoryIdDocumentType: coSignatoryChoice === 'yes' ? coSignatoryIdDocumentType : null,
      coSignatoryRelationship: coSignatoryChoice === 'yes' ? coSignatoryRelationship : null,
      coSignatoryIdUrl: coSignatoryFirebaseUrl,
      idNumber: coSignatoryChoice === 'yes' ? extractedCoSignatoryData?.idNumber : undefined,
      idType: coSignatoryChoice === 'yes' ? extractedCoSignatoryData?.idType : undefined,
      nameOnId: coSignatoryChoice === 'yes' ? extractedCoSignatoryData?.nameOnId : undefined,
      consentTimestamp: coSignatoryChoice === 'yes' ? currentTime : undefined,
    };

    const result = await saveUserApplicationData(userId, {
      professionalKyc: {
        coSignatory: dataToSave
      }
    });

    setIsSaving(false);

    if(result.success) {
        toast({ title: "Co-Signatory Details Saved!", description: "Proceeding to Work & Employment Details." });
        router.push('/loan-application/work-employment-kyc');
    } else {
        toast({ title: "Save Failed", description: result.error || "Could not save co-signatory details.", variant: "destructive"});
    }
  };

  useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
          setShowCamera(false);
        }
      };
      getCameraPermission();
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [showCamera, toast]);


  const renderCoSignatoryIDTable = () => {
    if (!extractedCoSignatoryData || Object.keys(extractedCoSignatoryData).length === 0 || coSignatoryChoice !== 'yes') return null;

    const validEntries = Object.entries(extractedCoSignatoryData).filter(([_, value]) => value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== 'Not Specified');
    if (isProcessingCoSignatoryId && validEntries.length === 0) { // Show loading if processing and no data yet
        return <div className="mt-4 flex justify-center text-white"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Extracting ID details...</div>;
    }
    if (validEntries.length === 0 && !isProcessingCoSignatoryId) return null; // Don't render empty table if not processing

    const dataEntries = validEntries as [keyof ExtractCoSignatoryIdOutput, string][];

    return (
      <div className="mt-6 space-y-4 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs">
        <h4 className="font-semibold text-md text-center text-white">Extracted Co-Signatory ID Details:</h4>
        {isProcessingCoSignatoryId && <div className="flex justify-center text-white"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</div>}
        <Table className="bg-white/5 rounded-md">
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
                  {editingCoSignatoryField === key ? (
                    <Input type="text" value={editCoSignatoryValue} onChange={(e) => setEditCoSignatoryValue(e.target.value)} className="bg-white/80 text-black" />
                  ) : ( value || "Not Specified" )}
                </TableCell>
                <TableCell className="text-right">
                  {editingCoSignatoryField === key ? (
                    <Button onClick={handleSaveCoSignatoryEdit} size="sm" className="gradient-border-button"><Save className="mr-1 h-4 w-4" /> Save</Button>
                  ) : (
                    <Button onClick={() => handleEditCoSignatoryField(key, value)} size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white"><Edit3 className="mr-1 h-4 w-4" /> Edit</Button>
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
            {/* Navigation removed as per requirements */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="default" size="sm">Login</Button>

            </div>
          </div>
           <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
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

              <div className="space-y-6 p-4 border-0 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs mt-4">
                <h3 className="font-semibold text-lg text-center text-white">Co-Signatory Details</h3>
                <Label className="text-white">Do you want to add a co-signatory? <span className="text-red-400">*</span></Label>
                <RadioGroup value={coSignatoryChoice || ''} onValueChange={(value) => { setCoSignatoryChoice(value); if (value !== 'yes') { setExtractedCoSignatoryData({}); setCoSignatoryIdFile(null); setCoSignatoryIdPreview(null); setCoSignatoryIdTextContent(null); setCoSignatoryRelationship(null); setAvekaMessage("Understood. We'll proceed without co-signatory details for now. You can always add them later if needed."); } else { setAvekaMessage(`Great! Please provide your co-signatory's ${isIndia ? "PAN Card" : "National ID"} and their relationship to you. Upload clear images (JPG, PNG) for best AI results. PDF, DOC, or TXT also accepted.`);} }} className="flex flex-wrap gap-x-4 gap-y-2 text-white">
                  {[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "addLater", label: "Add Later" }
                  ].map(({ value, label }) => (
                    <div key={`cosign-${value}`} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={value}
                        id={`cosign-${value}`}
                        className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <Label htmlFor={`cosign-${value}`}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {coSignatoryChoice === 'yes' && (
                  <div className="space-y-4 mt-4 border-t border-gray-600/20 pt-4">
                    <Label className="text-white">{`Upload Co-signatory's ${coSignatoryIdDocumentType}`} (Image, PDF, DOC, TXT) <span className="text-red-400">*</span></Label>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <Button onClick={() => coSignatoryIdFileInputRef.current?.click()} className="gradient-border-button" disabled={isProcessingCoSignatoryId || isSaving}>
                        <UploadCloud className="mr-2 h-5 w-5" /> Upload {coSignatoryIdDocumentType}
                      </Button>
                      <input type="file" ref={coSignatoryIdFileInputRef} onChange={handleFileChange} className="hidden" accept="image/jpeg,image/png,.pdf,.doc,.docx,.txt" />
                      <Button onClick={() => setShowCamera(true)} className="gradient-border-button" disabled={isProcessingCoSignatoryId || isSaving}>
                        <Camera className="mr-2 h-5 w-5" /> Take Picture
                      </Button>
                    </div>
                     {coSignatoryIdFile && (
                       <div className="text-center mt-2">
                         {coSignatoryIdPreview && coSignatoryIdFile.type.startsWith('image/') ? (
                           <Image src={coSignatoryIdPreview} alt={`${coSignatoryIdDocumentType} Preview`} width={150} height={90} className="rounded-md mx-auto object-contain max-h-32" data-ai-hint="ID document" />
                         ) : coSignatoryIdPreview && !coSignatoryIdFile.type.startsWith('image/') && coSignatoryIdFile.type !== 'text/plain' ? (
                            <p className="text-sm text-gray-300">Uploaded: {coSignatoryIdFile.name} (Preview N/A)</p>
                         ) : coSignatoryIdTextContent ? (
                            <div className="bg-gray-800 p-2 rounded-md max-h-32 overflow-y-auto mt-2"><p className="text-xs text-gray-300 whitespace-pre-wrap">{coSignatoryIdTextContent.substring(0,300)}{coSignatoryIdTextContent.length > 300 ? "..." : ""}</p></div>
                         ) : (
                           <p className="text-sm text-gray-300">Uploaded: {coSignatoryIdFile.name}</p>
                         )}
                       </div>
                    )}

                    {renderCoSignatoryIDTable()}

                    <div>
                      <Label htmlFor="coSignatoryRelationship" className="text-white">Relationship with Co-signatory <span className="text-red-400">*</span></Label>
                      <Select value={coSignatoryRelationship || ''} onValueChange={setCoSignatoryRelationship} disabled={isSaving || isProcessingCoSignatoryId}>
                        <SelectTrigger className="bg-white/80 text-black"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                        <SelectContent className="bg-white text-black">
                          {["Parent", "Sibling", "Spouse", "Family Member", "Friend"].map(rel => (
                            <SelectItem key={rel} value={rel.toLowerCase()} className="hover:bg-gray-100">{rel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-4 space-y-2 border-t border-gray-600/20 pt-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="coSignatoryConsent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" disabled={isSaving}/>
                            <Label htmlFor="coSignatoryConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                                I confirm the co-signatory details provided are correct and I have their consent. <span className="text-red-400">*</span>
                            </Label>
                        </div>
                        <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
                    </div>
                  </div>
                )}
              </div>


              <div className="mt-8 flex justify-center">
                <Button onClick={handleSaveAndContinue} size="lg" className="gradient-border-button" disabled={!isCoSignatoryDataCompleteForSave() || isProcessingCoSignatoryId || isSaving}>
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save & Continue'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {showCamera && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="font-semibold mb-4 text-center text-white text-lg">Camera for {coSignatoryIdDocumentType}</h3>
              <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden"></canvas>
              {hasCameraPermission === false ? (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" /> <AlertTitle>Camera Access Denied</AlertTitle> <AlertDescription>Enable camera permissions.</AlertDescription>
                </Alert>
              ) : (
                <div className="mt-4 flex justify-around">
                  <Button onClick={() => setShowCamera(false)} variant="outline" className="bg-gray-600 text-white">Cancel</Button>
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

    