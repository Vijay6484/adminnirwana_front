import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft, Building2, Plus, X, Save, Trash2, Loader2, MapPin } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

interface Accommodation {
  id?: number;
  name: string;
  description: string;
  type: string;
  capacity: number;
  rooms: number;
  price: number;
  features: string[];
  rules: string[];
  images: string[];
  video?: string;
  available: boolean;
  subcategory?: string;
  ownerId?: number;
  cityId?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  amenityIds?: string[];
  /** Hotel manager (admin assigns); managers get this set automatically on create */
  managerId?: string;

  // Villa-specific fields
  maxPersonsVilla?: number;
  extraPersonRate?: number;
}

interface RoomTypeData {
  id?: string;
  name: string;
  type?: string;
  subType?: string;
  price: number;
  adultRate: number;
  childRate: number;
  capacity: { adults: number; children: number };
  amenities: string[];
  inventory: number;
  images: string[];
}

interface User {
  id: number | string;
  name: string;
  email: string;
}

interface City {
  id: number;
  name: string;
  country: string;
}

interface Amenity {
  id: string;
  name: string;
  icon: string;
}

const AccommodationForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isEditing = id !== undefined;

  const [formData, setFormData] = useState<Accommodation>({
    name: '',
    description: '',
    type: 'Hotel',
    capacity: 2,
    rooms: 1,
    price: 0,
    features: [],
    rules: [],
    images: [],
    video: '',
    available: true,
    subcategory: '',
    ownerId: undefined,
    cityId: undefined,
    address: '',
    latitude: undefined,
    longitude: undefined,
    amenityIds: [],
    managerId: '',

    // Villa defaults
    maxPersonsVilla: 0,
    extraPersonRate: 0,
  });

  const [rooms, setRooms] = useState<RoomTypeData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]); // NEW: Store new image files
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [newRule, setNewRule] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]); // NEW: Track existing images
  const [roomNewImageFiles, setRoomNewImageFiles] = useState<{ [index: number]: File[] }>({});
  const [managers, setManagers] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    if (isEditing && id) {
      fetchAccommodation(id);
    }

    // Fetch users, cities, and amenities on component mount
    const fetchData = async () => {
      try {
        const [usersRes, citiesRes, amenitiesRes] = await Promise.all([
          api.get('/admin/properties/users'),
          api.get('/admin/properties/cities'),
          api.get('/amenities').catch(() => ({ data: [] })),
        ]);

        setUsers(usersRes.data);
        setCities(citiesRes.data);
        const amenityList = Array.isArray(amenitiesRes.data) ? amenitiesRes.data : (amenitiesRes.data as any)?.data || [];
        setAmenities(amenityList.map((a: any) => ({
          id: String(a.id ?? a._id),
          name: a.name || '',
          icon: a.icon || 'wifi',
        })));

        if (authUser?.role === 'admin') {
          const allUsers = (await api.get('/admin/users')).data as { id: string; name: string; email: string; role: string }[];
          setManagers(allUsers.filter((u) => u.role === 'manager'));
        } else {
          setManagers([]);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load initial data');
      }
    };

    fetchData();
  }, [isEditing, id, authUser?.role]);

  const fetchAccommodation = async (accommodationId: string) => {
    setFetching(true);
    try {
      const { data } = await api.get(`/admin/properties/accommodations/${accommodationId}`);

      // Support old structure (basicInfo) and new structure (propertyData)
      const propData = data.propertyData || data.basicInfo || {};
      const locData = data.propertyData ? { address: data.propertyData.location } : data.location || {};

      setExistingImages(propData.images || []);
      setFormData({
        id: data.propertyData ? data.propertyData.id : data.id,
        name: propData.name || '',
        description: propData.description || '',
        type: propData.type || 'Hotel',
        capacity: propData.capacity || 2,
        rooms: propData.rooms || propData.inventory || 1,
        price: parseFloat(propData.price || '0') || 0,
        features: propData.features || propData.amenities || [],
        rules: propData.rules || [],
        images: propData.images || [],
        video: propData.video || '',
        available: propData.available !== undefined ? propData.available : true,
        ownerId: locData.owner?.id,
        cityId: locData.city?.id,
        address: locData.address || '',
        latitude: locData.coordinates?.latitude || undefined,
        longitude: locData.coordinates?.longitude || undefined,
        amenityIds: (data.amenities?.ids || []).map((id: any) => String(id)),
        subcategory: propData.subcategory || '',
        maxPersonsVilla: propData.maxPersonsVilla || 0,
        extraPersonRate: propData.extraPersonRate || 0,
        managerId: propData.managerId
          ? String((propData.managerId as any)?._id ?? propData.managerId)
          : '',
      });

      if (data.roomsData && Array.isArray(data.roomsData)) {
        setRooms(data.roomsData.map((r: any) => ({
          id: r._id,
          name: r.name || '',
          type: r.type || 'Standard',
          subType: r.subType || '',
          price: r.price || 0,
          adultRate: r.adultRate || 0,
          childRate: r.childRate || 0,
          capacity: r.capacity || { adults: 2, children: 0 },
          amenities: r.amenities || [],
          inventory: r.inventory || 1,
          images: r.images || []
        })));
      }
    } catch (error) {
      console.error('Error fetching accommodation:', error);
      setSubmitError('Failed to load accommodation data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (name === 'price' || name === 'capacity' || name === 'rooms' ||
      name === 'latitude' || name === 'longitude' || name === 'maxPersonsVilla' || name === 'extraPersonRate') {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : Number(value),
      });
    } else if (name === 'ownerId' || name === 'cityId') {
      setFormData({
        ...formData,
        [name]: value === '' ? undefined : Number(value),
      });
    } else if (name === 'managerId') {
      setFormData({
        ...formData,
        managerId: value,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleAmenityChange = (amenityId: string) => {
    const amenity = amenities.find(a => a.id === amenityId);
    if (!amenity) return;

    const currentAmenities = formData.amenityIds || [];
    const currentFeatures = formData.features || [];

    if (currentAmenities.includes(amenityId)) {
      setFormData({
        ...formData,
        amenityIds: currentAmenities.filter(id => id !== amenityId),
        features: currentFeatures.filter(f => f !== amenity.name)
      });
    } else {
      setFormData({
        ...formData,
        amenityIds: [...currentAmenities, amenityId],
        features: [...currentFeatures, amenity.name]
      });
    }
  };

  const addFeature = () => {
    const trimmedFeature = newFeature.trim();
    if (trimmedFeature && !formData.features.includes(trimmedFeature)) {
      setFormData({
        ...formData,
        features: [...formData.features, trimmedFeature],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    const amenity = amenities.find(a => a.name === feature);
    if (amenity) {
      setFormData({
        ...formData,
        features: formData.features.filter(f => f !== feature),
        amenityIds: formData.amenityIds?.filter(id => id !== amenity.id) || []
      });
    } else {
      setFormData({
        ...formData,
        features: formData.features.filter(f => f !== feature),
      });
    }
  };

  const addRule = () => {
    const trimmedRule = newRule.trim();
    if (trimmedRule && !formData.rules.includes(trimmedRule)) {
      setFormData({
        ...formData,
        rules: [...formData.rules, trimmedRule],
      });
      setNewRule('');
    }
  };

  const removeRule = (rule: string) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter(r => r !== rule),
    });
  };

  // NEW: Function to handle image removal
  const removeImage = (image: string) => {
    // If it's an existing image, just remove from formData
    if (existingImages.includes(image)) {
      setFormData({
        ...formData,
        images: formData.images.filter(img => img !== image),
      });
    }
    // If it's a new image (file), remove from both formData and newImageFiles
    else {
      // Find the index of the image in newImageFiles
      const index = formData.images.indexOf(image);

      setFormData({
        ...formData,
        images: formData.images.filter(img => img !== image),
      });

      // Remove the corresponding file
      setNewImageFiles(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles.splice(index, 1);
        return newFiles;
      });
    }
  };

  const addRoom = () => {
    setRooms([...rooms, {
      name: '', type: 'Standard', subType: '', price: 0, adultRate: 0, childRate: 0, capacity: { adults: 2, children: 0 }, amenities: [], inventory: 1, images: []
    }]);
  };

  const removeRoom = (index: number) => {
    const newRooms = [...rooms];
    newRooms.splice(index, 1);
    setRooms(newRooms);
  };

  const handleRoomChange = (index: number, field: string, value: any) => {
    const newRooms = [...rooms];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (newRooms[index] as any)[parent][child] = value;
    } else {
      (newRooms[index] as any)[field] = value;
    }
    setRooms(newRooms);
  };

  const handleRoomAmenityAdd = (index: number, amenityName: string) => {
    if (!amenityName) return;
    const newRooms = [...rooms];
    if (!newRooms[index].amenities.includes(amenityName)) {
      newRooms[index].amenities.push(amenityName);
    }
    setRooms(newRooms);
  };

  const handleRoomAmenityRemove = (index: number, amenityName: string) => {
    const newRooms = [...rooms];
    newRooms[index].amenities = newRooms[index].amenities.filter(a => a !== amenityName);
    setRooms(newRooms);
  };

  const handleRoomImageFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setRoomNewImageFiles(prev => ({
      ...prev,
      [index]: [...(prev[index] || []), ...newFiles]
    }));

    const previewUrls = newFiles.map(file => URL.createObjectURL(file));
    const newRooms = [...rooms];
    newRooms[index].images = [...(newRooms[index].images || []), ...previewUrls];
    setRooms(newRooms);
  };

  const removeRoomImage = (roomIndex: number, image: string) => {
    const newRooms = [...rooms];
    const imageIndex = newRooms[roomIndex].images.indexOf(image);

    newRooms[roomIndex].images = newRooms[roomIndex].images.filter(img => img !== image);
    setRooms(newRooms);

    // If it is a newly added file (exists in roomNewImageFiles)
    if (image.startsWith('blob:')) {
      setRoomNewImageFiles(prev => {
        const roomFiles = [...(prev[roomIndex] || [])];
        // Note: Blob URLs match files by addition order loosely, we assume the user removes the exact blob in preview array. 
        // For simplicity we drop it if we can find it by index roughly, or we just keep it and cleanup on upload filter. 
        // To be accurate, we'll try to slice out the corresponding index.
        const blobCount = newRooms[roomIndex].images.filter(img => img.startsWith('blob:')).length;
        // Approximation: remove the last file if we can't pinpoint.
        roomFiles.splice(imageIndex - (newRooms[roomIndex].images.length - blobCount), 1);
        return { ...prev, [roomIndex]: roomFiles };
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    // Villa-specific validation (only if type === 'Villa')
    if (formData.type === 'Villa') {
      if (!formData.maxPersonsVilla || formData.maxPersonsVilla <= 0) {
        newErrors.maxPersonsVilla = 'Maximum persons must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      // Upload new images first
      const uploadedImageUrls = await uploadImages(newImageFiles);

      // Combine existing images with new uploaded URLs
      const allImages = [
        ...formData.images.filter(img => existingImages.includes(img)), // Keep existing images that weren't removed
        ...uploadedImageUrls
      ];

      // Upload room images
      const updatedRooms = [...rooms];
      for (let i = 0; i < updatedRooms.length; i++) {
        const rFiles = roomNewImageFiles[i] || [];
        if (rFiles.length > 0) {
          const uploadedRoomUrls = await uploadImages(rFiles);
          updatedRooms[i].images = [...(updatedRooms[i].images.filter(img => !img.startsWith('blob:'))), ...uploadedRoomUrls];
        }
      }

      const requestData: any = {
        propertyData: {
          name: formData.name,
          // Public website filters off this `type` field.
          type: formData.type || 'Hotel',
          description: formData.description,
          location: formData.address || 'Unknown Location',
          address: formData.address,
          price: formData.price,
          amenities: formData.features,
          rules: formData.rules,
          images: allImages,
          video: formData.video,
          capacity: formData.capacity,
          inventory: formData.rooms,
          available: formData.available,
          subcategory: formData.subcategory,
          ...(formData.type === 'Villa' ? {
            MaxPersonVilla: formData.maxPersonsVilla,
            RatePersonVilla: formData.extraPersonRate
          } : {}),
          ...(authUser?.role === 'admin'
            ? {
                managerId: formData.managerId && formData.managerId.trim() !== ''
                  ? formData.managerId
                  : null,
              }
            : {}),
        },
        roomsData: updatedRooms
      };

      if (isEditing) {
        await api.put(`/admin/properties/accommodations/${id}`, requestData);
      } else {
        await api.post('/admin/properties/accommodations', requestData);
      }

      toast.success(`Accommodation ${isEditing ? 'updated' : 'created'} successfully!`);
      navigate('/accommodations');
    } catch (error) {
      console.error('Error saving accommodation:', error);
      const errorMessage = 'Failed to save accommodation';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  // NEW: Upload generic image files and return their URLs
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const formDataFile = new FormData();
        formDataFile.append('file', file);

        const res = await axios.post(
          'https://oraastay.com/upload_hotels_data.php',
          formDataFile,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Upload response:', res.data);
        if (res.data.success && res.data.file_url) {
          uploadedUrls.push(res.data.file_url);
        }
      }
      return uploadedUrls;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload some images');
      return [];
    }
  };

  // NEW: Handle image file selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Store files for later upload
    const newFiles = Array.from(files);
    setNewImageFiles(prev => [...prev, ...newFiles]);

    // Create preview URLs
    const previewUrls = newFiles.map(file => URL.createObjectURL(file));

    // Add preview URLs to form data
    setFormData({
      ...formData,
      images: [...formData.images, ...previewUrls]
    });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700 mr-3" />
          <span className="text-lg text-gray-600">Loading accommodation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center">
            <button
              onClick={() => navigate('/accommodations')}
              className="mr-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Property' : 'Add New Property'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing
              ? 'Update property details'
              : 'Create a new property for your resort'}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <hr className="mb-6 border-gray-200" />
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Property Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md ${errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Property Type *
                </label>
                <div className="mt-1">
                  <select
                    id="type"
                    name="type"
                    value={formData.type || 'Hotel'}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Villa">Villa</option>
                    <option value="Cottage">Cottage</option>
                    <option value="Glamping">Glamping</option>
                    <option value="Camping">Camping</option>
                    <option value="Bungalow">Bungalow</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Homestay">Homestay</option>
                    <option value="Farmhouse">Farmhouse</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Starting Price per night per person (₹) *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md ${errors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                  Subcategory
                </label>
                <div className="mt-1">
                  <select
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select Subcategory</option>
                    <option value="Luxury Resorts">Luxury Resorts</option>
                    <option value="Budget Hotels">Budget Hotels</option>
                    <option value="Family Hotels">Family Hotels</option>
                    <option value="Hotels Near Venna Lake">Hotels Near Venna Lake</option>
                    <option value="Hotels Near Arthur's Seat">Hotels Near Arthur's Seat</option>
                    <option value="Panchgani Hotels">Panchgani Hotels</option>
                    <option value="Bhilar Resorts">Bhilar Resorts</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md ${errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="video" className="block text-sm font-medium text-gray-700">
                  Video URL
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="video"
                    id="video"
                    value={formData.video || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter YouTube, Vimeo, or MP4 URL"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
                  Select Owner
                </label>
                <div className="mt-1">
                  <select
                    id="ownerId"
                    name="ownerId"
                    value={formData.ownerId || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select Owner</option>
                    {users.map(user => (
                      <option key={String(user.id)} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {authUser?.role === 'admin' && (
                <div className="sm:col-span-3">
                  <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">
                    Assigned manager
                  </label>
                  <div className="mt-1">
                    <select
                      id="managerId"
                      name="managerId"
                      value={formData.managerId || ''}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">No manager</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Managers only see hotels assigned to them.</p>
                </div>
              )}

              {/* Capacity and Rooms removed from property level */}

              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <input
                    id="available"
                    name="available"
                    type="checkbox"
                    checked={formData.available}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-700 focus:ring-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
                    Available for booking
                  </label>
                </div>
              </div>

              {/* Villa-specific inputs (shown only when type === 'Villa') */}
              {formData.type === 'Villa' && (
                <>
                  <div className="sm:col-span-2">
                    <label htmlFor="maxPersonsVilla" className="block text-sm font-medium text-gray-700">
                      Maximum Persons (Allowed)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="maxPersonsVilla"
                        id="maxPersonsVilla"
                        min={1}
                        value={formData.maxPersonsVilla}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md ${errors.maxPersonsVilla ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      {errors.maxPersonsVilla && <p className="mt-1 text-sm text-red-600">{errors.maxPersonsVilla}</p>}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="extraPersonRate" className="block text-sm font-medium text-gray-700">
                      Extra Person Rate (₹ per night)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="extraPersonRate"
                        id="extraPersonRate"
                        min={0}
                        value={formData.extraPersonRate}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Location</h2>
            </div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="cityId" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <div className="mt-1">
                  <select
                    id="cityId"
                    name="cityId"
                    value={formData.cityId || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1">
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter full address"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="latitude"
                    id="latitude"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 18.5204"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="longitude"
                    id="longitude"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 73.8567"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features & Amenities */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Features & Amenities</h2>

            {/* Custom Features */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">Custom Features</h3>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature) => (
                  <div
                    key={feature}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="ml-1.5 h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a custom feature"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md rounded-r-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="inline-flex items-center px-4 py-2 border border-transparent border-l-0 shadow-sm text-sm font-medium rounded-none rounded-r-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">Amenities</h3>
              <select
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md mb-2"
                onChange={e => {
                  const amenityId = e.target.value;
                  if (amenityId && !formData.amenityIds?.includes(amenityId)) {
                    handleAmenityChange(amenityId);
                  }
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Add Amenity
                </option>
                {amenities
                  .filter(a => !formData.amenityIds?.includes(a.id))
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenities
                  .filter(a => formData.amenityIds?.includes(a.id))
                  .map(amenity => (
                    <div key={amenity.id} className="flex items-center">
                      <span className="mr-2">{amenity.name}</span>
                      <button
                        type="button"
                        onClick={() => handleAmenityChange(amenity.id)}
                        className="ml-1.5 h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Property Rules</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.rules.map((rule) => (
                  <div
                    key={rule}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                  >
                    {rule}
                    <button
                      type="button"
                      onClick={() => removeRule(rule)}
                      className="ml-1.5 h-4 w-4 rounded-full text-red-400 hover:text-red-600 focus:outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Add a property rule (e.g., No smoking, Check-in at 2 PM)"
                  className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md rounded-r-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRule();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addRule}
                  className="inline-flex items-center px-4 py-2 border border-transparent border-l-0 shadow-sm text-sm font-medium rounded-none rounded-r-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Room Types Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Room Types</h2>
              </div>
              <button
                type="button"
                onClick={addRoom}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Room Type
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No room types added yet.</div>
            ) : (
              <div className="space-y-6">
                {rooms.map((room, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50 relative">
                    <button
                      type="button"
                      onClick={() => removeRoom(index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6 mt-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Room Name</label>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => handleRoomChange(index, 'name', e.target.value)}
                          className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="e.g., Deluxe Ocean View"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={room.type || ''}
                          onChange={(e) => handleRoomChange(index, 'type', e.target.value)}
                          className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">Select Type</option>
                          <option value="Villa">Villa</option>
                          <option value="Hotel">Hotel</option>
                          <option value="Suite">Suite</option>
                          <option value="Cottage">Cottage</option>
                          <option value="Bungalow">Bungalow</option>
                          <option value="Glamping">Glamping</option>
                          <option value="Standard">Standard Room</option>
                          <option value="Deluxe">Deluxe Room</option>
                          <option value="Camping">Camping</option>
                        </select>
                      </div>
                      
                      {/* Evaluate the applicable type for subtypes: check room.type first, fallback to property level formData.type */}
                      {(() => {
                        const subtypeCategory = (room.type === 'Villa' || room.type === 'Cottage' || room.type === 'Hotel') ? room.type : 
                                               (formData.type === 'Villa' || formData.type === 'Cottage' || formData.type === 'Hotel') ? formData.type : null;
                        
                        if (!subtypeCategory) return null;

                        return (
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Sub Type</label>
                            <select
                              value={room.subType || ''}
                              onChange={(e) => handleRoomChange(index, 'subType', e.target.value)}
                              className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            >
                              <option value="">Select Sub Type</option>
                              {subtypeCategory === 'Villa' && [...Array(8)].map((_, i) => (
                                <option key={i} value={`${i + 1}BHK`}>{`${i + 1}BHK`}</option>
                              ))}
                              {subtypeCategory === 'Cottage' && [...Array(8)].map((_, i) => (
                                <option key={i} value={`${i + 3} Room Cottage`}>{`${i + 3} Room Cottage`}</option>
                              ))}
                              {subtypeCategory === 'Hotel' && [...Array(5)].map((_, i) => (
                                <option key={i} value={`${i + 1} Bedroom`}>{`${i + 1} Bedroom`}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}

                      <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Base Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={room.price}
                          onChange={(e) => handleRoomChange(index, 'price', Number(e.target.value))}
                          className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Adult Rate (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={room.adultRate}
                          onChange={(e) => handleRoomChange(index, 'adultRate', Number(e.target.value))}
                          className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Per Extra Adult"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Child Rate (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={room.childRate}
                          onChange={(e) => handleRoomChange(index, 'childRate', Number(e.target.value))}
                          className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Per Extra Child"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Inventory</label>
                        <input
                          type="number"
                          min="1"
                          value={room.inventory}
                          onChange={(e) => handleRoomChange(index, 'inventory', Number(e.target.value))}
                          className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Capacity (Adults)</label>
                        <input
                          type="number"
                          min="1"
                          value={room.capacity.adults}
                          onChange={(e) => handleRoomChange(index, 'capacity.adults', Number(e.target.value))}
                          className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Capacity (Children)</label>
                        <input
                          type="number"
                          min="0"
                          value={room.capacity.children}
                          onChange={(e) => handleRoomChange(index, 'capacity.children', Number(e.target.value))}
                          className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Amenities</label>
                        <div className="flex items-center space-x-2 mb-2">
                          <select
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-64 sm:text-sm border-gray-300 rounded-md"
                            onChange={e => {
                              handleRoomAmenityAdd(index, e.target.value);
                              e.target.value = '';
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>Add Room Amenity</option>
                            <option value="AC">AC</option>
                            <option value="TV">TV</option>
                            <option value="Mini-bar">Mini-bar</option>
                            <option value="Balcony">Balcony</option>
                            <option value="Bathtub">Bathtub</option>
                            <option value="Ocean View">Ocean View</option>
                            <option value="Room Service">Room Service</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map(amen => (
                            <div key={amen} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {amen}
                              <button
                                type="button"
                                onClick={() => handleRoomAmenityRemove(index, amen)}
                                className="ml-1 h-3 w-3 rounded-full text-green-500 hover:text-green-700 focus:outline-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Room Images */}
                      <div className="sm:col-span-6 mt-4 border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Type Images</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleRoomImageFileChange(index, e)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          {(room.images || []).map((image, imgIndex) => (
                            <div key={imgIndex} className="relative group">
                              <img
                                src={image}
                                alt={`Room ${index + 1} Image ${imgIndex + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeRoomImage(index, image)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Property Images */}
        < div className="bg-white shadow rounded-lg overflow-hidden" >
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Property Images</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Upload Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {uploading && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading images...
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div >

        {/* Form Actions */}
        < div className="flex justify-end space-x-3" >
          <Link
            to="/accommodations"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploading}
            className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Property' : 'Create Property'}
              </>
            )}
          </button>
        </div >
      </form >
    </div >
  );
};

export default AccommodationForm;
