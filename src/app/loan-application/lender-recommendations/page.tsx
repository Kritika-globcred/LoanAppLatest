
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
import type { GenerateLenderRecommendationsInput, GenerateLenderRecommendationsOutput, LenderRecommendation } from '@/ai/flows/generate-lender-recommendations-flow';
import { generateLenderRecommendations } from '@/ai/flows/generate-lender-recommendations-flow';

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
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [avekaMessage, setAvekaMessage] = useState("Let's find some suitable lenders for you!");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  const [domesticLenders, setDomesticLenders] = useState<LenderRecommendation[]>([]);
  const [foreignLenders, setForeignLenders] = useState<LenderRecommendation[]>([]);
  
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);
  
  const [userInputForFlow, setUserInputForFlow] = useState<GenerateLenderRecommendationsInput | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    
    const admissionDataString = localStorage.getItem('admissionKycData');
    const personalDataString = localStorage.getItem('personalKycDataReviewed'); // Assuming reviewed data is stored here

    if (admissionDataString && personalDataString) {
      try {
        const admissionData: AdmissionKycData = JSON.parse(admissionDataString);
        const personalData: PersonalKycData = JSON.parse(personalDataString);

        if (personalData.countryOfUser && admissionData.universityName && admissionData.admissionFees && admissionData.admissionLevel) {
          setUserInputForFlow({
            userCountryOfResidence: personalData.countryOfUser,
            admissionUniversityName: admissionData.universityName,
            tuitionFees: admissionData.admissionFees,
            courseLevel: admissionData.admissionLevel,
          });
        } else {
          toast({ title: "Missing Information", description: "Could not retrieve all necessary details (country, university, fees, level) for lender recommendations.", variant: "destructive" });
          setAvekaMessage("I'm missing some key details like your country, university, or tuition fees. Please ensure those steps are complete.");
        }
      } catch (e) {
        console.error("Failed to parse data for lender recommendations", e);
        toast({ title: "Error", description: "Could not load your details for recommendations.", variant: "destructive" });
      }
    } else {
        toast({ title: "Information Missing", description: "Please complete Admission & Personal KYC steps first.", variant: "destructive" });
        setAvekaMessage("I need some information from your Admission and Personal KYC steps to find lenders. Please complete those first.");
    }
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchLenderRecommendations = async () => {
    if (!userInputForFlow) {
      toast({ title: "Input Missing", description: "Cannot fetch recommendations without user details.", variant: "destructive" });
      return;
    }
    setIsLoadingRecommendations(true);
    setDomesticLenders([]);
    setForeignLenders([]);
    setAvekaMessage("I'm searching for lenders based on your profile. This might take a moment...");
    try {
      const result: GenerateLenderRecommendationsOutput = await generateLenderRecommendations(userInputForFlow);
      setDomesticLenders(result.domesticLenders || []);
      setForeignLenders(result.foreignLenders || []);
      
      if ((result.domesticLenders?.length || 0) > 0 || (result.foreignLenders?.length || 0) > 0) {
        setAvekaMessage("Here are some lender recommendations I found! Review them and select any you're interested in.");
      } else {
        setAvekaMessage("I couldn't find specific lender recommendations right now. You can try refreshing, or we can proceed without these for now.");
      }
      toast({ title: "Lender Recommendations Generated", description: "Please review the list below." });
    } catch (error) {
      console.error("Error generating lender recommendations:", error);
      toast({ title: "Error", description: "Could not generate lender recommendations at this time.", variant: "destructive" });
      setAvekaMessage("Sorry, I encountered an issue while generating lender recommendations. Please try refreshing.");
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (userInputForFlow) {
      fetchLenderRecommendations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInputForFlow]);

  const handleLenderSelection = (lenderName: string, checked: boolean) => {
    setSelectedLenders(prev =>
      checked ? [...prev, lenderName] : prev.filter(name => name !== lenderName)
    );
  };

  const handleSubmitSelected = () => {
    // In a real app, you'd likely want to save more than just names, perhaps the full lender objects or IDs.
    localStorage.setItem('selectedLenders', JSON.stringify(selectedLenders));
    toast({ title: "Lender Selections Saved!", description: `You've indicated interest in ${selectedLenders.length} lender(s).` });
    router.push('/loan-application/final-summary'); 
  };
  
  const renderLenderCard = (lender: LenderRecommendation, type: 'domestic' | 'foreign') => (
    <Card key={`${type}-${lender.lenderName}`} className="bg-[hsl(var(--card)/0.35)] backdrop-blur-sm shadow-md border-0 rounded-xl text-white">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-primary">{lender.lenderName}</CardTitle>
            <CardDescription className="text-gray-300">{lender.loanType}</CardDescription>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id={`lender-select-${type}-${lender.lenderName.replace(/\s+/g, '-')}`}
              checked={selectedLenders.includes(lender.lenderName)}
              onCheckedChange={(checked) => handleLenderSelection(lender.lenderName, !!checked)}
              className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label htmlFor={`lender-select-${type}-${lender.lenderName.replace(/\s+/g, '-')}`} className="text-sm">Select</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><strong className="text-gray-300">Est. Loan Amount:</strong> {lender.estimatedLoanAmount}</p>
        <p><strong className="text-gray-300">Key Features:</strong> {lender.keyFeatures}</p>
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
        <div className="absolute inset-0 bg-[hsl(var(--primary)/0.10)] rounded-2xl z-0 backdrop-blur-lg"></div>
        
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
              <Link href="/loan-application/mobile" passHref><Button variant="default" size="sm" className="gradient-border-button">Get Started</Button></Link>
            </div>
          </div>
          <LoanProgressBar steps={loanAppSteps} />

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
                                    transform transition-all duration-500 ease-out w-full
                                    ${avekaMessageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    >
                        <p className="font-semibold text-lg mb-1 text-white">Aveka</p>
                        <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
                        <p className="text-base text-white">{avekaMessage}</p>
                    </div>
                </div>

                <div className="my-6 flex flex-wrap justify-center gap-4">
                    <Button onClick={fetchLenderRecommendations} disabled={isLoadingRecommendations || !userInputForFlow} className="gradient-border-button">
                        {isLoadingRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh Recommendations
                    </Button>
                    <Button onClick={handleSubmitSelected} disabled={selectedLenders.length === 0 || isLoadingRecommendations} className="gradient-border-button">
                        <Send className="mr-2 h-4 w-4" /> Submit Selections ({selectedLenders.length})
                    </Button>
                </div>

                {isLoadingRecommendations && (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="ml-3 text-lg">Finding lenders for you...</p>
                  </div>
                )}

                {!isLoadingRecommendations && domesticLenders.length === 0 && foreignLenders.length === 0 && userInputForFlow &&(
                  <p className="text-center text-lg mt-6">No specific lender recommendations found with the current criteria. You can try refreshing or proceed.</p>
                )}
                
                {!isLoadingRecommendations && (domesticLenders.length > 0 || foreignLenders.length > 0) && (
                  <div className="w-full space-y-8 mt-6 text-left">
                    {domesticLenders.length > 0 && (
                      <section>
                        <h2 className="text-2xl font-semibold mb-4 text-center text-primary">Domestic Lenders</h2>
                        <div className="space-y-4">
                          {domesticLenders.map(lender => renderLenderCard(lender, 'domestic'))}
                        </div>
                      </section>
                    )}
                    {foreignLenders.length > 0 && (
                       <section>
                        <h2 className="text-2xl font-semibold mb-4 text-center text-primary">Foreign Lenders</h2>
                        <div className="space-y-4">
                          {foreignLenders.map(lender => renderLenderCard(lender, 'foreign'))}
                        </div>
                      </section>
                    )}
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
