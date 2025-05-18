
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { saveUserApplicationData } from '@/services/firebase-service';
import { getOrGenerateUserId } from '@/lib/user-utils';


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
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const { toast } = useToast();
  const router = useRouter();

  const [countryCode, setCountryCode] = useState(defaultCountryCodes[0].value);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUserId(getOrGenerateUserId());
    const timer = setTimeout(() => {
      setAvekaMessageVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGetOtpClick = () => {
    if (!mobileNumber.trim() || !/^\d{7,15}$/.test(mobileNumber.trim())) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number (7-15 digits).",
        variant: "destructive",
      });
      return;
    }
    setOtpSent(true);
    toast({
      title: "OTP Sent!",
      description: "An OTP has been sent to your mobile number (default: 9999).",
    });
  };

  const handleSaveAndContinue = async () => {
    if (enteredOtp !== '9999') {
      toast({
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
        toast({ title: "Error", description: "User ID not found. Please refresh.", variant: "destructive" });
        return;
    }
    setIsSaving(true);

    const selectedCountry = [...defaultCountryCodes, ...globalCountryCodesSample].find(c => c.value === countryCode);

    const initialData = {
      userId: userId,
      mobileNumber: mobileNumber,
      countryCode: selectedCountry?.dialCode,
      countryShortName: selectedCountry?.countryShortName,
    };

    const result = await saveUserApplicationData(userId, initialData);

    if (result.success) {
        toast({
            title: "Mobile Verified!",
            description: "Proceeding to the next step.",
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedCountryValue', countryCode); // Used by Personal KYC
        }
        router.push('/loan-application/admission-kyc');
    } else {
        toast({
            title: "Save Failed",
            description: result.error || "Could not save mobile verification details.",
            variant: "destructive",
        });
    }
    setIsSaving(false);
  };

  const handleGoBackToMobileEntry = () => {
    setOtpSent(false);
    setEnteredOtp('');
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
        <div className="absolute inset-0 bg-[hsl(var(--primary)/0.50)] rounded-2xl z-0 backdrop-blur-lg"></div>

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
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1.5 sm:mr-2 shrink-0 ${
                          activeNavItem === item
                            ? 'progress-dot-active'
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

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-lg mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex flex-col items-center md:flex-row md:items-start md:space-x-4 w-full">
                    <div className="flex-shrink-0 mb-3 md:mb-0">
                        <Image
                        src="https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Aveka.png"
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
                        Hi there! To start your loan application, please share your mobile number.
                        </p>
                    </div>
                </div>

                {!otpSent ? (
                  <div className="w-full space-y-6">
                    <div className="grid grid-cols-[auto_1fr] gap-4 items-end">
                      <div>
                        <Label htmlFor="countryCode" className="block text-sm font-medium text-left mb-1 text-white">Code</Label>
                        <Select value={countryCode} onValueChange={setCountryCode}>
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
                        />
                      </div>
                    </div>
                    <div className="flex justify-center">
                        <Button
                        onClick={handleGetOtpClick}
                        variant="default"
                        size="sm"
                        className="gradient-border-button w-auto"
                        disabled={isSaving}
                        >
                        Get OTP
                        </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <div>
                      <Label htmlFor="otp" className="block text-sm font-medium text-left mb-1 text-white">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 4-digit OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="w-1/2 mx-auto bg-white text-black placeholder:text-gray-500 border-gray-300 focus:ring-ring focus:border-ring text-center tracking-[0.5em]"
                        maxLength={4}
                      />
                       <p className="text-xs text-gray-300 mt-2">Default OTP is 9999 for testing.</p>
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
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save & Continue'}
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
