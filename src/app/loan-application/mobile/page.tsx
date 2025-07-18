'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { saveUserApplicationData, checkUserExistsByMobile } from '@/services/firebase-service';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { serverTimestamp, Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import { sendOTP, verifyOTP } from '@/services/wati-service';

interface CountryInfo {
  value: string;
  label: string;
  countryShortName: string;
  dialCode: string;
}

const defaultCountryCodes: CountryInfo[] = [
  { value: '+91_IN', label: 'IN (+91)', countryShortName: 'IN', dialCode: '+91' },
  { value: '+233_GH', label: 'GH (+233)', countryShortName: 'GH', dialCode: '+233' },
  { value: '+234_NG', label: 'NG (+234)', countryShortName: 'NG', dialCode: '+234' },
  { value: '+263_ZW', label: 'ZW (+263)', countryShortName: 'ZW', dialCode: '+263' },
  { value: '+254_KE', label: 'KE (+254)', countryShortName: 'KE', dialCode: '+254' },
  { value: '+256_UG', label: 'UG (+256)', countryShortName: 'UG', dialCode: '+256' },
];

const globalCountryCodesSample: CountryInfo[] = [
  { value: '+1_US', label: 'US (+1)', countryShortName: 'US', dialCode: '+1' },
  { value: '+1_CA', label: 'CA (+1)', countryShortName: 'CA', dialCode: '+1' },
  { value: '+44_GB', label: 'GB (+44)', countryShortName: 'GB', dialCode: '+44' },
  { value: '+61_AU', label: 'AU (+61)', countryShortName: 'AU', dialCode: '+61' },
  { value: '+49_DE', label: 'DE (+49)', countryShortName: 'DE', dialCode: '+49' },
  { value: '+33_FR', label: 'FR (+33)', countryShortName: 'FR', dialCode: '+33' },
];

