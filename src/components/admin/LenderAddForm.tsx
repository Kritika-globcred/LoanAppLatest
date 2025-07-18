"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getDb } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function LenderAddForm({ onSuccess, onClose }: { onSuccess?: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    lenderType: "",
    licenseNumber: "",
    kycStatus: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const db = getDb("lenders");
      await addDoc(collection(db, "lenders"), form);
      toast({ title: "Lender added successfully" });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add lender", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
      <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <Input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
      <Input name="lenderType" placeholder="Lender Type" value={form.lenderType} onChange={handleChange} />
      <Input name="licenseNumber" placeholder="License Number" value={form.licenseNumber} onChange={handleChange} />
      <Input name="kycStatus" placeholder="KYC Status" value={form.kycStatus} onChange={handleChange} />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button type="submit" disabled={loading}>Add Lender</Button>
      </div>
    </form>
  );
}
