import { useState, useEffect } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, X, Trash2, Edit2, AlertCircle, CheckCircle, Building2 } from 'lucide-react';

// API Configuration
// const admin_BASE_URL = 'https://a.plumeriaretreat.com/admin/calendar';

interface Accommodation {
  id: number;
  name: string;
  type: string;
  rooms: number;
  package?: {
    pricing?: {
      adult: string;
      child: string;
    };
  };
  adult_price?: number | null;
  child_price?: number | null;
}

interface BlockedDate {
  id: number;
  blocked_date: string;
  reason?: string;
  accommodation_id?: number;
  accommodation_name?: string;
  rooms?: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  updated_at:string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface BookedRoomData {
  date: string;
  accommodation_id: number;
  booked_rooms: number;
}

const Calendar = () => {
  // State
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [reason, setReason] = useState('');
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingDate, setEditingDate] = useState<BlockedDate | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [adultPrice, setAdultPrice] = useState<number | ''>('');
  const [childPrice, setChildPrice] = useState<number | ''>('');
  const [availableRoomsForRoomSection,setAvailableRoomsForRoomSection]=useState(0);
  const [availableRooms, setAvailableRooms] = useState<number | null>(null);
  const [isFetchingBookedRooms, setIsFetchingBookedRooms] = useState(false);
  const [roomStatus, setRoomStatus] = useState<{ [key: number]: 'available' | 'blocked' }>({});
  const [isProcessingDayClick, setIsProcessingDayClick] = useState(false);

  // Fetch data
  const fetchBlockedDates = async () => {
    // Commented out API call - using mock data
    // try {
    //   setLoading(true);
    //   const response = await fetch(`${admin_BASE_URL}/blocked-dates`);
    //   if (!response.ok) throw new Error('Failed to fetch blocked dates');

    //   const data = await response.json();
    //   if (data.success) {
    //     const formattedData = data.data.map((item: BlockedDate) => ({
    //       ...item,
    //       blocked_date: item.blocked_date.split('T')[0]
    //     }));
    //     setBlockedDates(formattedData);
    //   } else {
    //     setError(data.message || 'Failed to fetch blocked dates');
    //   }
    // } catch (err) {
    //   setError('Error connecting to server');
    //   console.error('Fetch error:', err);
    // } finally {
    //   setLoading(false);
    // }
    
    // Mock data
    setLoading(true);
    setTimeout(() => {
      setBlockedDates([]);
      setLoading(false);
    }, 500);
  };

  const fetchAccommodations = async () => {
    // Commented out API call - using mock data
    // try {
    //   const response = await fetch(`https://a.plumeriaretreat.com/admin/properties/accommodations`);
    //   if (!response.ok) throw new Error('Failed to fetch accommodations');

    //   const data = await response.json();
    //   if (data.data.length > 0) {
    //     setAccommodations(data.data);
    //   }
    // } catch (err) {
    //   console.error('Error fetching accommodations:', err);
    //   setError('Failed to load accommodations');
    // }
    
    // Mock accommodations
    setAccommodations([
      {
        id: 1,
        name: 'Lake View Villa',
        type: 'Villa',
        rooms: 3,
        package: {
          pricing: {
            adult: '5000',
            child: '2500'
          }
        }
      }
    ]);
  };

  const fetchBookedRooms = async (accommodationId: number, checkInDate: string) => {
    // Commented out API call - return mock data
    // try {
    //   setIsFetchingBookedRooms(true);
    //   const response = await fetch(`https://a.plumeriaretreat.com/admin/bookings/room-occupancy?check_in=${checkInDate}&id=${accommodationId}`);
    //   if (!response.ok) {
    //     throw new Error('Failed to fetch booked rooms');
    //   }
    //   const data = await response.json();
    //   return data.total_rooms || 0;
    // } catch (error) {
    //   console.error('Error fetching booked rooms:', error);
    //   return 0;
    // } finally {
    //   setIsFetchingBookedRooms(false);
    // }
    
    // Mock booked rooms
    setIsFetchingBookedRooms(true);
    setTimeout(() => setIsFetchingBookedRooms(false), 500);
    return 0;
  };

