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
  country: '',
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
      const data = await getUniversities();
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
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Universities</h2>
                <p className="text-gray-600">University management interface will be available here.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
