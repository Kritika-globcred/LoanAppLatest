
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';
import { ArrowLeft, RefreshCw, Send, Loader2 } from 'lucide-react';
import type { Lender } from '@/types/lender';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { enrichLenderRecommendationsGemini } from '@/services/gemini-service'; // You may need to adjust this import based on your Gemini client function
// Remove generateLenderRecommendations import

import { getOrGenerateUserId } from '@/lib/user-utils';
import { getUserApplicationData, saveUserApplicationData } from '@/services/firebase-service'; 


interface AdmissionKycData {
  universityName?: string;
  admissionFees?: string;
  courseName?: string;
  admissionLevel?: string;
}

interface PersonalKycData {
  countryOfUser?: string;
}

export default function LenderRecommendationsPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study'];
  const router = useRouter();
  const { toast } = useToast();
  const userId = getOrGenerateUserId();

  const [avekaMessage, setAvekaMessage] = useState("Let's find some suitable lenders for you!");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  const [domesticLenders, setDomesticLenders] = useState<Lender[]>([]);
  const [foreignLenders, setForeignLenders] = useState<Lender[]>([]);
  
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [allLenders, setAllLenders] = useState<Lender[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    // Fetch user profile
    const fetchUserProfile = async () => {
      if (!userId) return;
      setIsLoadingRecommendations(true);
      const result = await getUserApplicationData(userId);
      if (result.success && result.data) {
        setUserProfile(result.data);
      } else {
        toast({ title: "Information Missing", description: "Please complete Admission & Personal KYC steps first.", variant: "destructive" });
        setAvekaMessage("I need some information from your Admission and Personal KYC steps to find lenders. Please complete those first.");
        setIsLoadingRecommendations(false);
      }
    };
    fetchUserProfile();
    return () => clearTimeout(timer);
  }, [userId, toast, router]);

  // Automatically fetch recommendations when both userProfile and allLenders are loaded
  useEffect(() => {
    if (userProfile && allLenders.length > 0) {
      fetchLenderRecs();
    }
  }, [userProfile, allLenders]);

  // Fetch all lenders from Firestore
  useEffect(() => {
    const fetchLenders = async () => {
      const db = getDb('lenders');
      const snap = await getDocs(collection(db, 'lenders'));
      const lenders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lender[];
      setAllLenders(lenders);
    };
    fetchLenders();
  }, []);

  // Utility: Promise timeout
  function timeoutPromise<T>(promise: Promise<T>, ms = 20000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out fetching lender recommendations")), ms);
      promise
        .then(val => {
          clearTimeout(timer);
          resolve(val);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  const fetchLenderRecs = async () => {
    if (!userProfile || !allLenders.length) {
      toast({ title: "Input Missing", description: "Cannot fetch recommendations without user details and lender database.", variant: "destructive" });
      setIsLoadingRecommendations(false);
      return;
    }
    setIsLoadingRecommendations(true);
    setDomesticLenders([]);
    setForeignLenders([]);
    setAvekaMessage("I'm searching for lenders based on your profile. This might take a moment...");
    try {
      // Compose input for Gemini AI
      const input = {
        graduationPercent: userProfile.academicKyc?.graduationPercent,
        countryOfResidence: userProfile.personalKyc?.countryOfUser,
        lastGraduationLevel: userProfile.academicKyc?.lastGraduationLevel,
        coSignatoryAvailable: userProfile.professionalKyc?.coSignatory?.coSignatoryChoice === 'yes',
        offerLetter: {
          universityName: userProfile.admissionKyc?.universityName,
          courseFees: userProfile.admissionKyc?.admissionFees,
          courseName: userProfile.admissionKyc?.courseName,
          courseLevel: userProfile.admissionKyc?.admissionLevel,
        },
        lenders: allLenders,
      };
      // Call Gemini AI client-side function (replace with your actual function)
      const recommended = await enrichLenderRecommendationsGemini(input);
      // Split lenders into domestic/foreign
      const userCountry = userProfile.personalKyc?.countryOfUser?.toLowerCase() || '';
      // Always use offer letter values for currency and course fees
      const offerLetterFeesRaw = userProfile.admissionKyc?.admissionFees || '';
      const offerLetterCurrency = userProfile.admissionKyc?.courseFeesCurrency || userProfile.admissionKyc?.currency || '';
      const offerLetterFees = parseFloat(offerLetterFeesRaw.replace(/[^\d.]/g, ''));
      // Show 80%-85% of course fees as range, with offer letter currency
      const estimateAmount = (min: number, max: number) => (offerLetterFees && offerLetterCurrency) ? `${Math.round(offerLetterFees*min)} - ${Math.round(offerLetterFees*max)} ${offerLetterCurrency}` : 'N/A';
      // Improved classification logic using mobile country code and lender currency
      // For India: if user selected +91 (IN), show lenders with INR as domestic, others as foreign
      // DEBUG: Output user mobile country code
      console.log('[LenderRec] userProfile.mobileKyc.countryCode:', userProfile?.mobileKyc?.countryCode);
      let userIsIndia = false;
      let userMobileCountryCode = '';
      if (userProfile && userProfile.mobileKyc && userProfile.mobileKyc.countryCode) {
        userMobileCountryCode = String(userProfile.mobileKyc.countryCode).replace(/\s+/g, '').toUpperCase();
        if (userMobileCountryCode === '+91' || userMobileCountryCode === '+91_IN' || userMobileCountryCode.endsWith('IN')) userIsIndia = true;
      }
      const classifyLender = (l: Lender): 'domestic' | 'foreign' => {
        // DEBUG: Output lender currency
        const lenderCurrency = l.loanCurrency ? String(l.loanCurrency).replace(/\s+/g, '').toUpperCase() : '';
        if (userIsIndia) {
          if (lenderCurrency === 'INR') return 'domestic';
          return 'foreign';
        }
        // fallback: previous logic (for other countries)
        if (l.baseCountry) {
          return l.baseCountry.toLowerCase() === userCountry ? 'domestic' : 'foreign';
        }
        if (l.loanCurrency) {
          if (userCountry === 'in' && l.loanCurrency.toUpperCase() === 'INR') return 'domestic';
          if (userCountry !== 'in' && l.loanCurrency.toUpperCase() !== 'INR') return 'domestic';
        }
        return 'foreign';
      };
      const domestic: Lender[] = [];
      const foreign: Lender[] = [];
      for (const l of recommended) {
        const type = classifyLender(l);
        const lenderWithUi = {
          ...l,
          estimatedLoanAmount: estimateAmount(0.8, 0.85),
        };
        if (type === 'domestic') domestic.push(lenderWithUi);
        else foreign.push(lenderWithUi);
      }
      setDomesticLenders(domestic);
      setForeignLenders(foreign);
      setAvekaMessage("Here are some lender recommendations I found! Review them and select any you're interested in.");
      toast({ title: "Lender Recommendations Generated", description: "Please review the list below." });
    } catch (error: any) {
      console.error('[LenderRec] Error generating lender recommendations:', error);
      toast({ title: "Error", description: error?.message || "Could not generate lender recommendations at this time.", variant: "destructive" });
      setAvekaMessage("Sorry, I encountered an issue while generating lender recommendations. Please try refreshing. [Debug: See console for details]");
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLenderSelection = (lenderName: string, checked: boolean) => {
    setSelectedLenders(prev =>
      checked ? [...prev, lenderName] : prev.filter(name => name !== lenderName)
    );
  };

  const handleSubmitSelected = async () => {
    if (!userId) {
        toast({title: "Error", description: "User session not found.", variant: "destructive"});
        return;
    }
    setIsSaving(true);
    const result = await saveUserApplicationData(userId, { selectedLenderRecommendations: selectedLenders });
    setIsSaving(false);

    if(result.success) {
        toast({ title: "Lender Selections Saved!", description: `You've indicated interest in ${selectedLenders.length} lender(s).` });
        setIsSubmitted(true);
        setAvekaMessage("Thank you, we will be in touch with you in next 24 hours");
    } else {
        toast({ title: "Save Failed", description: result.error || "Could not save selections.", variant: "destructive"});
    }
  };
  
  const renderLenderCard = (lender: Lender, type: 'domestic' | 'foreign', index: number) => (
  <Card key={`${type}-${lender.id ?? (lender.name ?? 'UnknownLender').replace(/\s+/g, '-')}-${index}`} className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white border-0 rounded-xl">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          {lender.logoUrl && (
            <Image src={lender.logoUrl} alt={lender.name ?? 'Lender Logo'} width={48} height={48} className="rounded-full border-2 border-white shadow-md" />
          )}
          <div>
            {/* Lender Name in bold */}
            <div className="font-bold text-lg text-primary">{lender.name}</div>
            {/* Loan Type label and value */}
            <div className="text-gray-300 text-sm"><span className="font-semibold">Loan Type:</span> {lender.loanType}</div>
          </div>
        </div>
        {/* ROI and Amount Range top right */}
        <div className="flex flex-col items-end space-y-1 ml-2 min-w-[120px]">
          <span className="font-bold text-xl text-primary">{lender.rateOfInterest ?? (lender.interestRate ? `${lender.interestRate}%` : 'N/A')}</span>
          <span className="font-semibold text-base text-white">
            {/* Approval Amount: 80%-85% of course fees */}
            {(() => {
              const feesRaw = userProfile?.admissionKyc?.admissionFees || '';
              // Remove any non-numeric, non-dot, non-comma chars, then replace comma with dot if needed
              let sanitized = feesRaw.replace(/[^\d.,]/g, '');
              // If both comma and dot exist, assume comma is thousand separator and remove it
              if (sanitized.includes(',') && sanitized.includes('.')) {
                sanitized = sanitized.replace(/,/g, '');
              } else if (sanitized.includes(',') && !sanitized.includes('.')) {
                // If only comma exists, treat it as decimal separator
                sanitized = sanitized.replace(/,/g, '.');
              }
              const fees = parseFloat(sanitized);
              let currency = userProfile?.admissionKyc?.courseFeesCurrency || userProfile?.admissionKyc?.currency || '';
              // Fallback: try to extract currency from feesRaw if not found
              if (!currency && typeof feesRaw === 'string') {
                const match = feesRaw.match(/[A-Za-z€$£₹¥]+/);
                if (match) currency = match[0];
              }
              if (!isNaN(fees) && fees > 0) {
                return `Approval Amount: ${Math.round(fees*0.8)} - ${Math.round(fees*0.85)}${currency ? ' ' + currency : ''}`;
              } else {
                return 'Approval Amount: N/A';
              }
            })()}
          </span>
          {/* Show course fees from offer letter */}
          <span className="text-xs text-gray-300">
            Course Fees: {userProfile?.admissionKyc?.admissionFees ? `${userProfile.admissionKyc.admissionFees} ${userProfile.admissionKyc.courseFeesCurrency || userProfile.admissionKyc.currency || ''}` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id={`lender-select-${type}-${(lender.name ?? 'UnknownLender').replace(/\s+/g, '-')}`}
              checked={selectedLenders.includes(lender.name ?? 'Unknown Lender')}
              onCheckedChange={(checked) => handleLenderSelection(lender.name ?? 'Unknown Lender', Boolean(checked))}
              className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              disabled={isSaving || isSubmitted}
            />

          </div>
        </div>
      </div>
    </CardHeader>
    {/* Bottom section: co-signatory, TAT, Ease Of Approval, Processing Time, Living Expenses Covered */}
    <CardContent className="space-y-1 text-sm pt-1">
      <div className="flex flex-wrap gap-3">
        {lender.coSignerStatus && (
          <span><span className="font-semibold">Co-signatory:</span> {lender.coSignerStatus}</span>
        )}
        {lender.tatForSanctionLetter && (
          <span><span className="font-semibold">TAT:</span> {lender.tatForSanctionLetter}</span>
        )}
        {lender.criteria?.easeOfApproval && (
          <span><span className="font-semibold">Ease Of Approval:</span> {lender.criteria.easeOfApproval}</span>
        )}
        {lender.criteria?.processingTime && (
          <span><span className="font-semibold">Processing Time:</span> {lender.criteria.processingTime}</span>
        )}
        {lender.livingExpensesCovered && (
          <span><span className="font-semibold">Living Expenses:</span> {lender.livingExpensesCovered}</span>
        )}
      </div>
    </CardContent>
  </Card>
);

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
                          activeNavItem === item ? 'progress-dot-active' : 'bg-gray-400/60'
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

            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} hasOfferLetter={localStorage.getItem('hasOfferLetterStatus') === 'true'} />
          <div className="flex items-center mb-6 mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/review-professional-kyc')} className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="py-8">
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-3xl mx-auto">
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
                        <p className="text-base text-white">{avekaMessage}</p>
                    </div>
                </div>

                <div className="my-6 flex flex-wrap justify-center gap-4">
                    <Button onClick={fetchLenderRecs} disabled={isLoadingRecommendations || isSaving} className="gradient-border-button">
                        {isLoadingRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh Recommendations
                    </Button>
                    <Button onClick={handleSubmitSelected} disabled={selectedLenders.length === 0 || isLoadingRecommendations || isSaving || isSubmitted} className="gradient-border-button">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                         Submit Selections ({selectedLenders.length})
                    </Button>
                </div>

                {isLoadingRecommendations && (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="ml-3 text-lg">Finding lenders for you...</p>
                  </div>
                )}

                {/* Show error if recommendations failed to load */}
                {!isLoadingRecommendations && avekaMessage.includes('issue while generating lender recommendations') && (
                  <div className="text-center text-red-500 font-semibold my-4">
                    Could not load recommendations. Please check your input and try again. <br/>
                    <span className="text-xs text-gray-300">(See browser console for debug info)</span>
                  </div>
                )}

                {!isLoadingRecommendations && domesticLenders.length === 0 && foreignLenders.length === 0 && userProfile &&(
                  <div className="text-center text-lg mt-6">
                    No specific lender recommendations found with the current criteria.<br/>
                    <span className="text-xs text-gray-400">[Debug: userProfile.mobileKyc.countryCode: {userProfile?.mobileKyc?.countryCode}]</span><br/>
                    <span className="text-xs text-gray-400">[Debug: allLenders loaded: {JSON.stringify(allLenders.map(l=>({name:l.name,loanCurrency:l.loanCurrency})))}]</span><br/>
                    <span className="text-xs text-gray-400">[Debug: User profile loaded: {JSON.stringify(userProfile)}]</span>
                  </div>
                )}
                {!isLoadingRecommendations && (!userProfile || allLenders.length === 0) && (
                  <div className="text-center text-lg mt-6 text-red-500">
                    Missing required data to show recommendations.<br/>
                    <span className="text-xs text-gray-400">[Debug: userProfile: {JSON.stringify(userProfile)}]</span><br/>
                    <span className="text-xs text-gray-400">[Debug: allLenders: {JSON.stringify(allLenders)}]</span>
                  </div>
                )}
                
                {!isLoadingRecommendations && (
                  <div className="w-full space-y-8 mt-6 text-left">
                    {/* Always show Recommended Lenders section */}
                    <section>
                      <h2 className="text-2xl font-semibold mb-4 text-center text-primary">Recommended Lenders</h2>
                      <div className="space-y-4">
                        {foreignLenders.length > 0 ? (
                          foreignLenders.map((lender, idx) => renderLenderCard(lender, 'foreign', idx))
                        ) : (
                          <div className="text-center text-gray-400">No recommended lenders found for your profile.</div>
                        )}
                      </div>
                    </section>
                    {/* Show Domestic Lenders only if any exist */}
                    {domesticLenders.length > 0 && (
                      <section>
                        <h2 className="text-2xl font-semibold mb-4 text-center text-primary">Domestic Lenders</h2>
                        <div className="space-y-4">
                          {domesticLenders.map((lender, idx) => renderLenderCard(lender, 'domestic', idx))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <Button
              variant="default"
              size="lg"
              disabled={selectedLenders.length === 0 || isSaving || avekaMessage.startsWith('Thank you')}
              onClick={handleSubmitSelected}
              className="px-8 py-2 text-lg font-semibold"
            >
              Submit Selection
            </Button>
          </div>
          {isSubmitted && (
            <div className="text-center mt-6 text-lg font-semibold text-primary">
              {avekaMessage}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
