
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Edit3, Save, AlertCircle } from 'lucide-react';
import { extractPersonalKycDetails, type ExtractPersonalKycInput, type ExtractPersonalKycOutput } from '@/ai/flows/extract-personal-kyc-flow';
import { LoanProgressBar } from '@/components/loan-application/loan-progress-bar';
import { loanAppSteps } from '@/lib/loan-steps';

type EditableKycOutput = ExtractPersonalKycOutput & { ageInYears?: string | number };

export default function ReviewPersonalKYCPage() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<EditableKycOutput | null>(null);
  const [editingField, setEditingField] = useState<keyof EditableKycOutput | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [avekaMessage, setAvekaMessage] = useState("Hold tight! I'm carefully reviewing your documents with AI to extract the details...");
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);


  useEffect(() => {
    const timer = setTimeout(() => setAvekaMessageVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const timerId = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const calculateAge = (dob: string): string | number => {
    if (!dob || dob === "Not Specified" || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return "Not Specified";
    }
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age : "Invalid Date";
    } catch (e) {
      return "Invalid Date";
    }
  };

  useEffect(() => {
    const processKycDocuments = async () => {
      setIsProcessing(true);
      setIsLoading(true);
      setAvekaMessage("Hold tight! I'm carefully reviewing your documents with AI to extract the details...");

      const idDocumentDataUri = localStorage.getItem('idDocumentDataUri');
      const passportDataUri = localStorage.getItem('passportDataUri');
      const idDocType = localStorage.getItem('idDocumentType') as "PAN Card" | "National ID" | null;

      if (!idDocumentDataUri || !passportDataUri || !idDocType) {
        toast({
          title: "Error: Missing Documents",
          description: "Could not find document data. Please go back and re-upload.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsProcessing(false);
        setAvekaMessage("It seems there was an issue fetching your document data. Please try uploading them again.");
        router.push('/loan-application/personal-kyc');
        return;
      }

      try {
        const input: ExtractPersonalKycInput = {
          idDocumentImageUri: idDocumentDataUri,
          passportImageUri: passportDataUri,
          idDocumentType: idDocType,
        };
        const result = await extractPersonalKycDetails(input);
        const ageInYears = calculateAge(result.dateOfBirth);
        setExtractedData({ ...result, ageInYears });
        setAvekaMessage("Great news! I've extracted the details from your documents. Please review them below and make any corrections if needed.");
        toast({ title: "Details Extracted", description: "Please review your KYC information." });
      } catch (error) {
        console.error("Error processing KYC documents:", error);
        toast({
          title: "Extraction Failed",
          description: "Could not extract details from the documents. Please ensure they are clear images or try re-uploading.",
          variant: "destructive",
        });
        setAvekaMessage("I encountered an issue while extracting details. You might need to re-upload clearer images, or you can try filling the details manually if this persists.");
         // Optionally, allow manual entry or show an empty editable table
        setExtractedData({ 
            idNumber: "Not Specified", idType: idDocType, passportNumber: "Not Specified",
            mothersName: "Not Specified", fathersName: "Not Specified", 
            passportExpiryDate: "Not Specified", passportIssueDate: "Not Specified",
            nameOnPassport: "Not Specified", countryOfUser: "Not Specified",
            dateOfBirth: "Not Specified", permanentAddress: "Not Specified", ageInYears: "Not Specified"
        });
      } finally {
        setIsLoading(false);
        setIsProcessing(false);
      }
    };

    processKycDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleEditField = (field: keyof EditableKycOutput, currentValue: string | number | undefined) => {
    setEditingField(field);
    setEditValue(String(currentValue !== undefined ? currentValue : ''));
  };

  const handleSaveEdit = () => {
    if (extractedData && editingField) {
      let currentData = { ...extractedData };
      currentData[editingField] = editValue as any; // Type assertion

      if (editingField === 'dateOfBirth') {
        currentData.ageInYears = calculateAge(editValue);
      }
      setExtractedData(currentData);
      setEditingField(null);
      toast({ title: "Details Updated", description: `${String(editingField).replace(/([A-Z])/g, ' $1').trim()} has been updated.`});
    }
  };

  const handleConfirmAndContinue = () => {
    if (!consentChecked) {
      toast({ title: "Consent Required", description: "Please provide your consent to proceed.", variant: "destructive" });
      return;
    }
    console.log("Personal KYC Data Confirmed:", extractedData);
    console.log("Consent given at:", currentTime);
    // Navigate to the next step (e.g., financial details or application summary)
    toast({ title: "Step 2 Complete!", description: "Your Personal KYC details are saved." });
    router.push('/'); // Placeholder for next step
  };
  
  const renderEditableTable = () => {
    if (!extractedData) return null;
    const dataEntries = Object.entries(extractedData) as [keyof EditableKycOutput, string | number | undefined][];

    return (
      <div className="space-y-6">
        <Table className="bg-white/10 rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Field</TableHead>
              <TableHead className="text-white">Value</TableHead>
              <TableHead className="text-white text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataEntries.map(([key, value]) => {
              const fieldLabel = String(key).replace(/([A-Z])/g, ' $1').trim();
              const isAgeField = key === 'ageInYears';
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium capitalize text-gray-300">{fieldLabel}</TableCell>
                  <TableCell className="text-gray-200">
                    {editingField === key && !isAgeField ? (
                      <Input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="bg-white/80 text-black"
                      />
                    ) : (
                      String(value !== undefined && value !== null && String(value).trim() !== '' ? value : 'Not Specified')
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingField === key && !isAgeField ? (
                      <Button onClick={handleSaveEdit} size="sm" className="gradient-border-button">
                        <Save className="mr-1 h-4 w-4" /> Save
                      </Button>
                    ) : !isAgeField ? (
                      <Button onClick={() => handleEditField(key, value)} size="sm" variant="outline" className="bg-white/20 hover:bg-white/30 text-white">
                        <Edit3 className="mr-1 h-4 w-4" /> Edit
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {renderConsentSection()}
      </div>
    );
  };

  const renderConsentSection = () => (
    <div className="mt-8 space-y-6 border-t border-gray-500/50 pt-6">
      <div className="flex items-center space-x-2">
        <Checkbox id="consent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
        <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
          I confirm that all the details mentioned above are correct.
        </Label>
      </div>
      <p className="text-xs text-gray-400">Consent captured at: {currentTime}</p>
      <div className="flex justify-center">
        <Button onClick={handleConfirmAndContinue} disabled={!consentChecked || isProcessing || isLoading} size="lg" className="gradient-border-button">
          Confirm & Continue
        </Button>
      </div>
    </div>
  );

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
          <LoanProgressBar steps={loanAppSteps} />
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
            <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl border-0 text-white rounded-xl p-6 md:p-8 max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-4">
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
                        <p className="text-base text-white">{avekaMessage}</p>
                    </div>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-lg text-white">Extracting details from your documents...</p>
                  <p className="text-sm text-gray-300">This might take a few moments.</p>
                </div>
              ) : (
                renderEditableTable()
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
