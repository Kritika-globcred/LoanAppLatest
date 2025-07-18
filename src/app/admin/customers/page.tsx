"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { DataTable } from "@/components/admin/DataTable";
import { useToast } from "@/hooks/use-toast";


function trimText(text: string, wordLimit: number = 10) {
  if (!text) return '';
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
}

function renderCell(row: any, col: any) {
  // Render a clickable icon for any column that is a document URL or ends with 'Url'/'Doc'
  const isDocUrl = (col.key.endsWith('Url') || col.key.endsWith('Doc')) && typeof row[col.key] === 'string' && row[col.key].length > 0;
  if (isDocUrl) {
    return (
      <a
        href={row[col.key]}
        target="_blank"
        rel="noopener noreferrer"
        title={col.label}
        className="inline-block text-blue-600 hover:text-blue-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </a>
    );
  }
  // Special case: Always trim 'admissionKYC_university' to 10 words
  if (col.key === 'admissionKYC_university' && typeof row[col.key] === 'string') {
    return trimText(row[col.key], 10);
  }
  // Trim text for non-doc columns
  const value = row[col.key];
  if (typeof value === 'string') {
    return trimText(value, 10);
  }
  return value ?? '';
}


const columns = [
  // Personal KYC
  { key: "personalKYC_age", label: "Age (in Years)", group: "Personal KYC" },
  { key: "personalKYC_dob", label: "Date of Birth", group: "Personal KYC" },
  { key: "personalKYC_fatherName", label: "Father’s Name", group: "Personal KYC" },
  { key: "personalKYC_motherName", label: "Mother’s Name", group: "Personal KYC" },
  { key: "personalKYC_nameOnPassport", label: "Name on Passport", group: "Personal KYC" },
  { key: "personalKYC_passportNumber", label: "Passport Number", group: "Personal KYC" },
  { key: "personalKYC_passportIssueDate", label: "Passport Issue Date", group: "Personal KYC" },
  { key: "personalKYC_passportExpiryDate", label: "Passport Expiry Date", group: "Personal KYC" },
  { key: "personalKYC_idType", label: "ID Type", group: "Personal KYC" },
  { key: "personalKYC_idNumber", label: "ID Number", group: "Personal KYC" },
  { key: "personalKYC_countryOfUser", label: "Country of User", group: "Personal KYC" },
  { key: "personalKYC_permanentAddress", label: "Permanent Address", group: "Personal KYC" },
  { key: "personalKYC_consentTimestamp", label: "Consent Timestamp", group: "Personal KYC" },
  { key: "personalKYC_nationalIdDoc", label: "National ID / PAN Card URL", group: "Personal KYC" },
  { key: "personalKYC_passportDoc", label: "Passport URL", group: "Personal KYC" },

  // Graduation
  { key: "graduation_cgpa", label: "CGPA", group: "Graduation" },
  { key: "graduation_level", label: "Level", group: "Graduation" },
  { key: "graduation_completionDate", label: "Completion Date", group: "Graduation" },
  { key: "graduation_naReason", label: "NA Reason", group: "Graduation" },
  { key: "graduation_pursuingCourse", label: "Pursuing Course", group: "Graduation" },
  { key: "graduation_pursuingType", label: "Pursuing Type", group: "Graduation" },
  { key: "graduation_scale", label: "Scale", group: "Graduation" },

  // Post Graduation
  { key: "postGraduation_level", label: "Level", group: "Post Graduation" },
  { key: "postGraduation_cgpa", label: "CGPA", group: "Post Graduation" },
  { key: "postGraduation_naReason", label: "NA Reason", group: "Post Graduation" },
  { key: "postGraduation_pursuingCourse", label: "Pursuing Course", group: "Post Graduation" },
  { key: "postGraduation_pursuingType", label: "Pursuing Type", group: "Post Graduation" },
  { key: "postGraduation_scale", label: "Scale", group: "Post Graduation" },

  // Language Test
  { key: "languageTest_given", label: "Given", group: "Language Test" },
  { key: "languageTest_type", label: "Type", group: "Language Test" },
  { key: "languageTest_ieltsScore", label: "IELTS Score", group: "Language Test" },
  { key: "languageTest_score", label: "Score", group: "Language Test" },
  { key: "languageTest_otherName", label: "Other Name", group: "Language Test" },

  // Course Test
  { key: "courseTest_given", label: "Given", group: "Course Test" },
  { key: "courseTest_type", label: "Type", group: "Course Test" },
  { key: "courseTest_score", label: "Score", group: "Course Test" },
  { key: "courseTest_otherName", label: "Other Name", group: "Course Test" },

  // Admission KYC
  { key: "admissionKYC_admissionFees", label: "Admission Fees", group: "Admission KYC" },
  { key: "admissionKYC_admissionLevel", label: "Admission Level", group: "Admission KYC" },
  { key: "admissionKYC_degreeLevel", label: "Degree Level", group: "Admission KYC" },
  { key: "admissionKYC_country", label: "Country", group: "Admission KYC" },
  { key: "admissionKYC_courseName", label: "Course Name", group: "Admission KYC" },
  { key: "admissionKYC_courseStartDate", label: "Course Start Date", group: "Admission KYC" },
  { key: "admissionKYC_offerLetterType", label: "Offer Letter Type", group: "Admission KYC" },
  { key: "admissionKYC_offerLetterUrl", label: "Offer Letter URL", group: "Admission KYC" },
  { key: "admissionKYC_universityName", label: "University Name", group: "Admission KYC" },
  { key: "admissionKYC_studentName", label: "Student Name", group: "Admission KYC" },
  { key: "admissionKYC_applicationType", label: "Application Type", group: "Admission KYC" },
  { key: "admissionKYC_countryCode", label: "Country Code", group: "Admission KYC" },
  { key: "admissionKYC_countryShortName", label: "Country Short Name", group: "Admission KYC" },
  { key: "admissionKYC_consentTimestamp", label: "Consent Timestamp", group: "Admission KYC" },

  // Work & Employment
  { key: "work_isCurrentlyWorking", label: "Is Currently Working", group: "Work & Employment" },
  { key: "work_monthlySalary", label: "Monthly Salary", group: "Work & Employment" },
  { key: "work_salaryCurrency", label: "Salary Currency", group: "Work & Employment" },
  { key: "work_familyMonthlySalary", label: "Family Monthly Salary", group: "Work & Employment" },
  { key: "work_familySalaryCurrency", label: "Family Salary Currency", group: "Work & Employment" },
  { key: "work_experienceYears", label: "Work Experience Years", group: "Work & Employment" },
  { key: "work_experienceMonths", label: "Work Experience Months", group: "Work & Employment" },
  { key: "work_experienceIndustry", label: "Work Experience Industry", group: "Work & Employment" },
  { key: "work_experienceProofType", label: "Work Experience Proof Type", group: "Work & Employment" },
  { key: "work_linkedinUrl", label: "LinkedIn URL", group: "Work & Employment" },
  { key: "work_consentTimestamp", label: "Consent Timestamp", group: "Work & Employment" },
  { key: "work_updatedAt", label: "Updated At", group: "Work & Employment" },

  // Co-Signatory
  { key: "coSignatory_choice", label: "Co-Signatory Choice", group: "Co-Signatory" },
  { key: "coSignatory_nameOnId", label: "Name on ID", group: "Co-Signatory" },
  { key: "coSignatory_idType", label: "ID Type", group: "Co-Signatory" },
  { key: "coSignatory_idNumber", label: "ID Number", group: "Co-Signatory" },
  { key: "coSignatory_relationship", label: "Co-Signatory Relationship", group: "Co-Signatory" },
  { key: "coSignatory_idUrl", label: "Co-Signatory ID URL", group: "Co-Signatory" },
  { key: "coSignatory_consentTimestamp", label: "Consent Timestamp", group: "Co-Signatory" },
  { key: "coSignatory_reviewedTimestamp", label: "Reviewed Timestamp", group: "Co-Signatory" },

  // User Info
  { key: "user_mobileNumber", label: "Mobile Number", group: "User Info" },
  { key: "user_userId", label: "User ID", group: "User Info" },
  { key: "user_hasOfferLetter", label: "Has Offer Letter", group: "User Info" },
];

