'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Fragment, useCallback } from 'react';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { University, UniversityFormData } from '@/types/university';
import { getUniversities, addUniversity, updateUniversity, deleteUniversity, bulkUploadUniversities } from '@/services/university-service';
import { toast } from 'react-hot-toast';
import BulkUploadDialog from '@/components/universities/BulkUploadDialog';
import { Country, CountrySelect } from '@/components/ui/country-select';

const initialFormData: UniversityFormData = {
  name: '',
  shortName: '',
  countries: [],
  country: '', // Legacy field, will be kept for backward compatibility
  city: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  logoUrl: '',
  isActive: true,
};

export default function UniversitiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUniversity, setCurrentUniversity] = useState<University | null>(null);
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [universityToDelete, setUniversityToDelete] = useState<string | null>(null);

  // Load universities and handle authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadUniversities();
    }
  }, [user, authLoading, router]);

  // Load universities from the API
  const loadUniversities = async () => {
    try {
      setIsLoading(true);
      const { data } = await getUniversities();
      setUniversities(data);
    } catch (error) {
      console.error('Failed to load universities:', error);
      toast.error('Failed to load universities');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle country selection changes
  const handleCountryChange = (selected: string[]) => {
    setFormData(prev => ({
      ...prev,
      countries: selected,
      // Keep the first country as the legacy country field for backward compatibility
      country: selected[0] || ''
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (currentUniversity?.id) {
        await updateUniversity(currentUniversity.id, formData);
        toast.success('University updated successfully');
      } else {
        await addUniversity(formData);
        toast.success('University added successfully');
      }
      
      setIsDialogOpen(false);
      setCurrentUniversity(null);
      setFormData(initialFormData);
      await loadUniversities();
    } catch (error) {
      console.error('Error saving university:', error);
      toast.error('Failed to save university');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit button click
  const handleEdit = (university: University) => {
    setCurrentUniversity(university);
    setFormData({
      name: university.name,
      shortName: university.shortName || '',
      countries: university.countries || [university.country].filter(Boolean) as string[],
      country: university.country || '',
      city: university.city || '',
      address: university.address || '',
      website: university.website || '',
      email: university.email || '',
      phone: university.phone || '',
      logoUrl: university.logoUrl || '',
      isActive: university.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (id: string) => {
    setUniversityToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Confirm and execute deletion
  const confirmDelete = async () => {
    if (!universityToDelete) return;
    
    try {
      await deleteUniversity(universityToDelete);
      toast.success('University deleted successfully');
      await loadUniversities();
    } catch (error) {
      console.error('Error deleting university:', error);
      toast.error('Failed to delete university');
    } finally {
      setIsDeleteDialogOpen(false);
      setUniversityToDelete(null);
    }
  };

  // Open the dialog for adding a new university
  const openNewUniversityDialog = () => {
    setCurrentUniversity(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  // Show loading state while authenticating
  if (authLoading || !user) {
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
            <h1 className="text-xl font-bold">Manage Universities</h1>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Universities</h1>
                  <div className="space-x-3 flex">
                    <Link
                      href="/admin/universities/upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Bulk Upload
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentUniversity(null);
                        setFormData(initialFormData);
                        setIsDialogOpen(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Add University
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {universities.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              No universities found. Add your first university to get started.
                            </td>
                          </tr>
                        ) : (
                          universities.map((university) => (
                            <tr key={university.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {university.logoUrl && (
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <img className="h-10 w-10 rounded-full" src={university.logoUrl} alt={university.name} />
                                    </div>
                                  )}
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{university.name}</div>
                                    {university.shortName && (
                                      <div className="text-sm text-gray-500">{university.shortName}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {(university.countries?.length > 0 
                                    ? university.countries.join(', ') 
                                    : university.country) || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${university.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {university.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleEdit(university)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => university.id && handleDeleteClick(university.id)}
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

      {/* Add/Edit University Dialog */}
      <Transition.Root show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDialogOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        {currentUniversity ? 'Edit University' : 'Add New University'}
                      </Dialog.Title>
                      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            University Name *
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="name"
                              id="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="shortName" className="block text-sm font-medium text-gray-700">
                            Short Name
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="shortName"
                              id="shortName"
                              value={formData.shortName}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Countries *
                          </label>
                          <CountrySelect
                            selected={formData.countries || []}
                            onChange={handleCountryChange}
                            multiple={true}
                            placeholder="Select countries..."
                            className="mt-1"
                          />
                          <p className="mt-1 text-xs text-gray-500">Select all countries where this university operates</p>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="city"
                              id="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                            Website
                          </label>
                          <div className="mt-1">
                            <input
                              type="url"
                              name="website"
                              id="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <div className="mt-1">
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <div className="mt-1">
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                            Logo URL
                          </label>
                          <div className="mt-1">
                            <input
                              type="url"
                              name="logoUrl"
                              id="logoUrl"
                              value={formData.logoUrl}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <div className="flex items-center">
                            <input
                              id="isActive"
                              name="isActive"
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                              Active
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                          {currentUniversity ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>{currentUniversity ? 'Update University' : 'Add University'}</>
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Delete Confirmation Dialog */}
      <Transition.Root show={isDeleteDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteDialogOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Delete University
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete this university? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                      onClick={confirmDelete}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}
