'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { FormDialog } from '@/components/ui/form-dialog';
import { Lender, LenderFormData } from '@/types/lender';
import { LenderBulkUpload } from '@/components/admin/LenderBulkUpload';
import { getLenders, addLender, updateLender, deleteLender } from '@/services/lender-service';
import { toast } from 'react-hot-toast';

const initialFormData: LenderFormData = {
  name: '',
  description: '',
  interestRate: 0,
  maxLoanAmount: 0,
  minCreditScore: 0,
  logoUrl: '',
  website: '',
  contactEmail: '',
  isActive: true,
};

export default function LendersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [currentLender, setCurrentLender] = useState<Lender | null>(null);
  const [formData, setFormData] = useState<LenderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadLenders();
    }
  }, [user, loading, router]);

  const loadLenders = async () => {
    try {
      setIsLoading(true);
      const data = await getLenders();
      setLenders(data);
    } catch (error) {
      console.error('Failed to load lenders:', error);
      toast.error('Failed to load lenders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData((prev: LenderFormData) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: LenderFormData) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (currentLender?.id) {
        await updateLender(currentLender.id, formData);
        toast.success('Lender updated successfully');
      } else {
        await addLender(formData);
        toast.success('Lender added successfully');
      }
      
      setIsDialogOpen(false);
      setCurrentLender(null);
      setFormData(initialFormData);
      await loadLenders();
    } catch (error) {
      console.error('Error saving lender:', error);
      toast.error('Failed to save lender');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (lender: Lender) => {
    setCurrentLender(lender);
    setFormData({
      name: lender.name,
      description: lender.description,
      interestRate: lender.interestRate,
      maxLoanAmount: lender.maxLoanAmount,
      minCreditScore: lender.minCreditScore,
      logoUrl: lender.logoUrl || '',
      website: lender.website || '',
      contactEmail: lender.contactEmail,
      isActive: lender.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lender? This action cannot be undone.')) {
      try {
        await deleteLender(id);
        toast.success('Lender deleted successfully');
        await loadLenders();
      } catch (error) {
        console.error('Error deleting lender:', error);
        toast.error('Failed to delete lender');
      }
    }
  };

  const openNewLenderDialog = () => {
    setCurrentLender(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleBulkUploadComplete = () => {
    setIsBulkUploadOpen(false);
    loadLenders(); // Refresh the lenders list
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link 
              href="/admin/dashboard" 
              className="flex items-center text-indigo-600 hover:text-indigo-900 mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold">Manage Lenders</h1>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Lenders</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsBulkUploadOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                      Bulk Upload
                    </button>
                    <button
                      onClick={openNewLenderDialog}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Add Lender
                    </button>
                  </div>
                </div>

                {/* Bulk Upload Dialog */}
                <FormDialog
                  isOpen={isBulkUploadOpen}
                  onClose={() => setIsBulkUploadOpen(false)}
                  title="Bulk Upload Lenders"
                  description="Upload a CSV, PDF, or Word document to add multiple lenders at once."
                >
                  <LenderBulkUpload 
                    onComplete={handleBulkUploadComplete}
                    onClose={() => setIsBulkUploadOpen(false)}
                  />
                </FormDialog>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <ArrowPathIcon className="animate-spin h-8 w-8 text-indigo-600" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Interest Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Max Loan
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lenders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              No lenders found. Add your first lender to get started.
                            </td>
                          </tr>
                        ) : (
                          lenders.map((lender) => (
                            <tr key={lender.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {lender.logoUrl && (
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <img className="h-10 w-10 rounded-full object-contain" src={lender.logoUrl} alt={lender.name} />
                                    </div>
                                  )}
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{lender.name}</div>
                                    <div className="text-sm text-gray-500">{lender.contactEmail}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {lender.interestRate}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${lender.maxLoanAmount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lender.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {lender.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleEdit(lender)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => lender.id && handleDelete(lender.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Lender Dialog */}
      <FormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setCurrentLender(null);
          setFormData(initialFormData);
        }}
        title={currentLender ? 'Edit Lender' : 'Add New Lender'}
        onSubmit={handleSubmit}
        loading={isSubmitting}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Lender Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
              Interest Rate (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="interestRate"
              id="interestRate"
              required
              min="0"
              step="0.01"
              value={formData.interestRate}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="maxLoanAmount" className="block text-sm font-medium text-gray-700">
              Max Loan Amount ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="maxLoanAmount"
              id="maxLoanAmount"
              required
              min="0"
              value={formData.maxLoanAmount}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="minCreditScore" className="block text-sm font-medium text-gray-700">
              Min Credit Score <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="minCreditScore"
              id="minCreditScore"
              required
              min="300"
              max="850"
              value={formData.minCreditScore}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
              Logo URL
            </label>
            <input
              type="url"
              name="logoUrl"
              id="logoUrl"
              value={formData.logoUrl}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="url"
              name="website"
              id="website"
              value={formData.website}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="https://example.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="contactEmail"
              id="contactEmail"
              required
              value={formData.contactEmail}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="contact@example.com"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