function flattenCustomer(doc: any) {
  const data = doc.data();
  const personalKYC = data.personalKyc ?? {};
  const graduation = (data.academicKyc?.graduation ?? {});
  const postGraduation = (data.academicKyc?.postGraduation ?? {});
  const languageTest = (data.academicKyc?.languageTest ?? {});
  const courseTest = (data.academicKyc?.courseTest ?? {});
  const admissionKYC = data.admissionKyc ?? {};
  const work = data.professionalKyc?.workEmployment ?? {};
  const coSignatory = data.professionalKyc?.coSignatory ?? {};

  // Helper for timestamps
  function formatTS(ts: any) {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return String(ts);
  }

  return {
    // Personal KYC
    personalKYC_age: personalKYC.age ?? '',
    personalKYC_dob: personalKYC.dateOfBirth ?? personalKYC.dob ?? '',
    personalKYC_fatherName: personalKYC.fatherName ?? '',
    personalKYC_motherName: personalKYC.motherName ?? '',
    personalKYC_nameOnPassport: personalKYC.nameOnPassport ?? '',
    personalKYC_passportNumber: personalKYC.passportNumber ?? '',
    personalKYC_passportIssueDate: personalKYC.passportIssueDate ?? '',
    personalKYC_passportExpiryDate: personalKYC.passportExpiryDate ?? '',
    personalKYC_idType: personalKYC.idType ?? personalKYC.nationalIdType ?? '',
    personalKYC_idNumber: personalKYC.idNumber ?? personalKYC.nationalIdNumber ?? '',
    personalKYC_countryOfUser: personalKYC.countryOfUser ?? personalKYC.country ?? '',
    personalKYC_permanentAddress: personalKYC.permanentAddress ?? '',
    personalKYC_consentTimestamp: formatTS(personalKYC.consentTimestamp),
    personalKYC_nationalIdDoc: personalKYC.nationalIdDoc ?? personalKYC.idDocumentUrl ?? '',
    personalKYC_passportDoc: personalKYC.passportDoc ?? personalKYC.passportUrl ?? '',

    // Graduation
    graduation_cgpa: graduation.cgpa ?? '',
    graduation_level: graduation.level ?? '',
    graduation_completionDate: graduation.completionDate ?? '',
    graduation_naReason: graduation.naReason ?? '',
    graduation_pursuingCourse: graduation.pursuingCourse ?? '',
    graduation_pursuingType: graduation.pursuingType ?? '',
    graduation_scale: graduation.scale ?? '',

    // Post Graduation
    postGraduation_level: postGraduation.level ?? '',
    postGraduation_cgpa: postGraduation.cgpa ?? '',
    postGraduation_naReason: postGraduation.naReason ?? '',
    postGraduation_pursuingCourse: postGraduation.pursuingCourse ?? '',
    postGraduation_pursuingType: postGraduation.pursuingType ?? '',
    postGraduation_scale: postGraduation.scale ?? '',

    // Language Test
    languageTest_given: languageTest.given ?? '',
    languageTest_type: languageTest.type ?? '',
    languageTest_ieltsScore: languageTest.ieltsScore ?? '',
    languageTest_score: languageTest.score ?? '',
    languageTest_otherName: languageTest.otherName ?? '',

    // Course Test
    courseTest_given: courseTest.given ?? '',
    courseTest_type: courseTest.type ?? '',
    courseTest_score: courseTest.score ?? '',
    courseTest_otherName: courseTest.otherName ?? '',

    // Admission KYC
    admissionKYC_admissionFees: admissionKYC.admissionFees ?? '',
    admissionKYC_admissionLevel: admissionKYC.admissionLevel ?? '',
    admissionKYC_degreeLevel: admissionKYC.degreeLevel ?? '',
    admissionKYC_country: admissionKYC.country ?? '',
    admissionKYC_courseName: admissionKYC.courseName ?? '',
    admissionKYC_courseStartDate: admissionKYC.courseStartDate ?? '',
    admissionKYC_offerLetterType: admissionKYC.offerLetterType ?? '',
    admissionKYC_offerLetterUrl: admissionKYC.offerLetterUrl ?? '',
    admissionKYC_universityName: admissionKYC.universityName ?? '',
    admissionKYC_studentName: admissionKYC.studentName ?? '',
    admissionKYC_applicationType: admissionKYC.applicationType ?? '',
    admissionKYC_countryCode: admissionKYC.countryCode ?? '',
    admissionKYC_countryShortName: admissionKYC.countryShortName ?? '',
    admissionKYC_consentTimestamp: formatTS(admissionKYC.consentTimestamp),

    // Work & Employment
    work_isCurrentlyWorking: work.isCurrentlyWorking ?? '',
    work_monthlySalary: work.monthlySalary ?? '',
    work_salaryCurrency: work.salaryCurrency ?? '',
    work_familyMonthlySalary: work.familyMonthlySalary ?? '',
    work_familySalaryCurrency: work.familySalaryCurrency ?? '',
    work_experienceYears: work.workExperienceYears ?? work.years ?? '',
    work_experienceMonths: work.workExperienceMonths ?? work.months ?? '',
    work_experienceIndustry: work.workExperienceIndustry ?? work.industry ?? '',
    work_experienceProofType: work.workExperienceProofType ?? '',
    work_linkedinUrl: work.linkedInUrl ?? '',
    work_consentTimestamp: formatTS(work.consentTimestamp),
    work_updatedAt: formatTS(work.updatedAt),

    // Co-Signatory
    coSignatory_choice: coSignatory.choice ?? '',
    coSignatory_nameOnId: coSignatory.nameOnId ?? '',
    coSignatory_idType: coSignatory.idType ?? '',
    coSignatory_idNumber: coSignatory.idNumber ?? '',
    coSignatory_relationship: coSignatory.coSignatoryRelationship ?? '',
    coSignatory_idUrl: coSignatory.coSignatoryIdUrl ?? '',
    coSignatory_consentTimestamp: formatTS(coSignatory.consentTimestamp),
    coSignatory_reviewedTimestamp: formatTS(coSignatory.reviewedTimestamp),

    // User Info
    user_mobileNumber: data.mobileNumber ?? '',
    user_userId: doc.id,
    user_hasOfferLetter: typeof admissionKYC.hasOfferLetter === 'boolean' ? (admissionKYC.hasOfferLetter ? 'Yes' : 'No') : (admissionKYC.hasOfferLetter ?? ''),
  };
}

