'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import React from "react";

// Utility function to convert dataURL to File
function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type: mime});
}

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, Camera, AlertCircle, ArrowLeft } from 'lucide-react';
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { uploadFileToStorage } from '@/services/firebase-service';


export default function PersonalKYCPage() {
  // Navigation removed as per requirements
  const { toast } = useToast();
  const router = useRouter();
  const userId = getOrGenerateUserId();

  const [avekaMessage, setAvekaMessage] = useState("");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [avekaPassportPromptVisible, setAvekaPassportPromptVisible] = useState(false);
  const [isIndia, setIsIndia] = useState<boolean | null>(null);
  const [idDocumentType, setIdDocumentType] = useState<"PAN Card" | "National ID">("National ID");

  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
  const [idDocumentTextContent, setIdDocumentTextContent] = useState<string | null>(null);

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [passportTextContent, setPassportTextContent] = useState<string | null>(null);

  const [showPassportSection, setShowPassportSection] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const idFileInputRef = useRef<HTMLInputElement>(null);
  const passportFileInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCameraFor, setShowCameraFor] = useState<'id' | 'passport' | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [backPath, setBackPath] = useState('/loan-application/admission-kyc');


  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    if (typeof window !== 'undefined') {
      const countryValue = localStorage.getItem('selectedCountryValue');
      const isFromIndia = countryValue?.includes('_IN') || false;
      setIsIndia(isFromIndia);
      const docType = isFromIndia ? "PAN Card" : "National ID";
      setIdDocumentType(docType);
      setAvekaMessage(`Next, I need your ${docType}. For best AI results, please upload a clear IMAGE (JPG, PNG). Other formats like PDF, DOC or TXT are also accepted.`);

      const offerLetterStatus = localStorage.getItem('hasOfferLetterStatus');
      if (offerLetterStatus === 'false') {
        setBackPath('/loan-application/admission-kyc');
      } else if (offerLetterStatus === 'true') {
        setBackPath('/loan-application/preferences');
      } else {
        setBackPath('/loan-application/admission-kyc');
      }
    }
    return () => clearTimeout(timer);
  }, []);

   useEffect(() => {
    let shouldUpdate = true;
    
    if (idDocumentFile || idDocumentPreview || idDocumentTextContent) {
      if (!showPassportSection) {
        console.log('Showing passport section and Aveka message');
        setShowPassportSection(true);
        setAvekaMessage(`Thanks for the ${idDocumentType}! Now, please upload your Passport.`);
        // Use a small timeout to ensure state updates are batched
        const timer = setTimeout(() => {
          if (shouldUpdate) {
            setAvekaPassportPromptVisible(true);
          }
        }, 0);
        return () => {
          shouldUpdate = false;
          clearTimeout(timer);
        };
      }
    } else {
      if (showPassportSection) {
        console.log('Hiding passport section and Aveka message');
        setShowPassportSection(false);
        setAvekaPassportPromptVisible(false);
        setAvekaMessage(`Next, I need your ${idDocumentType}. For best AI results, please upload a clear IMAGE (JPG, PNG). Other formats like PDF, DOC or TXT are also accepted.`);
      }
    }

    return () => {
      shouldUpdate = false;
    };
  }, [idDocumentFile, idDocumentPreview, idDocumentTextContent, showPassportSection, idDocumentType]);

  useEffect(() => {
    if (showCameraFor) {
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
          setShowCameraFor(null);
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
  }, [showCameraFor, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'id' | 'passport') => {
    const file = event.target.files?.[0];
    if (file) {
      const setFileState = type === 'id' ? setIdDocumentFile : setPassportFile;
      const setPreviewState = type === 'id' ? setIdDocumentPreview : setPassportPreview;
      const setTextContentState = type === 'id' ? setIdDocumentTextContent : setPassportTextContent;

      setFileState(file);
      setPreviewState(null);
      setTextContentState(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewState(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setTextContentState(reader.result as string);
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewState(reader.result as string);
        };
        reader.readAsDataURL(file);
        toast({ title: `${file.name} Selected`, description: `AI extraction works best with clear images or TXT files for this type.` });
      } else {
        toast({ title: "Unsupported File", description: "Please upload an image, PDF, DOC, or TXT file.", variant: "destructive" });
        setFileState(null);
        return;
      }

      if (type === 'id') {
        // setShowPassportSection(true); // This is now handled by useEffect
        // setAvekaMessage(`Thanks for the ${idDocumentType}! Now, please upload your Passport.`);
        toast({ title: `${idDocumentType} Selected`, description: `The Passport section is now visible below. Please upload your Passport.` });
      } else {
        setAvekaMessage("Excellent! You've selected both documents. Ready to review them and let AI extract the details?");
        toast({ title: "Passport Selected", description: "Excellent! You can now proceed to review your documents." });
      }
    }
  };

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current && showCameraFor) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const capturedFile = dataURLtoFile(dataUrl, `${showCameraFor}_capture`);
        if (showCameraFor === 'id') {
          setIdDocumentFile(capturedFile);
          setIdDocumentPreview(dataUrl);
        } else {
          setPassportFile(capturedFile);
          setPassportPreview(dataUrl);
        }
      }
    }
  };

  const handleProceedToReview = async () => {
    setIsUploading(true);
    const idFileToUpload = idDocumentFile || (idDocumentPreview ? dataURLtoFile(idDocumentPreview, 'id_capture') : null);
    const passportFileToUpload = passportFile || (passportPreview ? dataURLtoFile(passportPreview, 'passport_capture') : null);

    if (idFileToUpload) {
      const idUploadResult = await uploadFileToStorage(userId, idFileToUpload, `id/${(idFileToUpload.name)}`);
      if (idUploadResult.success && idUploadResult.downloadURL) {
        const idDocFirebaseUrl = idUploadResult.downloadURL;
        if (passportFileToUpload) {
          const passportUploadResult = await uploadFileToStorage(userId, passportFileToUpload, `passport/${(passportFileToUpload.name)}`);
          if (passportUploadResult.success && passportUploadResult.downloadURL) {
            const passportFirebaseUrl = passportUploadResult.downloadURL;
            // Store data URIs for AI if they exist (image/pdf/doc), or text content for TXT
            localStorage.setItem('personalDocsForReview', JSON.stringify({
              idDocumentDataUri: idDocumentFile?.type === 'text/plain' ? null : idDocumentPreview,
              idDocumentTextContent: idDocumentTextContent,
              passportDataUri: passportFile?.type === 'text/plain' ? null : passportPreview,
              passportTextContent: passportTextContent,
              idDocumentType: idDocumentType,
              idDocumentFirebaseUrl: idDocFirebaseUrl,
              passportFirebaseUrl: passportFirebaseUrl,
            }));

            toast({ title: "Proceeding to Review", description: "Let's review your personal details." });
            router.push('/loan-application/review-personal-kyc');
          } else {
            toast({ title: "Passport Upload Failed", description: passportUploadResult.error || "Could not upload Passport. Check console for details. (Possible CORS issue on Firebase Storage)", variant: "destructive" });
            setIsUploading(false);
            return;
          }
        }
      } else {
        toast({ title: "ID Upload Failed", description: idUploadResult.error || "Could not upload ID. Check console for details. (Possible CORS issue on Firebase Storage)", variant: "destructive" });
        setIsUploading(false);
        return;
      }
    }
  };

  const renderPrimaryAvekaMessage = () => (
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
                        transform transition-all duration-500 ease-out
                        ${avekaMessageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <p className="font-semibold text-lg mb-1 text-white">Aveka</p>
        <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
        <p className="text-base text-white">{avekaMessage}</p>
      </div>
    </div>
  );

  const AvekaPassportPromptComponent = () => {
    // Only render if the passport prompt should be visible
    if (!avekaPassportPromptVisible) return null;

    return (
      <div className="my-6 flex flex-col items-center md:flex-row md:items-start md:space-x-4 w-full">
        <div className="flex-shrink-0 mb-3 md:mb-0">
          <Image
            src="/images/aveka.png"
            alt="Aveka, GlobCred's Smart AI"
            width={50}
            height={50}
            className="rounded-full border-2 border-white shadow-md"
            data-ai-hint="robot avatar"
            priority
          />
        </div>
        <div className="bg-[hsl(var(--card)/0.45)] backdrop-blur-xs p-4 rounded-lg shadow-sm text-left md:flex-grow">
          <p className="font-semibold text-lg mb-1 text-white">Aveka</p>
          <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
          <p className="text-base text-white">
            Thanks! Now, please upload or take a picture of your Passport. Clear JPG, PNG images work best for AI. PDF, DOC, or TXT files are also accepted.
          </p>
        </div>
      </div>
    );
  };

  const renderDocumentUploadSection = (
    docType: 'id' | 'passport',
    title: string,
    file: File | null,
    preview: string | null,
    textContent: string | null,
    fileInputRef: React.RefObject<HTMLInputElement> | null,
    disabled: boolean = false
  ) => (
    <div className={`space-y-4 p-4 border border-gray-600/30 rounded-lg bg-[hsl(var(--card)/0.15)] backdrop-blur-xs ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <h3 className="font-semibold text-lg text-center text-white">{title}</h3>
      {(preview || textContent || file) ? (
        <div className="text-center">
          {preview && file?.type.startsWith("image/") && (
            <Image src={preview} alt={`${title} Preview`} width={200} height={120} className="rounded-md mx-auto object-contain max-h-40" data-ai-hint="document ID passport" />
          )}
          {preview && !file?.type.startsWith("image/") && file?.type !== 'text/plain' && (
            <p className="text-sm text-gray-300 mt-2">Uploaded: {file?.name} (Preview not available for this type)</p>
          )}
          {textContent && file?.type === 'text/plain' && (
            <div className="bg-gray-800 p-2 rounded-md max-h-32 overflow-y-auto mt-2">
              <p className="text-xs text-gray-300 whitespace-pre-wrap">{textContent.substring(0, 300)}{textContent.length > 300 ? "..." : ""}</p>
            </div>
          )}
          {file && !preview && !textContent && <p className="text-sm text-gray-300 mt-2">Uploaded: {file.name}</p>}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (docType === 'id') {
                setIdDocumentFile(null); setIdDocumentPreview(null); setIdDocumentTextContent(null);
                // setShowPassportSection(false); // Handled by useEffect now
                // setAvekaPassportPromptVisible(false);
                setAvekaMessage(`Next, I need your ${idDocumentType}. Please upload a clear image, PDF, DOC or TXT file...`);
              } else {
                setPassportFile(null); setPassportPreview(null); setPassportTextContent(null);
                setAvekaMessage("Got it. Now please upload your passport again or take a picture.");
              }
            }}
            className="mt-2 bg-white/20 hover:bg-white/30 text-white"
            disabled={isUploading}
          >
            Remove {file?.name || title}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button onClick={() => !disabled && fileInputRef?.current?.click()} className="gradient-border-button w-auto" disabled={isUploading || disabled}>
            <UploadCloud className="mr-2 h-5 w-5" /> Upload {title}
          </Button>
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, docType)} className="hidden" accept="image/jpeg,image/png,image/jpg,image/heic,image/heif,image/webp,image/pef,.pdf,.doc,.docx,.txt" disabled={disabled || isUploading} />
          <Button onClick={() => !disabled && setShowCameraFor(docType)} className="gradient-border-button w-auto" disabled={isUploading || disabled}>
            <Camera className="mr-2 h-5 w-5" /> Take Picture
          </Button>
        </div>
      )}
    </div>
  );

  if (isIndia === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(var(--background))]">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <p className="text-white mt-4">Loading personal details setup...</p>
      </div>
    );
  }

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
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
          <div className="flex items-center mb-6 mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push(backPath)} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center text-center">
                {renderPrimaryAvekaMessage()}

                {renderDocumentUploadSection(
                  'id',
                  idDocumentType,
                  idDocumentFile,
                  idDocumentPreview,
                  idDocumentTextContent,
                  idFileInputRef as React.RefObject<HTMLInputElement> | null
                )}

                {showPassportSection && (idDocumentPreview || idDocumentTextContent || idDocumentFile) && (
                  <div className="mt-6 w-full">
                    <AvekaPassportPromptComponent />
                  </div>
                )}

                {showPassportSection && (
                  <div className="mt-6 w-full">
                    <AvekaPassportPromptComponent />
                    {renderDocumentUploadSection(
                      'passport',
                      'Passport',
                      passportFile,
                      passportPreview,
                      passportTextContent,
                      passportFileInputRef as React.RefObject<HTMLInputElement> | null,
                      !(idDocumentFile || idDocumentPreview || idDocumentTextContent) // Disable passport if ID doc is not yet provided
                    )}
                  </div>
                )}


                {showCameraFor && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                      <h3 className="font-semibold mb-4 text-center text-white text-lg">Camera for {showCameraFor === 'id' ? idDocumentType : 'Passport'}</h3>
                      <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline/>
                      <canvas ref={canvasRef} className="hidden"></canvas>
                      {hasCameraPermission === false ? (
                          <Alert variant="destructive" className="mt-4">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Camera Access Denied</AlertTitle>
                              <AlertDescription>Enable camera permissions in browser settings.</AlertDescription>
                          </Alert>
                      ) : (
                        <div className="mt-4 flex justify-around">
                           <Button onClick={() => setShowCameraFor(null)} variant="outline" className="bg-gray-600 text-white">Cancel</Button>
                           <Button onClick={handleCaptureImage} className="gradient-border-button">Capture Image</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(idDocumentFile || idDocumentPreview || idDocumentTextContent) && (passportFile || passportPreview || passportTextContent) && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleProceedToReview}
                      size="lg"
                      className="gradient-border-button"
                      disabled={isUploading}
                    >
                      {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Proceed to Document Review'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
