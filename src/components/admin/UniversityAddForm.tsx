"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getDb } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function UniversityAddForm({ onSuccess, onClose }: { onSuccess?: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    country: "",
    state: "",
    city: "",
    website: "",
    admission: "",
    courses: "",
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
      const db = getDb("university");
      await addDoc(collection(db, "universities"), form);
      toast({ title: "University added successfully" });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add university", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="name" placeholder="University Name" value={form.name} onChange={handleChange} required />
      <Input name="country" placeholder="Country" value={form.country} onChange={handleChange} required />
      <Input name="state" placeholder="State" value={form.state} onChange={handleChange} required />
      <Input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
      <Input name="website" placeholder="Website" value={form.website} onChange={handleChange} />
      <Input name="admission" placeholder="Admission Info" value={form.admission} onChange={handleChange} />
      <Input name="courses" placeholder="Courses" value={form.courses} onChange={handleChange} />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button type="submit" disabled={loading}>Add University</Button>
      </div>
    </form>
  );
}