  useEffect(() => {
    fetchBlockedDates();
    fetchAccommodations();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const getDefaultPrices = (accommodationId: number | null) => {
    if (!accommodationId) return { adult: null, child: null };

    const accommodation = accommodations.find(a => a.id === accommodationId);
    if (!accommodation?.package?.pricing) return { adult: null, child: null };

    return {
      adult: parseFloat(accommodation.package.pricing.adult) || null,
      child: parseFloat(accommodation.package.pricing.child) || null
    };
  };
  // Deduplicate blockedDates by accommodation_id + blocked_date, keeping latest updated_at
const getLatestBlockedDates = (data: typeof blockedDates) => {
  const map = new Map<string, any>();

  data.forEach(item => {
    const key = `${item.accommodation_id}_${item.blocked_date}`;
    const existing = map.get(key);

    if (!existing || new Date(item.updated_at) > new Date(existing.updated_at)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
};


const calculateAvailableRooms = async (
  accommodationId: number,
  dateStr: string
): Promise<number | null> => {
  const accommodation = accommodations.find(a => a.id === accommodationId);
  if (!accommodation) return null;

  const totalRooms = Number(accommodation.rooms);

  // Preprocess to keep only latest updated record per date per accommodation
  const getLatestBlockedDates = (data: typeof blockedDates) => {
    const map = new Map<string, any>();
    data.forEach(item => {
      const key = `${item.accommodation_id}_${item.blocked_date}`;
      const existing = map.get(key);
      if (!existing || new Date(item.updated_at) > new Date(existing.updated_at)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  };

  const latestBlockedDates = getLatestBlockedDates(blockedDates);

  console.log("Date Str is:", dateStr);

  // Filter for the given date
  const blockedForDate = latestBlockedDates.filter(b => {
    const blockedDateStr =
      typeof b.blocked_date === "string"
        ? b.blocked_date.trim().slice(0, 10)
        : format(new Date(b.blocked_date), "yyyy-MM-dd");

    return (
      b.accommodation_id === accommodationId &&
      blockedDateStr === dateStr &&
      (editingDate ? b.id !== editingDate.id : true)
    );
  });

  console.log("Blocked Dates for this day:", blockedForDate);

  // If any block has rooms=null => all rooms blocked
  if (blockedForDate.some(b => b.rooms === null)) {
    return 0;
  }

  const blockedRooms = blockedForDate.reduce(
    (sum, b) => sum + (Number(b.rooms) || 0),
    0
  );

  const bookedRooms = await fetchBookedRooms(accommodationId, dateStr);
  console.log("Booked Room is : ",bookedRooms);
  let available = totalRooms - blockedRooms - bookedRooms;

  setAvailableRoomsForRoomSection(available + blockedRooms);

  return available > 0 ? available : 0;
};

  const getRoomStatus = (accommodationId: number, dateStr: string) => {
    const status: { [key: number]: 'available' | 'blocked' } = {};
    const accommodation = accommodations.find(a => a.id === accommodationId);

    if (!accommodation) return status;

    // Initialize all rooms as available
    for (let i = 1; i <= accommodation.rooms; i++) {
      status[i] = 'available';
    }

    // Find blocked rooms for this accommodation and date, excluding the current editing block
    const blockedForDate = blockedDates.filter(
      b => b.accommodation_id === accommodationId &&
        b.blocked_date === dateStr &&
        (editingDate ? b.id !== editingDate.id : true)
    );

    // Mark blocked rooms
    blockedForDate.forEach(block => {
      if (block.rooms === null) {
        // All rooms are blocked
        for (let i = 1; i <= accommodation.rooms; i++) {
          status[i] = 'blocked';
        }
      } else if (block.rooms) {
        // Specific room blocked
        status[block.rooms] = 'blocked';
      }
    });

    return status;
  };

  const handleDayClick = async (day: Date) => {
    if (isProcessingDayClick) return;
    setAvailableRoomsForRoomSection(0);
    setAvailableRooms(null);
    setIsProcessingDayClick(true);
    const dayStr = format(day, 'yyyy-MM-dd');

    if (isBefore(startOfDay(day), startOfDay(new Date()))) {
      setError('Cannot block or modify past dates');
      setIsProcessingDayClick(false);
      return;
    }

    // Always open form
    setShowForm(true);

    // Reset edit mode when selecting a new date
    if (editingDate) {
      setEditingDate(null);
      setReason('');
      setSelectedRoom(null);
      setAdultPrice('');
      setChildPrice('');
      setAvailableRooms(null);
    }

    // Set the selected day
    setSelectedDay(day);

    try {
      // Check if this date is blocked for the selected accommodation
      if (selectedAccommodationId) {
        const isBlocked = blockedDates.some(b =>
          b.blocked_date === dayStr &&
          b.accommodation_id === selectedAccommodationId
        );

        if (isBlocked) {
          const blockedDate = blockedDates.find(b =>
            b.blocked_date === dayStr &&
            b.accommodation_id === selectedAccommodationId
          );

          if (blockedDate) {
            setEditingDate(blockedDate);
            setReason(blockedDate.reason || '');
            setSelectedRoom(blockedDate.rooms || null);
            setAdultPrice(blockedDate.adult_price || '');
            setChildPrice(blockedDate.child_price || '');

            // Calculate available rooms
            if (blockedDate.accommodation_id) {
              const available = await calculateAvailableRooms(blockedDate.accommodation_id, dayStr);
              setAvailableRooms(available);

              // Get room status
              const status = getRoomStatus(blockedDate.accommodation_id, dayStr);
              setRoomStatus(status);
            }
            return;
          }
        }
      }

      // If accommodation is already selected, calculate room status
      if (selectedAccommodationId) {
        const status = getRoomStatus(selectedAccommodationId, dayStr);
        setRoomStatus(status);

        const available = await calculateAvailableRooms(selectedAccommodationId, dayStr);
        setAvailableRooms(available);
      }
    } finally {
      setIsProcessingDayClick(false);
    }
  };

  const handleAccommodationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    setSelectedAccommodationId(id);
    setSelectedRoom(null);

    if (id) {
      const defaultPrices = getDefaultPrices(id);
      setAdultPrice(defaultPrices.adult || '');
      setChildPrice(defaultPrices.child || '');

      // Calculate available rooms and room status if a date is selected
      if (editingDate?.blocked_date) {
        const available = await calculateAvailableRooms(id, editingDate.blocked_date);
        setAvailableRooms(available);

        const status = getRoomStatus(id, editingDate.blocked_date);
        setRoomStatus(status);
      } else if (selectedDay) {
        const dateStr = format(selectedDay, 'yyyy-MM-dd');
        const available = await calculateAvailableRooms(id, dateStr);
        setAvailableRooms(available);

        const status = getRoomStatus(id, dateStr);
        setRoomStatus(status);
      }
    } else {
      setAdultPrice('');
      setChildPrice('');
      setAvailableRooms(null);
      setRoomStatus({});
    }
  };

  const validateForm = (): boolean => {
    if (!selectedAccommodationId) {
      setError('Please select an accommodation');
      return false;
    }

    if (!reason && (adultPrice === '' && childPrice === '')) {
      setError('Please provide a reason or set prices');
      return false;
    }

    if (adultPrice !== '' && adultPrice < 0) {
      setError('Adult price cannot be negative');
      return false;
    }

    if (childPrice !== '' && childPrice < 0) {
      setError('Child price cannot be negative');
      return false;
    }

    return true;
  };

  const handleSaveBlockedDates = async (actionType: 'block' | 'price' | 'both') => {
    if (!validateForm()) return;
    if (!selectedDay && !editingDate) {
      setError('Please select a date');
      return;
    }

    // Commented out API call - using mock save
    // try {
    //   setLoading(true);
    //   const dates = editingDate
    //     ? [editingDate.blocked_date]
    //     : selectedDay ? [format(selectedDay, 'yyyy-MM-dd')] : [];

    //   const payload = {
    //     dates,
    //     reason: actionType === 'price' ? null : reason,
    //     accommodation_id: selectedAccommodationId,
    //     room_number: selectedRoom,
    //     adult_price: adultPrice === '' ? null : adultPrice,
    //     child_price: childPrice === '' ? null : childPrice
    //   };

    //   const url = editingDate
    //     ? `${admin_BASE_URL}/blocked-dates/${editingDate.id}`
    //     : `${admin_BASE_URL}/blocked-dates`;

    //   const response = await fetch(url, {
    //     method: editingDate ? 'PUT' : 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload)
    //   });

    //   if (!response.ok) throw new Error('Request failed');

    //   const data: ApiResponse = await response.json();

    //   if (data.success) {
    //     setSuccess(editingDate ? 'Updated successfully' : 'Saved successfully');
    //     resetForm();
    //     await fetchBlockedDates();
    //   } else {
    //     setError(data.message || 'Failed to save');
    //   }
    // } catch (err) {
    //   setError('Error connecting to server');
    //   console.error('Save error:', err);
    // } finally {
    //   setLoading(false);
    // }
    
    // Mock save
    setLoading(true);
    setTimeout(() => {
      setSuccess(editingDate ? 'Updated successfully' : 'Saved successfully');
      resetForm();
      setLoading(false);
    }, 1000);
  };

  const handleRemoveBlockedDate = async (date: BlockedDate) => {
    if (!confirm(`Are you sure you want to unblock ${format(new Date(date.blocked_date), 'MMMM d, yyyy')}?`)) {
      return;
    }

    // Commented out API call - using mock delete
    // try {
    //   setIsDeleting(true);
    //   const response = await fetch(`${admin_BASE_URL}/blocked-dates/${date.id}`, {
    //     method: 'DELETE',
    //   });

    //   if (!response.ok) throw new Error('Delete failed');

    //   const data: ApiResponse = await response.json();

    //   if (data.success) {
    //     setSuccess('Date unblocked successfully');
    //     await fetchBlockedDates();
    //   } else {
    //     setError(data.message || 'Failed to remove blocked date');
    //   }
    // } catch (err) {
    //   setError('Error connecting to server');
    //   console.error('Delete error:', err);
    // } finally {
    //   setIsDeleting(false);
    // }
    
    // Mock delete
    setIsDeleting(true);
    setTimeout(() => {
      setSuccess('Date unblocked successfully');
      setBlockedDates(prev => prev.filter(d => d.id !== date.id));
      setIsDeleting(false);
    }, 500);
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedDay(null);
    setReason('');
    setSelectedRoom(null);
    setEditingDate(null);
    setAdultPrice('');
    setChildPrice('');
    setAvailableRooms(null);
    setRoomStatus({});
  };

  // Highlight only the selected accommodation's blocked dates
  const getBlockStatusForDate = (date: Date) => {
    if (!selectedAccommodationId) return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    const blockedDatesForDay = blockedDates.filter(b =>
      b.blocked_date === dateStr &&
      b.accommodation_id === selectedAccommodationId
    );

    if (blockedDatesForDay.length === 0) return null;

    const isFullyBlocked = blockedDatesForDay.some(b => b.rooms === null);
    const hasPartialBlocks = blockedDatesForDay.some(b => b.rooms !== null);
    const hasPriceChanges = blockedDatesForDay.some(b => b.adult_price || b.child_price);
    const hasReason = blockedDatesForDay.some(b => b.reason);

    return {
      isFullyBlocked,
      hasPartialBlocks,
      hasPriceChanges,
      hasReason
    };
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getCurrentAccommodation = () => {
    return accommodations.find(a => a.id === selectedAccommodationId);
  };

  const defaultPrices = getDefaultPrices(selectedAccommodationId);
  const calendarDays = generateCalendarDays();
  const monthYear = format(currentDate, 'MMMM yyyy');
  const currentAccommodation = getCurrentAccommodation();

  // Filter blocked dates for the current accommodation
  const filteredBlockedDates = selectedAccommodationId
    ? blockedDates.filter(b => b.accommodation_id === selectedAccommodationId)
    : [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Calendar</h1>
        <p className="mt-2 text-gray-600">Block dates when properties are unavailable</p>
      </div>

      {/* Alerts */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-700">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-6 w-6 text-blue-600 mr-2" />
              Select Dates to Block
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-md"
                disabled={loading}
              >
                ←
              </button>
              <span className="text-lg font-medium min-w-[140px] text-center">
                {monthYear}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-md"
                disabled={loading}
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const blockedStatus = getBlockStatusForDate(day);
              const isSelected = selectedDay && format(selectedDay, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');

              let dayClasses = [
                'p-2',
                'text-sm',
                'rounded-md',
                'transition-colors',
                !isCurrentMonth ? 'text-gray-300' : 'text-gray-700',
                isToday ? 'ring-2 ring-blue-500' : '',
                loading ? 'cursor-not-allowed' : 'cursor-pointer',
                isBefore(startOfDay(day), startOfDay(new Date())) ? 'opacity-50' : ''
              ];

              // Highlight selected accommodation's blocked dates in yellow
              if (blockedStatus) {
                if (blockedStatus.isFullyBlocked) {
                  dayClasses.push(
                    'bg-red-100',
                    'text-gray-400',
                    'line-through',
                    'cursor-not-allowed'
                  );
                } else if (blockedStatus.hasPartialBlocks || blockedStatus.hasReason) {
                  dayClasses.push(
                    'bg-yellow-100',
                    'relative',
                    'partially-blocked'
                  );
                } else if (blockedStatus.hasPriceChanges) {
                  dayClasses.push(
                    'bg-green-100',
                    'text-green-700'
                  );
                }
              } else if (isSelected) {
                dayClasses.push(
                  'bg-blue-500',
                  'text-white',
                  'rounded-full',
                  'hover:bg-blue-600',
                  'focus:bg-blue-600'
                );
              } else {
                dayClasses.push(
                  'hover:bg-gray-100'
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  disabled={loading || isBefore(startOfDay(day), startOfDay(new Date())) ||
                    (blockedStatus?.isFullyBlocked) || isProcessingDayClick}
                  className={dayClasses.join(' ')}
                >
                  {day.getDate()}
                  {blockedStatus?.hasPartialBlocks && (
                    <span className="absolute bottom-1 right-1 w-1 h-1 bg-yellow-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 mr-2"></div>
              <span>Fully Blocked</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 mr-2 relative">
                <span className="absolute bottom-0 right-0 w-1 h-1 bg-yellow-500 rounded-full"></span>
              </div>
              <span>Partially Blocked</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 mr-2"></div>
              <span>Price Changes</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 mr-2 rounded-full"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-300 mr-2"></div>
              <span>Available</span>
            </div>
          </div>
        </div>

        {/* Form and Blocked Dates List */}
        <div className="space-y-6">
          {/* Form - Always visible after date click */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDate ? 'Edit Date' : 'Block Dates'}
              </h3>
              {showForm && (
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={loading || isFetchingBookedRooms}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {showForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingDate ? 'Selected Date' : 'Selected Date'}
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {editingDate
                      ? format(new Date(editingDate.blocked_date), 'MMMM d, yyyy')
                      : selectedDay ? format(selectedDay, 'MMMM d, yyyy') : 'No date selected'
                    }
                  </div>
                </div>

                <div>
                  <label htmlFor="accommodationSelect" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Accommodation
                  </label>
                  <select
                    id="accommodationSelect"
                    value={selectedAccommodationId || ''}
                    onChange={handleAccommodationChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading || isFetchingBookedRooms || editingDate !== null}
                  >
                    <option value="">Select Accommodation</option>
                    {accommodations.map(accommodation => (
                      <option key={accommodation.id} value={accommodation.id}>
                        {accommodation.name} ({accommodation.type})
                      </option>
                    ))}
                  </select>
                  {editingDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Accommodation cannot be changed when editing
                    </p>
                  )}
                </div>

                {selectedAccommodationId && currentAccommodation?.rooms && currentAccommodation.rooms > 1 && (
                  <div>
                    <label htmlFor="roomSelect" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Room
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        id="roomSelect"
                        value={selectedRoom !== null ? selectedRoom : ''}
                        onChange={(e) => setSelectedRoom(e.target.value ? Number(e.target.value) : null)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading || isFetchingBookedRooms}
                      >
                        <option value="">All Rooms</option>
                        {Array.from({ length: availableRoomsForRoomSection }, (_, i) => i + 1).map(roomNumber => (
                          <option key={roomNumber} value={roomNumber}>
                            Room {roomNumber}
                          </option>
                        ))}
                      </select>
                      {availableRooms !== null && (
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          Available: {availableRooms} | Total: {currentAccommodation.rooms}
                        </span>
                      )}
                    </div>
                    {availableRooms !== null && availableRooms === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        No rooms available for this date
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Blocking
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter reason for blocking these dates..."
                    disabled={loading || isFetchingBookedRooms}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="adultPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Adult Price (₹)
                    </label>
                    <input
                      type="number"
                      id="adultPrice"
                      min="0"
                      value={adultPrice}
                      onChange={e => setAdultPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. 1500"
                      disabled={loading || isFetchingBookedRooms}
                    />
                    {defaultPrices.adult !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Default: ₹{defaultPrices.adult.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="childPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Child Price (₹)
                    </label>
                    <input
                      type="number"
                      id="childPrice"
                      min="0"
                      value={childPrice}
                      onChange={e => setChildPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. 800"
                      disabled={loading || isFetchingBookedRooms}
                    />
                    {defaultPrices.child !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Default: ₹{defaultPrices.child.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading || isFetchingBookedRooms}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBlockedDates('block')}
                    disabled={loading || isFetchingBookedRooms}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingDate ? 'Update Block' : 'Block Date'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBlockedDates('price')}
                    disabled={loading || isFetchingBookedRooms}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingDate ? 'Update Price' : 'Set Price'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarIcon className="mx-auto h-10 w-10 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No dates selected</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Select a date on the calendar to block it or set custom pricing
                </p>
              </div>
            )}
          </div>

          {/* Blocked Dates List */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedAccommodationId
                ? `Blocked Dates for ${currentAccommodation?.name} (${filteredBlockedDates.length})`
                : 'Blocked Dates'}
            </h3>

            {filteredBlockedDates.length === 0 ? (
              <p className="text-gray-500 text-sm">No dates are currently blocked for this accommodation.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredBlockedDates.map((date) => (
                  <div
                    key={date.id}
                    className={`flex items-center justify-between p-3 rounded-md ${date.reason ? 'bg-red-50' : 'bg-green-50'
                      }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {format(new Date(date.blocked_date), 'MMMM d, yyyy')}
                      </div>
                      {date.accommodation_name && (
                        <div className="text-xs text-blue-600 flex items-center mt-1">
                          <Building2 className="h-3 w-3 mr-1" />
                          {date.accommodation_name}
                          {date.rooms === null ? ' - All Rooms' : ` - Room ${date.rooms}`}
                        </div>
                      )}
                      {date.reason && (
                        <div className="text-xs text-gray-600 mt-1">
                          {date.reason}
                        </div>
                      )}
                      {(date.adult_price || date.child_price) && (
                        <div className="text-xs text-gray-600 mt-1">
                          Prices: Adult ₹{date.adult_price || '0'}, Child ₹{date.child_price || '0'}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={async () => {
                          setEditingDate(date);
                          setReason(date.reason || '');
                          setSelectedAccommodationId(date.accommodation_id || null);
                          setSelectedRoom(date.rooms || null);
                          setAdultPrice(date.adult_price || '');
                          setChildPrice(date.child_price || '');
                          setShowForm(true);
                          setSelectedDay(new Date(date.blocked_date));

                          // Calculate available rooms
                          if (date.accommodation_id) {
                            const available = await calculateAvailableRooms(date.accommodation_id, date.blocked_date);
                            setAvailableRooms(available);

                            // Get room status
                            const status = getRoomStatus(date.accommodation_id, date.blocked_date);
                            setRoomStatus(status);
                          }
                        }}
                        disabled={loading || isDeleting || isFetchingBookedRooms}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveBlockedDate(date)}
                        disabled={loading || isDeleting || isFetchingBookedRooms}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                        title="Remove"
                      >
                        {isDeleting ? (
                          <span className="animate-spin inline-block h-4 w-4">↻</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        You can block a date, set prices, or both. Leave reason empty to only set prices.
      </p>
    </div>
  );
};

export default Calendar;