function renderDocIcon(url: string, label: string) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="inline-block text-blue-600 hover:text-blue-800"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </a>
  );
}

function DeleteCustomerButton({ customerId, onDeleted }: { customerId: string, onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getDb("customer");
      await deleteDoc(doc(db, "customer", customerId));
      setLoading(false);
      setShowConfirm(false);
      onDeleted();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to delete");
    }
  };
}

export default function CustomersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Export customers to CSV
  const exportToCsv = () => {
    if (rows.length === 0) return;
    const header = columns.map(col => `"${col.label}"`).join(',');
    const csvRows = rows.map(row => {
      return columns.map(col => {
        const raw = row[col.key];
        if (raw === undefined || raw === null) return '';
        // Escape quotes by doubling them per CSV spec
        return `"${String(raw).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = [header, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const db = getDb("customer");
      const snap = await getDocs(collection(db, "customer"));
      setRows(snap.docs.map(flattenCustomer));
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-10 bg-gray-900 text-white min-h-screen">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Customers</h1>
          <p className="text-gray-300">All registered customers and their admission KYC details.</p>
        </div>
        <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800">
          {loading ? (
            <div className="flex items-center justify-center min-h-[10rem]">
              <span className="text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  className="px-4 py-2 rounded bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                  disabled={selectedIds.length === 0}
                  onClick={async () => {
                    if (!window.confirm(`Delete ${selectedIds.length} selected customers? This cannot be undone.`)) return;
                    try {
                      setLoading(true);
                      const db = getDb("customer");
                      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, "customer", id))));
                      setRows(rows => rows.filter(r => !selectedIds.includes(r.user_userId)));
                      setSelectedIds([]);
                      toast({ title: "Deleted", description: `${selectedIds.length} customers deleted.` });
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message || "Failed to delete customers.", variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Delete Selected
                </button>
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                    onClick={exportToCsv}
                    disabled={rows.length === 0}
                  >
                    Download CSV
                  </button>
                  <span className="text-xs text-gray-300">{rows.length} total customers</span>
                </div>
              </div>
              <DataTable
                columns={columns}
                data={rows}
                onSelectRow={(ids: string[]) => setSelectedIds(ids)}
                renderCell={(row, col) => {
                  if (col.key === '__actions') return null;
                  return renderCell(row, col);
                }}
                onDeleteRow={async (rowKey: string) => {
                  if (!window.confirm('Delete this customer? This cannot be undone.')) return;
                  try {
                    setLoading(true);
                    const db = getDb("customer");
                    await deleteDoc(doc(db, "customer", rowKey));
                    setRows((rows: any[]) => rows.filter((r: any) => (r.user_userId || r.id || r.key) !== rowKey));
                    setSelectedIds((ids: string[]) => ids.filter((id: string) => id !== rowKey));
                    toast({ title: "Deleted", description: `Customer deleted.` });
                  } catch (err: any) {
                    toast({ title: "Delete failed", description: err?.message || "Unknown error" });
                  } finally {
                    setLoading(false);
                  }
                }}
                loading={loading}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// End of CustomersPage.tsx