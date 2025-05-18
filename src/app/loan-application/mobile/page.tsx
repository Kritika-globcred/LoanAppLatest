
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";


const countryCodes = [
  { value: '+91', label: 'India (+91)' },
  { value: '+1', label: 'USA (+1)' },
  { value: '+44', label: 'UK (+44)' },
  { value: '+61', label: 'Australia (+61)' },
  { value: '+CAD', label: 'Canada (+1)' },
];

export default function MobileVerificationPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan'); // Or determine based on context
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const { toast } = useToast();

  const [countryCode, setCountryCode] = useState(countryCodes[0].value);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);


  useEffect(() => {
    // Aveka's message pop-up
    const timer = setTimeout(() => {
      setAvekaMessageVisible(true);
    }, 500); // Slight delay for Aveka's message on this page
    return () => clearTimeout(timer);
  }, []);


  const handleGetOtpClick = () => {
    if (!mobileNumber.trim() || !/^\d{10}$/.test(mobileNumber.trim())) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }
    // In a real app, an API call to send OTP would be made here.
    // For now, we just simulate it.
    setOtpSent(true);
    toast({
      title: "OTP Sent!",
      description: "An OTP has been sent to your mobile number (default: 9999).",
    });
  };

  const handleSaveAndContinue = () => {
    if (enteredOtp !== '9999') {
      toast({
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect. Please try again.",
        variant: "destructive",
      });
      return;
    }
    // Navigate to the next step or perform other actions
    toast({
      title: "Mobile Verified!",
      description: "Proceeding to the next step.",
    });
    console.log("OTP Verified. Country Code:", countryCode, "Mobile:", mobileNumber);
    // Example: router.push('/loan-application/step-2');
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
        <div className="absolute inset-0 bg-[hsl(var(--primary)/0.10)] backdrop-blur-lg rounded-2xl z-0"></div>

        <div className="relative z-10">
          {/* Header Section (same as homepage) */}
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

          {/* Mobile Verification Form Card */}
          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-lg mx-auto">
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
                        <p className="font-semibold text-lg mb-1">Aveka</p>
                        <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
                        <p className="text-base">
                        Hi there! To start your loan application, please share your mobile number.
                        </p>
                    </div>
                </div>


                {!otpSent ? (
                  <div className="w-full space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-1">
                        <Label htmlFor="countryCode" className="block text-sm font-medium text-left mb-1">Country Code</Label>
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger id="countryCode" className="w-full text-black">
                            <SelectValue placeholder="Select code" />
                          </SelectTrigger>
                          <SelectContent className="bg-background text-foreground">
                            {countryCodes.map((code) => (
                              <SelectItem key={code.value} value={code.value} className="hover:bg-muted">
                                {code.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="mobileNumber" className="block text-sm font-medium text-left mb-1">Mobile Number</Label>
                        <Input
                          id="mobileNumber"
                          type="tel"
                          placeholder="Enter 10-digit number"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="w-full text-black"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleGetOtpClick}
                      variant="default"
                      size="lg"
                      className="w-full gradient-border-button"
                    >
                      Get OTP
                    </Button>
                  </div>
                ) : (
                  <div className="w-full space-y-6">
                    <div>
                      <Label htmlFor="otp" className="block text-sm font-medium text-left mb-1">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 4-digit OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="w-full text-black text-center tracking-[0.5em]"
                        maxLength={4}
                      />
                       <p className="text-xs text-gray-300 mt-2">Default OTP is 9999 for testing.</p>
                    </div>
                    <Button
                      onClick={handleSaveAndContinue}
                      variant="default"
                      size="lg"
                      className="w-full gradient-border-button"
                    >
                      Save & Continue
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
