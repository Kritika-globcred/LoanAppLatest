
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
import type { GenerateRecommendationsInput, GenerateRecommendationsOutput, UniversityRecommendation } from '@/ai/flows/generate-recommendations-flow';
import { generateRecommendations } from '@/ai/flows/generate-recommendations-flow';
import { getOrGenerateUserId } from '@/lib/user-utils';
import { getUserApplicationData, saveUserApplicationData, getAllUniversities } from '@/services/firebase-service';


interface PreferencesData {
  preferredCountry1?: string;
  preferredCountry2?: string | null;
  courseLevel?: string;
  courseName?: string; 
}

export default function RecommendationsPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();
  const userId = getOrGenerateUserId();

  const [avekaMessage, setAvekaMessage] = useState("Let's find some great university and course recommendations for you!");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<UniversityRecommendation[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    const fetchPrefs = async () => {
        if(userId) {
            setIsLoadingRecommendations(true); 
            const appDataResult = await getUserApplicationData(userId);
            if (appDataResult.success && appDataResult.data?.preferences) {
                setPreferences(appDataResult.data.preferences as PreferencesData);
            } else {
                 toast({ title: "Preferences not found", description: "Please complete the preferences step.", variant: "destructive" });
                 router.push('/loan-application/preferences'); 
            }
        }
    };
    fetchPrefs();
    return () => clearTimeout(timer);
  }, [toast, userId, router]);

  const fetchRecs = async () => {
    if (!preferences) {
      toast({ title: "Preferences Missing", description: "Please complete the preferences step first.", variant: "destructive" });
      setIsLoadingRecommendations(false);
      return;
    }
    setIsLoadingRecommendations(true);
    setRecommendations([]);
    setAvekaMessage("I'm searching for the best options based on your preferences. This might take a moment...");
    try {
      // Fetch all valid universities from Firestore
      const allUniversities = await getAllUniversities();
      const validUniversityNames = new Set(
        allUniversities.map((u: any) => (u.name || '').trim().toLowerCase())
      );
      // Debug: Log all university names from Firestore
      console.log('[DEBUG] Firestore university names:', Array.from(validUniversityNames));

      const input: GenerateRecommendationsInput = {
        preferredCountry1: preferences.preferredCountry1 || "Any",
        preferredCountry2: preferences.preferredCountry2 || null,
        courseLevel: preferences.courseLevel || "Any",
        courseField: preferences.courseName || "Any",
        validUniversityNames: allUniversities.map((u: any) => u.name || '').filter(Boolean),
      };
      const result: GenerateRecommendationsOutput = await generateRecommendations(input);
      // Debug: Log all AI-recommended university names
      const aiNames = (result.recommendations || []).map(rec => (rec.universityName || '').trim().toLowerCase());
      console.log('[DEBUG] AI-recommended university names:', aiNames);
      // Filter AI recommendations to only those present in Firestore (case-insensitive, trimmed)
      const filteredRecs = (result.recommendations || []).filter(
        (rec) => validUniversityNames.has((rec.universityName || '').trim().toLowerCase())
      );
      setRecommendations(filteredRecs);
      if (filteredRecs.length > 0) {
        setAvekaMessage("Here are some recommendations I found for you! Review them and select the ones you're interested in.");
      } else {
        setAvekaMessage("I couldn't find specific recommendations based on the current preferences. You can try refreshing or adjusting your preferences.");
      }
      toast({ title: "Recommendations Generated", description: "Please review the list below." });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({ title: "Error", description: "Could not generate recommendations at this time.", variant: "destructive" });
      setAvekaMessage("Sorry, I encountered an issue while generating recommendations. Please try again.");
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (preferences && userId) { 
      fetchRecs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences, userId]); 

  const handleUniversitySelection = (universityName: string, checked: boolean) => {
    setSelectedUniversities(prev =>
      checked ? [...prev, universityName] : prev.filter(name => name !== universityName)
    );
  };

  const handleSubmitSelected = async () => {
    if (selectedUniversities.length === 0) {
      toast({ title: "No Selection", description: "Please select at least one university to proceed.", variant: "destructive" });
      return;
    }
    if(!userId) {
        toast({title: "Error", description: "User session not found.", variant: "destructive"});
        return;
    }
    setIsSaving(true);
    const result = await saveUserApplicationData(userId, { selectedUniversities: selectedUniversities });
    setIsSaving(false);

    if (result.success) {
        toast({ title: "Selection Submitted!", description: `You've selected ${selectedUniversities.length} universities.` });
        router.push('/loan-application/final-summary'); 
    } else {
        toast({title: "Save Failed", description: result.error || "Could not save selections.", variant: "destructive"});
    }
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
            <Button variant="outline" size="sm" onClick={() => router.push('/loan-application/preferences')} className="bg-white/20 hover:bg-white/30 text-white">
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
                    <Button onClick={fetchRecs} disabled={isLoadingRecommendations || !preferences || isSaving} className="gradient-border-button">
                        {isLoadingRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh Recommendations
                    </Button>
                    <Button onClick={handleSubmitSelected} disabled={selectedUniversities.length === 0 || isLoadingRecommendations || isSaving} className="gradient-border-button">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Selected ({selectedUniversities.length})
                    </Button>
                </div>

                {isLoadingRecommendations && (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="ml-3 text-lg">Generating recommendations...</p>
                  </div>
                )}

                {!isLoadingRecommendations && recommendations.length === 0 && preferences && (
                  <p className="text-center text-lg mt-6">No recommendations found with the current criteria. Try adjusting your preferences or refreshing.</p>
                )}
                
                {!isLoadingRecommendations && recommendations.length > 0 && (
                  <div className="w-full space-y-6 mt-6 text-left">
                    {recommendations.map((rec, index) => (
                      <Card key={index} className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white border-0 rounded-xl">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl text-primary">{rec.universityName}</CardTitle>
                              <CardDescription className="text-gray-300">{rec.universitySummary}</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2 pt-1">
                              <Checkbox
                                id={`uni-select-${index}`}
                                checked={selectedUniversities.includes(rec.universityName)}
                                onCheckedChange={(checked) => handleUniversitySelection(rec.universityName, !!checked)}
                                className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                disabled={isSaving}
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {/* Fees and details */}
                          {(() => {
                            const userCountryCode = (typeof window !== 'undefined' && localStorage.getItem('selectedCountryValue')) || '';
                            const isIndia = userCountryCode?.toUpperCase().includes('IN');
                            let fees = Number(rec.estimatedFees) || 0;
                            let feesDisplay = isIndia ? `INR ${fees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : `$${Math.round(fees / 85).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
                            if (!fees) feesDisplay = 'N/A';
                            return [
                              <div className="text-sm" key="fees">Fees: {feesDisplay}</div>,
                              <div className="text-sm" key="deposit">Self Contribution / Deposit: {feesDisplay}</div>,
                              <div className="text-sm" key="course">Recommended Course: {rec.recommendedCourseName || 'N/A'}</div>,
                              <div className="text-sm" key="duration">Course Duration: {rec.courseDuration || 'N/A'}</div>,
                              <div className="text-sm" key="tests">Tests Required: {rec.testsRequired || 'N/A'}</div>
                            ];
                          })()}
                        </CardContent>
                      </Card>
                    ))}
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