export default function MobileVerificationPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [countryCode, setCountryCode] = useState(defaultCountryCodes[0].value);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [applicationType, setApplicationType] = useState('loan'); // Default to 'loan'
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Get application type from URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') || 'loan';
      setApplicationType(type);
    }
  }, []);

  useEffect(() => {
    const id = getOrGenerateUserId();
    setUserId(id);
    console.log(`[Mobile Page] User ID set: ${id}`);
    const timer = setTimeout(() => {
      setAvekaMessageVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGetOtpClick = async () => {
    console.log('[DEBUG] handleGetOtpClick called');
    
    if (!mobileNumber.trim() || !/^\d{7,15}$/.test(mobileNumber.trim())) {
      console.log('[DEBUG] No valid mobile number provided');
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number (7-15 digits).",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    setOtpError('');
    
    try {
      console.log('[DEBUG] Setting loading to true');
      const selectedCountry = [...defaultCountryCodes, ...globalCountryCodesSample].find(c => c.value === countryCode);
      const fullPhoneNumber = `${selectedCountry?.dialCode}${mobileNumber}`.replace(/\+/g, '');
      
      console.log('[DEBUG] Calling sendOTP with:', fullPhoneNumber);
      
      // Add a timeout to catch if the promise never resolves
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OTP request timed out')), 10000)
      );
      
      // Call sendOTP with timeout and proper error handling
      let result;
      try {
        result = await Promise.race([
          sendOTP(fullPhoneNumber),
          timeoutPromise
        ]) as Awaited<ReturnType<typeof sendOTP>>;
      } catch (error) {
        console.error('Error in OTP sending promise:', error);
        result = {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to send OTP',
          isRetryable: true,
          error: {
            name: error instanceof Error ? error.name : 'UnknownError',
            message: error instanceof Error ? error.message : 'An unknown error occurred',
            ...(error instanceof Error && error instanceof Object ? error : {})
          }
        };
      }
      
      console.log('[DEBUG] OTP Send Result:', result);
      
      if (result.success) {
        setOtpSent(true);
        // Start 5-minute countdown
        setCountdown(300);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast({
          title: "OTP Sent!",
          description: `A 4-digit OTP has been sent to your WhatsApp number.`,
        });
      } else {
        // Log the full error for debugging
        const errorDetails = result.error 
          ? `${result.error.name} (${result.error.status || 'no-status'}): ${result.error.message}`
          : result.message;
        
        console.error('OTP Send Error:', errorDetails, result);
        
        // Default error message
        let errorMessage = 'Failed to send OTP. Please try again.';
        let isRetryable = result.isRetryable !== false; // Default to true if not specified
        
        // Handle specific error cases
        if (result.error) {
          const { name, message, status } = result.error;
          
          switch (name) {
            case 'WATIServerError':
              errorMessage = 'Temporary service issue. Please try again in a few minutes.';
              isRetryable = true;
              break;
            case 'AbortError':
              errorMessage = 'Request timed out. Please check your connection and try again.';
              isRetryable = true;
              break;
            case 'TypeError':
              errorMessage = 'Network error. Please check your internet connection.';
              isRetryable = true;
              break;
            case 'ParseError':
              errorMessage = 'Error processing response from OTP service.';
              isRetryable = true;
              break;
            default:
              if (status === 429) {
                errorMessage = 'Too many requests. Please wait before requesting another OTP.';
                isRetryable = true;
              } else if (status === 401) {
                errorMessage = 'Authentication failed. Please contact support.';
                isRetryable = false;
              } else if (status === 400) {
                errorMessage = 'Invalid phone number format. Please check and try again.';
                isRetryable = true;
              } else if (message) {
                errorMessage = message;
              }
          }
        }
        
        const toastConfig = {
          title: "Failed to send OTP",
          description: errorMessage,
          variant: "destructive" as const,
          action: isRetryable ? (
            <ToastAction 
              altText="Try again" 
              onClick={() => handleGetOtpClick()}
            >
              Try Again
            </ToastAction>
          ) : undefined,
        };
        
        toast(toastConfig);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!enteredOtp || enteredOtp.length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP');
      return;
    }

    setIsVerifying(true);
    setOtpError('');
    
    try {
      const selectedCountry = [...defaultCountryCodes, ...globalCountryCodesSample].find(c => c.value === countryCode);
      const fullPhoneNumber = `${selectedCountry?.dialCode}${mobileNumber}`.replace(/\+/g, '');
      
      const verification = await verifyOTP(fullPhoneNumber, enteredOtp);
      
      if (!verification.success) {
        setOtpError(verification.message || 'Invalid OTP');
        return;
      }
      
      // Only proceed with saving if OTP is verified
      let nextStep = '/loan-application/admission-kyc';
      if (applicationType === 'study' || applicationType === 'work') {
        // Skip admission KYC for study and work applications
        nextStep = '/loan-application/personal-kyc';
      }

      const selectedCountryInfo = [...defaultCountryCodes, ...globalCountryCodesSample].find(c => c.value === countryCode);
      const formattedMobile = mobileNumber.trim();
      const dialCode = selectedCountryInfo?.dialCode || '';
      
      // Check if user exists by mobile number and country code
      const checkResult = await checkUserExistsByMobile(formattedMobile, dialCode);
      let resolvedUserId = checkResult?.success && checkResult.exists && checkResult.userId 
        ? checkResult.userId 
        : userId || getOrGenerateUserId(); // Ensure we always have a valid userId

      const initialData = {
        userId: resolvedUserId,
        mobileNumber: formattedMobile,
        countryCode: dialCode,
        countryShortName: selectedCountryInfo?.countryShortName,
        createdAt: serverTimestamp() as Timestamp,
        applicationType: applicationType as 'loan' | 'study' | 'work',
        mobileVerified: true,
        mobileVerificationDate: serverTimestamp() as Timestamp
      };

      const result = await saveUserApplicationData(resolvedUserId, initialData);
      
      if (result.success) {
        // Store userId for session continuity
        const finalUserId = result.userId || resolvedUserId;
        if (finalUserId) {
          setUserId(finalUserId);
          if (typeof window !== 'undefined') {
            localStorage.setItem('userId', finalUserId);
          }
          
          // Store mobile verification status
          localStorage.setItem('mobileVerified', 'true');
          localStorage.setItem('selectedCountryValue', countryCode);
          
          toast({
            title: "Mobile Verified!",
            description: "Proceeding to the next step.",
          });
          
          // Navigate after a short delay
          setTimeout(() => {
            try {
              router.push(nextStep);
            } catch (navError) {
              console.error("Navigation error:", navError);
              toast({
                title: "Navigation Error",
                description: "Could not navigate to the next page. Please try again.",
                variant: "destructive",
              });
            } finally {
              setIsSaving(false);
              setIsVerifying(false);
            }
          }, 100);
        }
      } else {
        throw new Error(result.error || "Failed to save user data");
      }
    } catch (error: any) {
      console.error("Error in handleSaveAndContinue:", error);
      toast({
        title: "Error",
        description: error?.message || "An error occurred during verification.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsVerifying(false);
    }
  };

  const handleGoBackToMobileEntry = () => {
    setOtpSent(false);
    setEnteredOtp('');
    setOtpError('');
  };
  
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <section
        className="relative w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] pt-[5px] px-6 pb-6 md:px-8 md:pb-8 overflow-hidden shadow-[5px_5px_10px_hsl(0,0%,0%/0.2)] shadow-[inset_0_0_2px_hsl(var(--primary)/0.8)]"
        style={{
          backgroundImage:
            "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Untitled%20design.png')",
        }}
      >
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.10)] rounded-2xl z-0 backdrop-blur-lg"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center justify-between w-full">
              <Logo />
              <div className="flex items-center space-x-2 md:space-x-4">
                <Button variant="default" size="sm">Login</Button>
              </div>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} />

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
                        <p className="text-base text-white">
                          {otpSent 
                            ? `We've sent a 4-digit verification code to your WhatsApp number. Please enter it below.`
                            : "Awesome! Let's get started with your application. We'll verify your mobile number via WhatsApp. Make sure it's active on WhatsApp! (Don't worry, we don't spam)"
                          }
                        </p>
                    </div>
                </div>

                {!otpSent ? (
                  <div className="w-full space-y-6">
                    <div className="grid grid-cols-[auto_1fr] gap-4 items-end">
                      <div>
                        <Label htmlFor="countryCode" className="block text-sm font-medium text-left mb-1 text-white">Code</Label>
                        <Select value={countryCode} onValueChange={setCountryCode} disabled={isSaving}>
                          <SelectTrigger id="countryCode" className="w-auto bg-white text-black placeholder:text-gray-500 border-gray-300 focus:ring-ring focus:border-ring">
                            <SelectValue placeholder="Select code" />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-black">
                            <SelectGroup>
                              <SelectLabel className="text-gray-700">Suggested</SelectLabel>
                              {defaultCountryCodes.map((code) => (
                                <SelectItem key={code.value} value={code.value} className="hover:bg-gray-100 text-black">
                                  {code.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel className="text-gray-700">All Countries</SelectLabel>
                              {globalCountryCodesSample.map((code) => (
                                <SelectItem key={code.value} value={code.value} className="hover:bg-gray-100 text-black">
                                  {code.label}
                                </SelectItem>
                              ))}
                               <SelectItem value="disabled_sample_info" disabled className="text-xs text-muted-foreground italic px-8 py-1">
                                (This is a sample list.)
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mobileNumber" className="block text-sm font-medium text-left mb-1 text-white">Mobile Number</Label>
                        <Input
                          id="mobileNumber"
                          type="tel"
                          placeholder="Enter number"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="w-[70%] bg-white text-black placeholder:text-gray-500 border-gray-300 focus:ring-ring focus:border-ring"
                          maxLength={15}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                    <div className="flex justify-center">
                        <Button
                          onClick={handleGetOtpClick}
                          variant="default"
                          size="sm"
                          className="gradient-border-button w-auto"
                          disabled={isSaving || isSendingOtp || countdown > 0}
                        >
                          {isSendingOtp ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : countdown > 0 ? (
                            `Resend in ${formatCountdown(countdown)}`
                          ) : (
                            'Send OTP via WhatsApp'
                          )}
                        </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <div>
                      <div className="w-full">
                        <Label htmlFor="otp" className="block text-sm font-medium text-left mb-1 text-white">Enter OTP</Label>
                        <div className="flex flex-col items-center space-y-2">
                          <Input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            placeholder="_ _ _ _"
                            value={enteredOtp}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setEnteredOtp(value);
                              setOtpError('');
                            }}
                            className="w-48 h-14 mx-auto bg-white/90 text-black text-2xl font-bold text-center tracking-[0.5em] border-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                            maxLength={4}
                            disabled={isSaving || isVerifying}
                          />
                          {otpError && (
                            <p className="text-sm text-red-400 text-center">{otpError}</p>
                          )}
                          <div className="flex items-center space-x-1">
                            <p className="text-xs text-gray-300">Didn't receive code?</p>
                            <button 
                              type="button" 
                              onClick={countdown === 0 ? handleGetOtpClick : undefined}
                              className={`text-xs ${countdown === 0 ? 'text-primary hover:underline' : 'text-gray-400'}`}
                              disabled={countdown > 0}
                            >
                              {countdown > 0 ? `Request new code in ${formatCountdown(countdown)}` : 'Resend OTP'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-3 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4 mt-4">
                        <Button
                          onClick={handleGoBackToMobileEntry}
                          variant="outline"
                          size="sm"
                          className="w-auto bg-white text-black hover:bg-gray-100"
                          disabled={isSaving}
                        >
                          Change Number
                        </Button>
                        <Button
                          onClick={handleSaveAndContinue}
                          variant="default"
                          size="sm"
                          className="gradient-border-button w-auto"
                          disabled={isSaving || isVerifying}
                        >
                          {isVerifying || isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isVerifying ? 'Verifying...' : 'Saving...'}
                            </>
                          ) : 'Verify & Continue'}
                        </Button>
                    </div>
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
