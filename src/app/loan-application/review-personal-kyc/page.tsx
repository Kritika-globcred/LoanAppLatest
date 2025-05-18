
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ArrowLeft, Loader2 } from 'lucide-react';
// Import flow and types once created
// import { extractPersonalKycDetails, ExtractPersonalKycInput, ExtractPersonalKycOutput } from '@/ai/flows/extract-personal-kyc-flow';

export default function ReviewPersonalKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Simulate loading AI data

  useEffect(() => {
    // Simulate fetching/processing KYC data
    const timer = setTimeout(() => {
      setIsLoading(false);
      // In a real scenario, here you would:
      // 1. Get stored image data URIs and idDocumentType from localStorage.
      // 2. Call `extractPersonalKycDetails(input)`.
      // 3. Set the extracted data to state to display in a table.
      // 4. Calculate age from DOB.
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirmAndContinue = () => {
    // Logic for saving confirmed KYC data and navigating to the next step
    console.log("Personal KYC confirmed and proceeding.");
    router.push('/'); // Placeholder: navigate to home or next step
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
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/personal-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-6 text-white">Review Your Personal KYC Details</h2>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-lg text-white">Extracting details from your documents...</p>
                  <p className="text-sm text-gray-300">This might take a few moments.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-center text-white">
                    Extracted details will be displayed here in an editable table.
                    (Placeholder for AI extracted data table and consent section)
                  </p>
                  {/* Placeholder for editable table */}
                  {/* Placeholder for consent checkbox and timestamp */}
                  <div className="flex justify-center mt-8">
                    <Button onClick={handleConfirmAndContinue} size="lg" className="gradient-border-button">
                      Confirm & Continue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
