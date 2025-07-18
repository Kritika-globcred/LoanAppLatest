"use client";
import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { DataTable } from "@/components/admin/DataTable";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UniversityUpload from "@/components/admin/UniversityUpload";
import UniversityAddForm from "@/components/admin/UniversityAddForm";

const columns = [
  { key: "name", label: "University / College Name" },
  { key: "country", label: "Country" },
  { key: "currency", label: "Fees Currency" },
  { key: "feesDestinationCurrency", label: "Fees in Destination Currency" },
  { key: "feesINR", label: "Fees - INR" },
  { key: "inrSelfContributionDeposit", label: "INR - Self Contribution / Deposit" },
  { key: "selfContributionDepositDestinationCurrency", label: "Self Contribution / Deposit (Destination Currency)" },
  { key: "scholarships", label: "Scholarships" },
  { key: "tatForOffer", label: "TAT for University Offer" },
  { key: "employabilitySuccess", label: "Employability Success" },
  { key: "courses", label: "List of Course(s)" },
];

function flattenUniversity(doc: any) {
  const data = doc.data();
  // Format createdAt
  let createdAt = '';
  if (data.createdAt) {
    if (typeof data.createdAt.toDate === 'function') {
      createdAt = data.createdAt.toDate().toLocaleString();
    } else if (data.createdAt.seconds) {
      createdAt = new Date(data.createdAt.seconds * 1000).toLocaleString();
    } else {
      createdAt = String(data.createdAt);
    }
  }
  // Format courses and admission fields for display
  let courses = '';
  if (Array.isArray(data.courses)) {
    courses = data.courses.map((c: any) => typeof c === 'string' ? c : c?.name || '').filter(Boolean).join(', ');
  } else if (typeof data.courses === 'string') {
    courses = data.courses;
  }
  let admission = '';
  if (typeof data.admission === 'object' && data.admission !== null) {
    admission = Object.values(data.admission).join(', ');
  } else if (typeof data.admission === 'string') {
    admission = data.admission;
  }
  return {
    id: doc.id,
    name: data.name ?? '',
    country: data.country ?? '',
    currency: data.currency ?? '',
    feesDestinationCurrency: data.feesDestinationCurrency ?? '',
    feesINR: data.feesINR ?? '',
    inrSelfContributionDeposit: data.inrSelfContributionDeposit ?? '',
    selfContributionDepositDestinationCurrency: data.selfContributionDepositDestinationCurrency ?? '',
    scholarships: data.scholarships ?? '',
    tatForOffer: data.tatForOffer ?? '',
    employabilitySuccess: data.employabilitySuccess ?? '',
    state: data.state ?? '',
    city: data.city ?? '',
    website: data.website ?? '',
    admission,
    courses,
    createdAt,
  };
}

export default function UniversitiesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  async function fetchData() {
    setLoading(true);
    const db = getDb("university");
    const snap = await getDocs(collection(db, "universities"));
    setRows(snap.docs.map(flattenUniversity));
    setLoading(false);
  }
  useEffect(() => {
    fetchData();
  }, []);

  // Custom cell renderer for courses column
  const renderCell = (row: any, col: any) => {
    if (col.key === 'courses' && typeof row.courses === 'string') {
      const words = row.courses.split(/\s+/);
      const shortText = words.slice(0, 10).join(' ');
      return words.length > 10 ? shortText + '…' : shortText;
    }
    return row[col.key];
  };

  return (
    <div className="max-w-7xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Universities</h1>
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
              Add University
            </button>
          </div>
          <button
            className="px-4 py-2 rounded bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
            disabled={selectedIds.length === 0}
            onClick={async () => {
              if (!window.confirm(`Delete ${selectedIds.length} selected universities? This cannot be undone.`)) return;
              try {
                setLoading(true);
                const db = getDb("university");
                await Promise.all(selectedIds.map(id => deleteDoc(doc(db, "universities", id))));
                setRows(rows => rows.filter(r => !selectedIds.includes(r.id)));
                setSelectedIds([]);
                toast({ title: "Deleted", description: `${selectedIds.length} universities deleted.` });
              } catch (err: any) {
                toast({ title: "Error", description: err.message || "Failed to delete universities.", variant: "destructive" });
              } finally {
                setLoading(false);
              }
            }}
          >
            Delete Selected
          </button>
          <span className="text-xs text-gray-300">{rows.length} total universities</span>
        </div>
        <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Upload Universities</DialogTitle>
            </DialogHeader>
            <UniversityUpload onSuccess={() => { setShowBulkUpload(false); fetchData(); }} />
          </DialogContent>
        </Dialog>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add University</DialogTitle>
            </DialogHeader>
            <UniversityAddForm onSuccess={() => { setShowAdd(false); fetchData(); }} onClose={() => setShowAdd(false)} />
          </DialogContent>
        </Dialog>
        <DataTable
          columns={columns}
          data={rows}
          renderCell={renderCell}
          onSelectRow={(ids: string[]) => setSelectedIds(ids)}
          onDeleteRow={async (rowKey: string) => {
            if (!window.confirm('Delete this university? This cannot be undone.')) return;
            try {
              setLoading(true);
              const db = getDb("university");
              await deleteDoc(doc(db, "universities", rowKey));
              setRows(rows => rows.filter(r => r.id !== rowKey));
              toast({ title: "Deleted", description: `University deleted.` });
            } catch (err: any) {
              toast({ title: "Error", description: err.message || "Failed to delete university.", variant: "destructive" });
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
