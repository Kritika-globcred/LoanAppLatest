'use client';

import { UniversityUpload } from '@/components/admin/UniversityUpload';

export default function UniversityUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">University Management</h1>
      <div className="space-y-8">
        <UniversityUpload />
      </div>
    </div>
  );
}
