
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, Camera, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export default function PersonalKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const { toast } = useToast();
  const router = useRouter();

  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [isIndia, setIsIndia] = useState<boolean | null>(null);
  const [idDocumentType, setIdDocumentType] = useState<"PAN Card" | "National ID">("National ID");

  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);

  const [showPassportSection, setShowPassportSection] = useState(false);

  const idFileInputRef = useRef<HTMLInputElement>(null);
  const passportFileInputRef = useRef<HTMLInputElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCameraFor, setShowCameraFor] = useState<'id' | 'passport' | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    if (typeof window !== 'undefined') {
      const countryValue = localStorage.getItem('selectedCountryValue');
      const isFromIndia = countryValue?.includes('_IN') || false;
      setIsIndia(isFromIndia);
      setIdDocumentType(isFromIndia ? "PAN Card" : "National ID");
    }
    return () => clearTimeout(timer);
  }, []);

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
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'id') {
          setIdDocumentFile(file);
          setIdDocumentPreview(reader.result as string);
          setShowPassportSection(true); 
          toast({ title: `${idDocumentType} Uploaded`, description: "Please proceed to upload your Passport." });
        } else {
          setPassportFile(file);
          setPassportPreview(reader.result as string);
          toast({ title: "Passport Uploaded", description: "You can now proceed to review." });
        }
      };
      reader.readAsDataURL(file);
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
        const capturedFile = new File([dataURLtoBlob(dataUrl)], `${showCameraFor}_capture.png`, { type: 'image/png' });

        if (showCameraFor === 'id') {
          setIdDocumentFile(capturedFile);
          setIdDocumentPreview(dataUrl);
          setShowPassportSection(true);
          toast({ title: `${idDocumentType} Captured`, description: "Please proceed to upload your Passport." });
        } else if (showCameraFor === 'passport') {
          setPassportFile(capturedFile);
          setPassportPreview(dataUrl);
           toast({ title: "Passport Captured", description: "You can now proceed to review." });
        }
        setShowCameraFor(null);
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
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  const handleProceedToReview = () => {
    if (!idDocumentFile || !passportFile) {
      toast({ title: "Documents Missing", description: "Please upload both required documents.", variant: "destructive" });
      return;
    }
    
    // In a real app, you'd convert files to data URIs here to pass to the AI flow on the next page
    // For now, just navigate. The review page will handle fetching/passing data.
    if (typeof window !== 'undefined') {
        localStorage.setItem('idDocumentType', idDocumentType);
        // For simplicity in this step, we'll assume the review page can handle file objects
        // or we'd convert them to data URIs and store in localStorage/pass via router state
        // Example: localStorage.setItem('idDocumentDataUri', idDocumentPreview || '');
        // localStorage.setItem('passportDataUri', passportPreview || '');
    }

    toast({ title: "Proceeding to Review", description: "Let's review your personal details." });
    router.push('/loan-application/review-personal-kyc');
  };

  const renderAvekaMessage = () => {
    let message = "";
    if (!idDocumentFile) {
      message = isIndia === null 
        ? "Let's verify your identity. Please wait while I check your details..." 
        : `Next, I need your ${idDocumentType}. Please upload a clear image or take a picture.`;
    } else if (!passportFile) {
      message = "Great! Now, please upload or take a picture of your Passport.";
    } else {
      message = "Excellent! You've uploaded both documents. Ready to review them?";
    }

    return (
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
            <p className="text-base text-white">{message}</p>
        </div>
      </div>
    );
  };
  
  const renderDocumentUploadSection = (
    docType: 'id' | 'passport',
    title: string,
    file: File | null,
    preview: string | null,
    fileInputRef: React.RefObject<HTMLInputElement>,
    disabled: boolean = false
  ) => (
    <div className={`space-y-4 p-4 border border-gray-600 rounded-lg bg-gray-700/30 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <h3 className="font-semibold text-lg text-center text-white">{title}</h3>
      {preview ? (
        <div className="text-center">
          <Image src={preview} alt={`${title} Preview`} width={200} height={120} className="rounded-md mx-auto object-contain max-h-40" />
          <Button variant="outline" size="sm" onClick={() => docType === 'id' ? (setIdDocumentFile(null), setIdDocumentPreview(null), setShowPassportSection(false)) : (setPassportFile(null), setPassportPreview(null))} className="mt-2 bg-white/20 hover:bg-white/30 text-white">
            Remove {title}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button onClick={() => !disabled && fileInputRef.current?.click()} size="md" className="gradient-border-button w-full sm:w-auto" disabled={disabled}>
            <UploadCloud className="mr-2 h-5 w-5" /> Upload {title}
          </Button>
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, docType)} className="hidden" accept="image/*,.pdf" disabled={disabled} />
          <Button onClick={() => !disabled && setShowCameraFor(docType)} size="md" className="gradient-border-button w-full sm:w-auto" disabled={disabled}>
            <Camera className="mr-2 h-5 w-5" /> Take Picture
          </Button>
        </div>
      )}
    </div>
  );

  if (isIndia === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
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
          
          <div className="flex items-center mb-6">
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/admission-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center text-center">
                {renderAvekaMessage()}

                {renderDocumentUploadSection(
                  'id', 
                  idDocumentType, 
                  idDocumentFile, 
                  idDocumentPreview, 
                  idFileInputRef
                )}

                {showPassportSection && (
                  <div className="mt-6 w-full">
                    {renderDocumentUploadSection(
                      'passport', 
                      'Passport', 
                      passportFile, 
                      passportPreview, 
                      passportFileInputRef
                    )}
                  </div>
                )}

                {showCameraFor && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                      <h3 className="font-semibold mb-4 text-center text-white text-lg">Camera for {showCameraFor === 'id' ? idDocumentType : 'Passport'}</h3>
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
                           <Button onClick={() => setShowCameraFor(null)} variant="outline" className="bg-gray-600 text-white">Cancel</Button>
                           <Button onClick={handleCaptureImage} size="md" className="gradient-border-button">Capture Image</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(idDocumentFile && passportFile) && (
                  <div className="mt-8 flex justify-center">
                    <Button 
                      onClick={handleProceedToReview} 
                      size="lg" 
                      className="gradient-border-button"
                      disabled={!idDocumentFile || !passportFile}
                    >
                      Proceed to Document Review
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
