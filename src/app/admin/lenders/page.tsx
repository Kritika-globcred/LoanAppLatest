"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { DataTable } from "@/components/admin/DataTable";

const columns = [
  { key: "logoUrl", label: "Logo" },
  { key: "name", label: "Lender Name" },
  { key: "fundedUniversities", label: "List of Funded Universities" },
  { key: "fundedCourses", label: "List of Funded Courses" },
  { key: "maxLoanAmountIndia", label: "Max Loan (India)" },
  { key: "maxLoanAmountAbroad", label: "Max Loan (Abroad)" },
  { key: "loanBrandName", label: "Loan Brand Name" },
  { key: "countries", label: "List of All Countries" },
  { key: "criteria.coApplicantRequired", label: "Co-applicant Required" },
  { key: "criteria.collateralRequired", label: "Collateral Requirement" },
  { key: "criteria.loanLimits.withoutCollateral", label: "Loan Limit (No Collateral)" },
  { key: "criteria.loanLimits.withCollateral", label: "Loan Limit (With Collateral)" },
  { key: "loanType", label: "Loan Type" },
  { key: "coSignerStatus", label: "Co-Signer Status" },
  { key: "rateOfInterest", label: "Rate of Interest" },
  { key: "loanCurrency", label: "Loan Currency" },
  { key: "tuitionFeesCovered", label: "Tuition Fees Covered" },
  { key: "selfContributionFunding", label: "Self Contribution / Deposit Funding" },
  { key: "livingExpensesCovered", label: "Living Expenses Covered" },
  { key: "tatForSanctionLetter", label: "TAT for Sanction Letter" },
  { key: "lenderType", label: "Lender Type" },
  { key: "baseCountry", label: "Base Country" },
  { key: "targetNationalities", label: "Target Nationalities" },
  { key: "bankType", label: "Type of Bank" },
  { key: "criteria.minimumAcademicScore", label: "Minimum Academic Score" },
  { key: "criteria.admissionRequirement", label: "Admission Requirement" },
  { key: "criteria.eligibleCourses", label: "Eligible Courses" },
  { key: "criteria.recognizedUniversities", label: "Recognized Universities" },
  { key: "criteria.creditScoreRequirement", label: "Credit Score of Co-applicant" },
  { key: "criteria.collateralDetails.acceptedTypes", label: "Accepted Collateral Types" },
  { key: "criteria.incomeProofRequired", label: "Income Proof of Co-applicant" },
  { key: "criteria.moratoriumPeriod", label: "Moratorium Period" },
  { key: "criteria.processingTime", label: "Loan Processing Time" },
  { key: "criteria.interestRates", label: "Interest Rates" },
  { key: "criteria.prepaymentCharges", label: "Prepayment Charges" },
  { key: "criteria.easeOfApproval", label: "Ease of Approval" },
];

function flattenLender(doc: any) {
  const data = doc.data();
  const criteria = data.criteria || {};
  const truncateArr = (arr: any[] = [], n = 5) => Array.isArray(arr) ? arr.slice(0, n).join(', ') + (arr.length > n ? '…' : '') : '';
  return {
    id: doc.id,
    logoUrl: data.logoUrl || '',
    name: data.name || '',
    fundedUniversities: Array.isArray(data.fundedUniversities)
      ? (data.fundedUniversities.length > 5 ? data.fundedUniversities.slice(0, 5).join(', ') + '…' : data.fundedUniversities.join(', '))
      : (data.fundedUniversities === 'ALL' ? 'ALL' : ''),
    fundedCourses: Array.isArray(data.fundedCourses)
      ? (data.fundedCourses.length > 5 ? data.fundedCourses.slice(0, 5).join(', ') + '…' : data.fundedCourses.join(', '))
      : (data.fundedCourses === 'ALL' ? 'ALL' : ''),
    maxLoanAmountIndia: data.maxLoanAmountIndia || '',
    maxLoanAmountAbroad: data.maxLoanAmountAbroad || '',
    loanBrandName: data.loanBrandName || '',
    countries: truncateArr(data.countries, 5),
    'criteria.coApplicantRequired': criteria.coApplicantRequired === true ? 'Yes' : criteria.coApplicantRequired === false ? 'No' : '',
    'criteria.collateralRequired': criteria.collateralRequired === true ? 'Yes' : criteria.collateralRequired === false ? 'No' : '',
    'criteria.loanLimits.withoutCollateral': criteria.loanLimits?.withoutCollateral || '',
    'criteria.loanLimits.withCollateral': criteria.loanLimits?.withCollateral || '',
    // --- rest of the fields ---
    loanType: data.loanType || '',
    coSignerStatus: data.coSignerStatus || '',
    rateOfInterest: data.rateOfInterest || '',
    loanCurrency: data.loanCurrency || '',
    tuitionFeesCovered: data.tuitionFeesCovered || '',
    selfContributionFunding: data.selfContributionFunding || '',
    livingExpensesCovered: data.livingExpensesCovered || '',
    tatForSanctionLetter: data.tatForSanctionLetter || '',
    lenderType: data.lenderType || '',
    baseCountry: data.baseCountry || '',
    targetNationalities: truncateArr(data.targetNationalities || data.countries, 5),
    bankType: data.bankType || '',
    'criteria.minimumAcademicScore': criteria.minimumAcademicScore || '',
    'criteria.admissionRequirement': criteria.admissionRequirement || '',
    'criteria.eligibleCourses': truncateArr(criteria.eligibleCourses, 5),
    'criteria.recognizedUniversities': truncateArr(criteria.recognizedUniversities, 5),
    'criteria.creditScoreRequirement': criteria.creditScoreRequirement || '',
    'criteria.collateralDetails.acceptedTypes': truncateArr(criteria.collateralDetails?.acceptedTypes, 5),
    'criteria.incomeProofRequired': truncateArr(criteria.incomeProofRequired, 5),
    'criteria.moratoriumPeriod': criteria.moratoriumPeriod || '',
    'criteria.processingTime': criteria.processingTime || '',
    'criteria.interestRates': criteria.interestRates || '',
    'criteria.prepaymentCharges': criteria.prepaymentCharges || '',
    'criteria.easeOfApproval': criteria.easeOfApproval || '',
  };
}

import { deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LenderBulkUpload } from "@/components/admin/LenderBulkUpload";
import LenderAddForm from "@/components/admin/LenderAddForm";

export default function LendersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  async function fetchData() {
    setLoading(true);
    const db = getDb("lenders");
    const snap = await getDocs(collection(db, "lenders"));
    setRows(snap.docs.map(flattenLender));
    setLoading(false);
  }
  useEffect(() => {
    fetchData();
  }, []);

  // Custom cell renderer for lenders
  const renderCell = (row: any, col: any) => {
    if (col.key === 'logoUrl') {
      return row.logoUrl ? (
        <img src={row.logoUrl} alt={row.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, background: '#fff' }} />
      ) : (
        <span style={{ color: '#aaa' }}>No Logo</span>
      );
    }
    // Truncate arrays for display
    if ([
      'criteria.eligibleCourses',
      'criteria.recognizedUniversities',
      'criteria.collateralDetails.acceptedTypes',
      'criteria.incomeProofRequired',
      'targetNationalities',
      'fundedUniversities',
      'fundedCourses',
      'countries',
    ].includes(col.key)) {
      if (typeof row[col.key] === 'string') return row[col.key];
      if (Array.isArray(row[col.key])) {
        const arr = row[col.key];
        return arr.slice(0, 5).join(', ') + (arr.length > 5 ? '…' : '');
      }
      return '';
    }
    // Render booleans as Yes/No
    if ([
      'criteria.coApplicantRequired',
      'criteria.collateralRequired',
    ].includes(col.key)) {
      if (row[col.key] === true) return 'Yes';
      if (row[col.key] === false) return 'No';
      return '';
    }
    return row[col.key];
  };

  return (
    <div className="max-w-7xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Lenders</h1>
      <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800">
        <div className="mb-4 flex items-center gap-2 justify-between">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white text-sm font-semibold"
              onClick={() => setShowBulkUpload(true)}
            >
              Bulk Upload
            </button>
            <button
              className="px-4 py-2 rounded bg-green-500 text-white text-sm font-semibold"
              onClick={() => setShowAdd(true)}
            >
              Add Lender
            </button>
          </div>
          <button
            className="px-4 py-2 rounded bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
            disabled={selectedIds.length === 0}
            onClick={async () => {
              if (!window.confirm(`Delete ${selectedIds.length} selected lenders? This cannot be undone.`)) return;
              try {
                setLoading(true);
                const db = getDb("lenders");
                await Promise.all(selectedIds.map(id => deleteDoc(doc(db, "lenders", id))));
                setRows(rows => rows.filter(r => !selectedIds.includes(r.id)));
                setSelectedIds([]);
                toast({ title: "Deleted", description: `${selectedIds.length} lenders deleted.` });
              } catch (err: any) {
                toast({ title: "Error", description: err.message || "Failed to delete lenders.", variant: "destructive" });
              } finally {
                setLoading(false);
              }
            }}
          >
            Delete Selected
          </button>
          <span className="text-xs text-gray-300">{rows.length} total lenders</span>
        </div>
        <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Upload Lenders</DialogTitle>
            </DialogHeader>
            <LenderBulkUpload onComplete={() => { setShowBulkUpload(false); fetchData(); }} onClose={() => setShowBulkUpload(false)} />
          </DialogContent>
        </Dialog>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Lender</DialogTitle>
            </DialogHeader>
            <LenderAddForm onSuccess={() => { setShowAdd(false); fetchData(); }} onClose={() => setShowAdd(false)} />
          </DialogContent>
        </Dialog>

        <DataTable
          columns={columns}
          data={rows}
          renderCell={renderCell}
          onSelectRow={(ids: string[]) => setSelectedIds(ids)}
          onDeleteRow={async (rowKey: string) => {
            if (!window.confirm('Delete this lender? This cannot be undone.')) return;
            try {
              setLoading(true);
              const db = getDb("lenders");
              await deleteDoc(doc(db, "lenders", rowKey));
              setRows(rows => rows.filter(r => r.id !== rowKey));
              toast({ title: "Deleted", description: `Lender deleted.` });
            } catch (err: any) {
              toast({ title: "Error", description: err.message || "Failed to delete lender.", variant: "destructive" });
            } finally {
              setLoading(false);
            }
          }}
          loading={loading}
        />
      </div>
    </div>
  );
}
