// import { useState, useEffect, useRef } from 'react';
// import { format, isBefore, startOfDay, parseISO } from 'date-fns';
// import { Calendar as CalendarIcon, X, Trash2, Edit2, AlertCircle, CheckCircle, Building2 } from 'lucide-react';
// import axios from 'axios';

// // API Configuration
// const admin_BASE_URL = 'https://a.plumeriaretreat.com/admin/calendar';

// interface Accommodation {
//   id: number;
//   name: string;
//   type: string;
//   rooms: number;
//   package?: {
//     pricing?: {
//       adult: string;
//       child: string;
//     };
//   };
//   adult_price?: number | null;
//   child_price?: number | null;
// }

// interface BlockedDate {
//   id: number;
//   blocked_date: string;
//   reason?: string;
//   accommodation_id?: number;
//   accommodation_name?: string;
//   rooms?: number | null;
//   adult_price?: number | null;
//   child_price?: number | null;
//   updated_at: string;
// }

// interface ApiResponse {
//   success: boolean;
//   data?: any;
//   message?: string;
// }

// interface BookedRoomData {
//   date: string;
//   accommodation_id: number;
//   booked_rooms: number;
// }

// const Calendar = () => {
//   // State
//   const [selectedDay, setSelectedDay] = useState<Date | null>(null);
//   const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
//   const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
//   const [reason, setReason] = useState('');
//   const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
//   const [selectedRoom, setSelectedRoom] = useState<number | null>(0);
//   const [showForm, setShowForm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [editingDate, setEditingDate] = useState<BlockedDate | null>(null);
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [adultPrice, setAdultPrice] = useState<number | ''>('');
//   const [childPrice, setChildPrice] = useState<number | ''>('');
//   const [availableRooms, setAvailableRooms] = useState<number | null>(null);
//   const [isFetchingBookedRooms, setIsFetchingBookedRooms] = useState(false);
//   const [roomStatus, setRoomStatus] = useState<{ [key: number]: 'available' | 'blocked' }>({});
//   const [isProcessingDayClick, setIsProcessingDayClick] = useState(false);
//   const [activeSection, setActiveSection] = useState<'price' | 'inventory'>('price');
//   const [isBlockAll, setIsBlockAll] = useState(false);

//   // Track last clicked date to prevent re-processing
//   const lastClickedDate = useRef<string | null>(null);

//   // Fetch data
//   const fetchBlockedDates = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`${admin_BASE_URL}/blocked-dates`);
//       if (!response.ok) throw new Error('Failed to fetch blocked dates');
//       const data = await response.json();
//       if (data.success) {
//         const formattedData = data.data.map((item: BlockedDate) => ({
//           ...item,
//           blocked_date: item.blocked_date.split('T')[0] // Format to YYYY-MM-DD
//         }));
//         setBlockedDates(formattedData);
//       } else {
//         setError(data.message || 'Failed to fetch blocked dates');
//       }
//     } catch (err) {
//       setError('Error connecting to server');
//       console.error('Fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAccommodations = async () => {
//     try {
//       const response = await fetch(`https://a.plumeriaretreat.com/admin/properties/accommodations`);
//       if (!response.ok) throw new Error('Failed to fetch accommodations');
//       const data = await response.json();
//       if (data.data.length > 0) {
//         setAccommodations(data.data);
//       }
//     } catch (err) {
//       console.error('Error fetching accommodations:', err);
//       setError('Failed to load accommodations');
//     }
//   };

//   const fetchBookedRooms = async (accommodationId: number, checkInDate: string) => {
//     try {
//       setIsFetchingBookedRooms(true);
//       const response = await fetch(`https://a.plumeriaretreat.com/admin/bookings/room-occupancy?check_in=${checkInDate}&id=${accommodationId}`);
//       if (!response.ok) {
//         throw new Error('Failed to fetch booked rooms');
//       }
//       const data = await response.json();
//       return data.total_rooms || 0;
//     } catch (error) {
//       console.error('Error fetching booked rooms:', error);
//       return 0;
//     } finally {
//       setIsFetchingBookedRooms(false);
//     }
//   };

//   useEffect(() => {
//     fetchBlockedDates();
//     fetchAccommodations();
//   }, []);

//   useEffect(() => {
//     if (error || success) {
//       const timer = setTimeout(() => {
//         setError('');
//         setSuccess('');
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [error, success]);

//   const getDefaultPrices = (accommodationId: number | null) => {
//     if (!accommodationId) return { adult: null, child: null };
//     const accommodation = accommodations.find(a => a.id === accommodationId);
//     if (!accommodation?.package?.pricing) return { adult: null, child: null };
//     return {
//       adult: parseFloat(accommodation.package.pricing.adult) || null,
//       child: parseFloat(accommodation.package.pricing.child) || null
//     };
//   };

//   const calculateAvailableRooms = async (
//     accommodationId: number,
//     dateStr: string
//   ): Promise<number | null> => {
//     const accommodation = accommodations.find(a => a.id === accommodationId);
//     if (!accommodation) return null;
//     const totalRooms = Number(accommodation.rooms);
//     const getLatestBlockedDates = (data: typeof blockedDates) => {
//       const map = new Map<string, any>();
//       data.forEach(item => {
//         const key = `${item.accommodation_id}_${item.blocked_date}`;
//         const existing = map.get(key);
//         if (!existing || new Date(item.updated_at) > new Date(existing.updated_at)) {
//           map.set(key, item);
//         }
//       });
//       return Array.from(map.values());
//     };
//     const latestBlockedDates = getLatestBlockedDates(blockedDates);
//     const blockedForDate = latestBlockedDates.filter(b => {
//       const blockedDateStr =
//         typeof b.blocked_date === "string"
//           ? b.blocked_date.trim().slice(0, 10)
//           : format(new Date(b.blocked_date), "yyyy-MM-dd");
//       return (
//         b.accommodation_id === accommodationId &&
//         blockedDateStr === dateStr &&
//         (editingDate ? b.id !== editingDate.id : true)
//       );
//     });
//     if (blockedForDate.some(b => b.rooms === null)) {
//       return 0;
//     }
//     const blockedRooms = blockedForDate.reduce(
//       (sum, b) => sum + (Number(b.rooms) || 0),
//       0
//     );
//     const bookedRooms = await fetchBookedRooms(accommodationId, dateStr);
//     let available = totalRooms - blockedRooms - bookedRooms;
//     return available > 0 ? available : 0;
//   };

//   const getRoomStatus = (accommodationId: number, dateStr: string) => {
//     const status: { [key: number]: 'available' | 'blocked' } = {};
//     const accommodation = accommodations.find(a => a.id === accommodationId);
//     if (!accommodation) return status;
//     for (let i = 1; i <= accommodation.rooms; i++) {
//       status[i] = 'available';
//     }
//     const blockedForDate = blockedDates.filter(
//       b => b.accommodation_id === accommodationId &&
//         b.blocked_date === dateStr &&
//         (editingDate ? b.id !== editingDate.id : true)
//     );
//     blockedForDate.forEach(block => {
//       if (block.rooms === null) {
//         for (let i = 1; i <= accommodation.rooms; i++) {
//           status[i] = 'blocked';
//         }
//       } else if (block.rooms) {
//         status[block.rooms] = 'blocked';
//       }
//     });
//     return status;
//   };

//   const handleDayClick = async (day: Date) => {
//     const dayStr = format(day, 'yyyy-MM-dd');

//     // Prevent re-processing if same date is clicked multiple times
//     if (lastClickedDate.current === dayStr && showForm) {
//       return;
//     }

//     lastClickedDate.current = dayStr;

//     if (isProcessingDayClick) return;
//     setAvailableRooms(null);
//     setSelectedRoom(0);
//     setIsBlockAll(false);
//     setIsProcessingDayClick(true);

//     if (isBefore(startOfDay(day), startOfDay(new Date()))) {
//       setError('Cannot block or modify past dates');
//       setIsProcessingDayClick(false);
//       return;
//     }

//     setShowForm(true);
//     setActiveSection('price'); // Always start with price section

//     // Reset form only if it's a different date or new selection
//     if (!selectedDay || format(selectedDay, 'yyyy-MM-dd') !== dayStr) {
//       setEditingDate(null);
//       setReason('');
//       setSelectedRoom(null);
//       setAdultPrice('');
//       setChildPrice('');
//       setAvailableRooms(null);
//       setSelectedRoom(0);
//       setIsBlockAll(false);
//     }

//     setSelectedDay(day);
//     try {
//       // Find if this date is blocked for the selected accommodation
//       const blockedDate = blockedDates.find(b =>
//         b.blocked_date === dayStr &&
//         b.accommodation_id === selectedAccommodationId
//       );

//       if (blockedDate) {
//         setEditingDate(blockedDate);
//         setReason(blockedDate.reason || '');
//         setSelectedRoom(blockedDate.rooms || null);
//         setAdultPrice(blockedDate.adult_price || '');
//         setChildPrice(blockedDate.child_price || '');
//         setIsBlockAll(blockedDate.rooms === null);
//         setActiveSection('price'); // Always show price section first

//         if (blockedDate.accommodation_id) {
//           const available = await calculateAvailableRooms(blockedDate.accommodation_id, dayStr);
//           setAvailableRooms(available);
//           const status = getRoomStatus(blockedDate.accommodation_id, dayStr);
//           setRoomStatus(status);
//         }
//       } else {
//         // Reset to default values if no blocked date found
//         if (selectedAccommodationId) {
//           const defaultPrices = getDefaultPrices(selectedAccommodationId);
//           setAdultPrice(defaultPrices.adult || '');
//           setChildPrice(defaultPrices.child || '');
//           const available = await calculateAvailableRooms(selectedAccommodationId, dayStr);
//           setAvailableRooms(available);
//           setSelectedRoom(available);
//           const status = getRoomStatus(selectedAccommodationId, dayStr);
//           setRoomStatus(status);
//         }
//       }
//     } catch (error) {
//       console.error('Error processing day click:', error);
//       setError('Failed to load date information');
//     } finally {
//       setIsProcessingDayClick(false);
//     }
//   };

//   const handleAccommodationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const id = e.target.value ? Number(e.target.value) : null;
//     setSelectedAccommodationId(id);
//     setSelectedRoom(null);
//     setIsBlockAll(false);

//     if (id) {
//       const defaultPrices = getDefaultPrices(id);
//       setAdultPrice(defaultPrices.adult || '');
//       setChildPrice(defaultPrices.child || '');

//       if (selectedDay) {
//         const dateStr = format(selectedDay, 'yyyy-MM-dd');
//         const available = await calculateAvailableRooms(id, dateStr);
//         setAvailableRooms(available);
//         setSelectedRoom(available);
//         const status = getRoomStatus(id, dateStr);
//         setRoomStatus(status);
//       }
//     } else {
//       setAdultPrice('');
//       setChildPrice('');
//       setAvailableRooms(null);
//       setRoomStatus({});
//     }
//   };

//   const validateForm = (): boolean => {
//     if (!selectedAccommodationId) {
//       setError('Please select an accommodation');
//       return false;
//     }
//     // Removed validation that prevented blocking when availableRooms is 0
//     if (activeSection === 'price' && adultPrice === '' && childPrice === '') {
//       setError('Please set at least one price');
//       return false;
//     }
//     if (adultPrice !== '' && adultPrice < 0) {
//       setError('Adult price cannot be negative');
//       return false;
//     }
//     if (childPrice !== '' && childPrice < 0) {
//       setError('Child price cannot be negative');
//       return false;
//     }
//     return true;
//   };

//   const handleSaveBlockedDates = async () => {
//     if (!validateForm()) return;
//     if (!selectedDay && !editingDate) {
//       setError('Please select a date');
//       return;
//     }
//     try {
//       setLoading(true);
//       const dates = editingDate
//         ? [editingDate.blocked_date]
//         : selectedDay
//         ? [format(selectedDay, 'yyyy-MM-dd')]
//         : [];
//       // For inventory section, if Block All is checked, set selectedRoom to null
//       const roomValue = activeSection === 'inventory' && isBlockAll ? null : selectedRoom;

//       const payload = {
//         dates,
//         reason,
//         accommodation_id: selectedAccommodationId,
//         room_number: roomValue,
//         adult_price: adultPrice,
//         child_price: childPrice
//       };
//       console.log('Payload to save:', payload);
//       const url = editingDate
//         ? `${admin_BASE_URL}/blocked-dates/${editingDate.id}`
//         : `${admin_BASE_URL}/blocked-dates`;
//       const response = await axios({
//         method: editingDate ? 'put' : 'post',
//         url,
//         data: payload,
//         headers: { 'Content-Type': 'application/json' }
//       });
//       const data: ApiResponse = response.data;
//       if (data.success) {
//         setSuccess(editingDate ? 'Updated successfully' : 'Saved successfully');
//         resetForm();
//         await fetchBlockedDates();
//       } else {
//         setError(data.message || 'Failed to save');
//       }
//     } catch (err) {
//       setError('Error connecting to server');
//       console.error('Save error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRemoveBlockedDate = async (date: BlockedDate) => {
//     if (!confirm(`Are you sure you want to unblock ${format(new Date(date.blocked_date), 'MMMM d, yyyy')}?`)) {
//       return;
//     }
//     try {
//       setIsDeleting(true);
//       const response = await fetch(`${admin_BASE_URL}/blocked-dates/${date.id}`, {
//         method: 'DELETE',
//       });
//       if (!response.ok) throw new Error('Delete failed');
//       const data: ApiResponse = await response.json();
//       if (data.success) {
//         setSuccess('Date unblocked successfully');
//         await fetchBlockedDates();
//       } else {
//         setError(data.message || 'Failed to remove blocked date');
//       }
//     } catch (err) {
//       setError('Error connecting to server');
//       console.error('Delete error:', err);
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const resetForm = () => {
//     setShowForm(false);
//     setSelectedDay(null);
//     setReason('');
//     setSelectedRoom(null);
//     setEditingDate(null);
//     setAdultPrice('');
//     setChildPrice('');
//     setAvailableRooms(null);
//     setRoomStatus({});
//     setActiveSection('price');
//     setIsBlockAll(false);
//     lastClickedDate.current = null;
//   };

//   const getBlockStatusForDate = (date: Date) => {
//     if (!selectedAccommodationId) return null;
//     const dateStr = format(date, 'yyyy-MM-dd');
//     const blockedDatesForDay = blockedDates.filter(b =>
//       b.blocked_date === dateStr &&
//       b.accommodation_id === selectedAccommodationId
//     );
//     if (blockedDatesForDay.length === 0) return null;
//     const isFullyBlocked = blockedDatesForDay.some(b => b.rooms === null);
//     const hasPartialBlocks = blockedDatesForDay.some(b => b.rooms !== null);
//     const hasPriceChanges = blockedDatesForDay.some(b => b.adult_price || b.child_price);
//     const hasReason = blockedDatesForDay.some(b => b.reason);
//     return {
//       isFullyBlocked,
//       hasPartialBlocks,
//       hasPriceChanges,
//       hasReason
//     };
//   };

//   const generateCalendarDays = () => {
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const startDate = new Date(firstDay);
//     startDate.setDate(startDate.getDate() - firstDay.getDay());
//     const days = [];
//     const current = new Date(startDate);
//     for (let i = 0; i < 42; i++) {
//       days.push(new Date(current));
//       current.setDate(current.getDate() + 1);
//     }
//     return days;
//   };

//   const navigateMonth = (direction: number) => {
//     const newDate = new Date(currentDate);
//     newDate.setMonth(newDate.getMonth() + direction);
//     setCurrentDate(newDate);
//   };

//   const getCurrentAccommodation = () => {
//     return accommodations.find(a => a.id === selectedAccommodationId);
//   };

//   const defaultPrices = getDefaultPrices(selectedAccommodationId);
//   const calendarDays = generateCalendarDays();
//   const monthYear = format(currentDate, 'MMMM yyyy');
//   const currentAccommodation = getCurrentAccommodation();
//   const filteredBlockedDates = selectedAccommodationId
//     ? blockedDates.filter(b => b.accommodation_id === selectedAccommodationId)
//     : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Manage Calendar</h1>
//         <p className="mt-2 text-gray-600">Block dates when properties are unavailable</p>
//       </div>

//       {/* Alerts */}
//       {loading && (
//         <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
//           <div className="flex items-center">
//             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
//             <span className="text-blue-700">Loading...</span>
//           </div>
//         </div>
//       )}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-md p-4">
//           <div className="flex items-center">
//             <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
//             <span className="text-red-700">{error}</span>
//           </div>
//         </div>
//       )}
//       {success && (
//         <div className="bg-green-50 border border-green-200 rounded-md p-4">
//           <div className="flex items-center">
//             <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
//             <span className="text-green-700">{success}</span>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Calendar */}
//         <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-semibold text-gray-900 flex items-center">
//               <CalendarIcon className="h-6 w-6 text-blue-600 mr-2" />
//               Select Dates to Block
//             </h2>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => navigateMonth(-1)}
//                 className="p-2 hover:bg-gray-100 rounded-md"
//                 disabled={loading}
//               >
//                 ←
//               </button>
//               <span className="text-lg font-medium min-w-[140px] text-center">
//                 {monthYear}
//               </span>
//               <button
//                 onClick={() => navigateMonth(1)}
//                 className="p-2 hover:bg-gray-100 rounded-md"
//                 disabled={loading}
//               >
//                 →
//               </button>
//             </div>
//           </div>

//           {/* Calendar Grid */}
//           <div className="grid grid-cols-7 gap-1 mb-4">
//             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
//               <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
//                 {day}
//               </div>
//             ))}
//           </div>
//           <div className="grid grid-cols-7 gap-1">
//             {calendarDays.map((day, index) => {
//               const isCurrentMonth = day.getMonth() === currentDate.getMonth();
//               const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
//               const blockedStatus = getBlockStatusForDate(day);
//               const isSelected = selectedDay && format(selectedDay, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
//               let dayClasses = [
//                 'p-2',
//                 'text-sm',
//                 'rounded-md',
//                 'transition-colors',
//                 !isCurrentMonth ? 'text-gray-300' : 'text-gray-700',
//                 isToday ? 'ring-2 ring-blue-500' : '',
//                 loading ? 'cursor-not-allowed' : 'cursor-pointer',
//                 isBefore(startOfDay(day), startOfDay(new Date())) ? 'opacity-50' : ''
//               ];

//               if (blockedStatus) {
//                 if (blockedStatus.isFullyBlocked) {
//                   dayClasses.push(
//                     'bg-red-100',
//                     'text-gray-400',
//                     'line-through',
//                     'cursor-not-allowed'
//                   );
//                 } else if (blockedStatus.hasPartialBlocks || blockedStatus.hasReason) {
//                   dayClasses.push(
//                     'bg-yellow-100',
//                     'relative',
//                     'partially-blocked'
//                   );
//                 } else if (blockedStatus.hasPriceChanges) {
//                   dayClasses.push(
//                     'bg-green-100',
//                     'text-green-700'
//                   );
//                 }
//               } else if (isSelected) {
//                 dayClasses.push(
//                   'bg-blue-500',
//                   'text-white',
//                   'rounded-full',
//                   'hover:bg-blue-600',
//                   'focus:bg-blue-600'
//                 );
//               } else {
//                 dayClasses.push(
//                   'hover:bg-gray-100'
//                 );
//               }

//               return (
//                 <button
//                   key={index}
//                   onClick={() => handleDayClick(day)}
//                   disabled={loading || isBefore(startOfDay(day), startOfDay(new Date())) ||
//                     (blockedStatus?.isFullyBlocked) || isProcessingDayClick}
//                   className={dayClasses.join(' ')}
//                 >
//                   {day.getDate()}
//                   {blockedStatus?.hasPartialBlocks && (
//                     <span className="absolute bottom-1 right-1 w-1 h-1 bg-yellow-500 rounded-full"></span>
//                   )}
//                 </button>
//               );
//             })}
//           </div>

//           {/* Legend */}
//           <div className="flex flex-wrap gap-4 mt-4 text-sm">
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-red-100 mr-2"></div>
//               <span>Fully Blocked</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-yellow-100 mr-2 relative">
//                 <span className="absolute bottom-0 right-0 w-1 h-1 bg-yellow-500 rounded-full"></span>
//               </div>
//               <span>Partially Blocked</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-green-100 mr-2"></div>
//               <span>Price Changes</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-blue-500 mr-2 rounded-full"></div>
//               <span>Selected</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-white border border-gray-300 mr-2"></div>
//               <span>Available</span>
//             </div>
//           </div>
//         </div>

//         {/* Form and Blocked Dates List */}
//         <div className="space-y-6">
//           {/* Form - Always visible after date click */}
//           <div className="bg-white rounded-lg shadow-sm border p-6 py-0 pb-6">
//             {showForm ? (
//               <div className="space-y-4">
//                 {/* Section Tabs */}
//                 <div className="flex border-b mb-4">
//                   <button
//                     className={`py-2 px-4 font-medium text-sm ${activeSection === 'price' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
//                     onClick={() => setActiveSection('price')}
//                   >
//                     Price Management
//                   </button>
//                   <button
//                     className={`py-2 px-4 font-medium text-sm ${activeSection === 'inventory' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
//                     onClick={() => setActiveSection('inventory')}
//                   >
//                     Inventory Management
//                   </button>
//                 </div>

//                 {/* Selected Date */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Selected Date
//                   </label>
//                   <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
//                     {editingDate
//                       ? format(parseISO(editingDate.blocked_date), 'MMMM d, yyyy')
//                       : selectedDay ? format(selectedDay, 'MMMM d, yyyy') : 'No date selected'
//                     }
//                   </div>
//                 </div>

//                 {/* Accommodation Selection */}
//                 <div>
//                   <label htmlFor="accommodationSelect" className="block text-sm font-medium text-gray-700 mb-1">
//                     Select Accommodation
//                   </label>
//                   <select
//                     id="accommodationSelect"
//                     value={selectedAccommodationId || ''}
//                     onChange={handleAccommodationChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     disabled={loading || isFetchingBookedRooms || editingDate !== null}
//                   >
//                     <option value="">Select Accommodation</option>
//                     {accommodations.map(accommodation => (
//                       <option key={accommodation.id} value={accommodation.id}>
//                         {accommodation.name} ({accommodation.type})
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Price Management Section */}
//                 {activeSection === 'price' && (
//                   <div className="space-y-4 pt-4">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label htmlFor="adultPrice" className="block text-sm font-medium text-gray-700 mb-1">
//                           Adult Price (₹)
//                         </label>
//                         <input
//                           type="number"
//                           id="adultPrice"
//                           min="0"
//                           value={adultPrice}
//                           onChange={e => setAdultPrice(e.target.value === '' ? '' : Number(e.target.value))}
//                           className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                           placeholder="e.g. 1500"
//                           disabled={loading || isFetchingBookedRooms}
//                         />
//                         {defaultPrices.adult !== null && (
//                           <p className="text-xs text-gray-500 mt-1">
//                             Default: ₹{defaultPrices.adult.toFixed(2)}
//                           </p>
//                         )}
//                       </div>
//                       <div>
//                         <label htmlFor="childPrice" className="block text-sm font-medium text-gray-700 mb-1">
//                           Child Price (₹)
//                         </label>
//                         <input
//                           type="number"
//                           id="childPrice"
//                           min="0"
//                           value={childPrice}
//                           onChange={e => setChildPrice(e.target.value === '' ? '' : Number(e.target.value))}
//                           className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                           placeholder="e.g. 800"
//                           disabled={loading || isFetchingBookedRooms}
//                         />
//                         {defaultPrices.child !== null && (
//                           <p className="text-xs text-gray-500 mt-1">
//                             Default: ₹{defaultPrices.child.toFixed(2)}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Inventory Management Section */}
//                 {activeSection === 'inventory' && selectedAccommodationId && (
//                   <div className="space-y-4 pt-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Available Rooms: {availableRooms}
//                       </label>

//                       {/* Block All Rooms */}
//                       {/* <div className="mb-4">
//                         <label className="flex items-center cursor-pointer">
//                           <input
//                             type="checkbox"
//                             checked={isBlockAll}
//                             onChange={() => {
//                               setIsBlockAll(!isBlockAll);
//                               setSelectedRoom(0);
//                             }}
//                             className="form-checkbox h-4 w-4 text-blue-600"
//                           />
//                           <span className="ml-2 text-sm text-gray-700">Block All Rooms</span>
//                         </label>
//                       </div> */}

//                       {!isBlockAll && (
//                         <>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Rooms to Block
//                           </label>

//                           {/* Room Counter */}
//                           <div className="flex items-center">
//                             <button
//                               onClick={() => setSelectedRoom(prev => Math.max(0, (prev || 0) - 1))}
//                               disabled={selectedRoom === null || (selectedRoom || 0) <= 0}
//                               className="w-10 h-10 flex items-center justify-center rounded-md bg-green-600 text-white text-2xl font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//                             >
//                               −
//                             </button>
//                             {/* Room Count */}
//                             <div className="py-2 bg-white text-black-700 font-semibold text-xl min-w-[70px] h-12 flex items-center justify-center select-none">
//                               {selectedRoom}
//                             </div>
//                             {/* Plus Button */}
//                             <button
//                               onClick={() => setSelectedRoom(prev => Math.min(availableRooms || 0, (prev || 0) + 1))}
//                               disabled={(selectedRoom || 0) >= (availableRooms || 0)}
//                               className="w-10 h-10 flex items-center justify-center rounded-md bg-green-600 text-white text-2xl font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//                             >
//                               +
//                             </button>
//                           </div>

//                           {availableRooms === 0 && (
//                             <div className="mt-2 text-xs text-yellow-600">
//                               All rooms are currently blocked or booked. You can still block all rooms for this date or release existing blocks.
//                             </div>
//                           )}

//                           {availableRooms !== null && availableRooms > 0 && (
//                             <div className="mt-2 text-xs text-gray-500">
//                               {availableRooms - (selectedRoom || 0)} rooms available
//                             </div>
//                           )}
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Reason Field */}
//                 {/* <div>
//                   <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
//                     Reason
//                   </label>
//                   <textarea
//                     id="reason"
//                     rows={3}
//                     value={reason}
//                     onChange={(e) => setReason(e.target.value)}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Enter reason for blocking or price change..."
//                     disabled={loading || isFetchingBookedRooms}
//                   />
//                 </div> */}

//                 {/* Submit Button */}
//                 <div className="flex space-x-3">
//                   <button
//                     type="button"
//                     onClick={resetForm}
//                     disabled={loading || isFetchingBookedRooms}
//                     className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleSaveBlockedDates}
//                     disabled={loading || isFetchingBookedRooms}
//                     className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//                   >
//                     {loading ? 'Saving...' : editingDate ? 'Update' : 'Submit'}
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="text-center py-6">
//                 <CalendarIcon className="mx-auto h-10 w-10 text-gray-400" />
//                 <h3 className="mt-4 text-lg font-medium text-gray-900">No dates selected</h3>
//                 <p className="mt-2 text-sm text-gray-500">
//                   Select a date on the calendar to block it or set custom pricing
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Blocked Dates List */}
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               {selectedAccommodationId
//                 ? `Blocked Dates for ${currentAccommodation?.name} (${filteredBlockedDates.length})`
//                 : 'Blocked Dates'}
//             </h3>
//             {filteredBlockedDates.length === 0 ? (
//               <p className="text-gray-500 text-sm">No dates are currently blocked for this accommodation.</p>
//             ) : (
//               <div className="space-y-2 max-h-96 overflow-y-auto">
//                 {filteredBlockedDates.map((date) => (
//                   <div
//                     key={date.id}
//                     className={`flex items-center justify-between p-3 rounded-md ${date.reason ? 'bg-red-50' : 'bg-green-50'
//                       }`}
//                   >
//                     <div className="flex-1">
//                       <div className="font-medium text-sm text-gray-900">
//                         {format(parseISO(date.blocked_date), 'MMMM d, yyyy')}
//                       </div>
//                       {date.accommodation_name && (
//                         <div className="text-xs text-blue-600 flex items-center mt-1">
//                           <Building2 className="h-3 w-3 mr-1" />
//                           {date.accommodation_name}
//                           {date.rooms === null ? ' - All Rooms' : ` - Room ${date.rooms}`}
//                         </div>
//                       )}
//                       {date.reason && (
//                         <div className="text-xs text-gray-600 mt-1">
//                           {date.reason}
//                         </div>
//                       )}
//                       {(date.adult_price || date.child_price) && (
//                         <div className="text-xs text-gray-600 mt-1">
//                           Prices: Adult ₹{date.adult_price || '0'}, Child ₹{date.child_price || '0'}
//                         </div>
//                       )}
//                     </div>
//                     <div className="flex space-x-1">
//                       <button
//                         onClick={async () => {
//                           setEditingDate(date);
//                           setReason(date.reason || '');
//                           setSelectedAccommodationId(date.accommodation_id || null);
//                           setSelectedRoom(date.rooms || null);
//                           setIsBlockAll(date.rooms === null);
//                           setShowForm(true);
//                           setSelectedDay(parseISO(date.blocked_date));
//                           setActiveSection('price'); // Always show price section first
//                           if (date.accommodation_id) {
//                             const available = await calculateAvailableRooms(date.accommodation_id, date.blocked_date);
//                             setAvailableRooms(available);
//                             const status = getRoomStatus(date.accommodation_id, date.blocked_date);
//                             setRoomStatus(status);
//                           }
//                         }}
//                         disabled={loading || isDeleting || isFetchingBookedRooms}
//                         className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
//                         title="Edit"
//                       >
//                         <Edit2 className="h-4 w-4" />
//                       </button>
//                       <button
//                         onClick={() => handleRemoveBlockedDate(date)}
//                         disabled={loading || isDeleting || isFetchingBookedRooms}
//                         className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
//                         title="Remove"
//                       >
//                         {isDeleting ? (
//                           <span className="animate-spin inline-block h-4 w-4">↻</span>
//                         ) : (
//                           <Trash2 className="h-4 w-4" />
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Calendar;

import { useState, useEffect, useRef } from 'react';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, X, Trash2, Edit2, AlertCircle, CheckCircle, Building2 } from 'lucide-react';
import axios from 'axios';
// API Configuration
const admin_BASE_URL = 'https://adminnirwana-back-1.onrender.com/admin/calendar';
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
  blocked_date: string | null;
  reason?: string;
  accommodation_id?: number;
  accommodation_name?: string;
  rooms?: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  updated_at: string;
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
// Safe date parsing function
const safeParseISO = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    return parseISO(dateString);
  } catch (e) {
    console.error('Invalid date string:', dateString);
    return null;
  }
};
// Parse custom date format from API
const parseCustomDate = (dateString: string): Date => {
  // Handle format like "09/08/2025, 05:13:21"
  const [datePart, timePart] = dateString.split(', ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
};
const Calendar = () => {
  // State
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [reason, setReason] = useState('');
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingDate, setEditingDate] = useState<BlockedDate | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [adultPrice, setAdultPrice] = useState<number | ''>('');
  const [childPrice, setChildPrice] = useState<number | ''>('');
  const [availableRooms, setAvailableRooms] = useState<number | null>(null);
  const [isFetchingBookedRooms, setIsFetchingBookedRooms] = useState(false);
  const [roomStatus, setRoomStatus] = useState<{ [key: number]: 'available' | 'blocked' }>({});
  const [isProcessingDayClick, setIsProcessingDayClick] = useState(false);
  const [activeSection, setActiveSection] = useState<'price' | 'inventory'>('price');
  const [isBlockAll, setIsBlockAll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Track last clicked date to prevent re-processing
  const lastClickedDate = useRef<string | null>(null);
  // Helper functions for data conversion
  const parseRooms = (rooms: any): number | null => {
    if (rooms === null || rooms === "null" || rooms === "") {
      return null;
    }
    const num = Number(rooms);
    return isNaN(num) ? null : num;
  };
  const parsePrice = (price: any): number | null => {
    if (price === null || price === "") {
      return null;
    }
    const num = parseFloat(price);
    return isNaN(num) ? null : num;
  };
  // Get the latest blocked date for a specific accommodation and date
  const getLatestBlockedDate = (accommodationId: number, dateStr: string): BlockedDate | null => {
    const datesForAccommodationAndDate = blockedDates.filter(
      b => b.accommodation_id === accommodationId && b.blocked_date === dateStr
    );

    if (datesForAccommodationAndDate.length === 0) return null;

    // Find the most recently updated entry
    return datesForAccommodationAndDate.reduce((latest, current) => {
      const latestDate = parseCustomDate(latest.updated_at);
      const currentDate = parseCustomDate(current.updated_at);
      return currentDate > latestDate ? current : latest;
    });
  };
  // Fetch data
  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${admin_BASE_URL}/blocked-dates`);
      if (!response.ok) throw new Error('Failed to fetch blocked dates');
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        const items = Array.isArray(data.data) ? data.data : [];
        const filteredItems = items.filter(item => item != null);

        const formattedData = filteredItems.map((item: any) => {
          // Safely parse blocked_date
          let blockedDate = null;
          if (item.blocked_date) {
            try {
              blockedDate = item.blocked_date.split('T')[0];
            } catch (e) {
              console.error('Error parsing blocked_date:', item.blocked_date);
            }
          }

          return {
            ...item,
            blocked_date: blockedDate,
            rooms: parseRooms(item.rooms),
            adult_price: parsePrice(item.adult_price),
            child_price: parsePrice(item.child_price)
          };
        });

        setBlockedDates(formattedData);
        setLastUpdated(new Date());
      } else {
        setError(data.message || 'Failed to fetch blocked dates');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };
  const fetchAccommodations = async () => {
    try {
      const response = await fetch(`https://adminnirwana-back-1.onrender.com/admin/properties/accommodations`);
      if (!response.ok) throw new Error('Failed to fetch accommodations');
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setAccommodations(data.data);
      }
    } catch (err) {
      console.error('Error fetching accommodations:', err);
      setError('Failed to load accommodations');
    }
  };
  const fetchBookedRooms = async (accommodationId: number, checkInDate: string) => {
    try {
      setIsFetchingBookedRooms(true);
      const response = await fetch(`https://adminnirwana-back-1.onrender.com/admin/bookings/room-occupancy?check_in=${checkInDate}&id=${accommodationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booked rooms');
      }
      const data = await response.json();
      return data.total_rooms || 0;
    } catch (error) {
      console.error('Error fetching booked rooms:', error);
      return 0;
    } finally {
      setIsFetchingBookedRooms(false);
    }
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
  const calculateAvailableRooms = async (
    accommodationId: number,
    dateStr: string
  ): Promise<number | null> => {
    console.group(`[calculateAvailableRooms] for accommodation ${accommodationId} on ${dateStr}`);

    try {
      // Step 1: Find accommodation
      const accommodation = accommodations.find(a => a.id === accommodationId);
      if (!accommodation) {
        console.warn(`❌ Accommodation with ID ${accommodationId} not found`);
        return null;
      }

      const totalRooms = Number(accommodation.rooms);
      console.log(`🏠 Accommodation: ${accommodation.name} (${accommodation.type})`);
      console.log(`🔢 Total Rooms: ${totalRooms}`);
      console.log(`📅 Processing date: ${dateStr}`);

      // Step 2: Get the latest blocked date for this accommodation and date
      const latestBlockedDate = getLatestBlockedDate(accommodationId, dateStr);

      let extraRooms = 0;
      if (latestBlockedDate) {
        console.log('✅ Found latest blocked date entry:', latestBlockedDate);

        if (latestBlockedDate.rooms === null) {
          // "Block all" entry - add all rooms again
          extraRooms = totalRooms;
          console.log(`🚫 "Block All" entry - adding ${extraRooms} extra rooms`);
        } else {
          const blockedRoomCount = Number(latestBlockedDate.rooms) || 0;

          // Only count as extra rooms if value is > 0
          if (blockedRoomCount > 0) {
            extraRooms = blockedRoomCount;
            console.log(`📦 Adding ${extraRooms} extra rooms from blocked date`);
          } else {
            console.log(`⚠️ Blocked date has 0 rooms - not adding extra rooms`);
          }
        }
      } else {
        console.log('ℹ️ No blocked date entry found for this date');
      }

      // Step 3: Calculate base availability
      console.log('⏳ Fetching booked rooms...');
      const bookedRooms = await fetchBookedRooms(accommodationId, dateStr);
      console.log(`📊 Booked Rooms: ${bookedRooms}`);

      // Calculate available rooms
      const baseAvailability = totalRooms - bookedRooms;
      const totalAvailable = baseAvailability + extraRooms;

      console.log(`🧮 Calculation:`);
      console.log(` Base availability (total ${totalRooms} - booked ${bookedRooms}): ${baseAvailability}`);
      console.log(` Extra rooms from blocked date: ${extraRooms}`);
      console.log(` Total available: ${totalAvailable}`);

      const finalAvailable = totalAvailable > 0 ? totalAvailable : 0;
      console.log(`🎯 Final available rooms: ${finalAvailable}`);

      return finalAvailable;
    } catch (error) {
      console.error('⚠️ Error in calculateAvailableRooms:', error);
      return null;
    } finally {
      console.groupEnd();
    }
  };
  const getRoomStatus = (accommodationId: number, dateStr: string) => {
    const status: { [key: number]: 'available' | 'blocked' } = {};
    const accommodation = accommodations.find(a => a.id === accommodationId);
    if (!accommodation) return status;

    // Start with all rooms available
    for (let i = 1; i <= accommodation.rooms; i++) {
      status[i] = 'available';
    }

    // Get the latest blocked date for this accommodation and date
    const latestBlockedDate = getLatestBlockedDate(accommodationId, dateStr);

    // If there is a blocked date, add additional rooms
    if (latestBlockedDate) {
      // If there's a "block all" entry, add all rooms again
      if (latestBlockedDate.rooms === null) {
        for (let i = accommodation.rooms + 1; i <= accommodation.rooms * 2; i++) {
          status[i] = 'available';
        }
      } else {
        // Add rooms based on blocked date
        const blockedRoomCount = Number(latestBlockedDate.rooms) || 0;
        for (let i = accommodation.rooms + 1; i <= accommodation.rooms + blockedRoomCount; i++) {
          status[i] = 'available';
        }
      }
    }

    return status;
  };
  const handleDayClick = async (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');

    // Prevent re-processing if same date is clicked multiple times
    if (lastClickedDate.current === dayStr && showForm) {
      return;
    }

    lastClickedDate.current = dayStr;

    if (isProcessingDayClick) return;
    setAvailableRooms(null);
    setSelectedRoom(0);
    setIsBlockAll(false);
    setIsProcessingDayClick(true);

    if (isBefore(startOfDay(day), startOfDay(new Date()))) {
      setError('Cannot block or modify past dates');
      setIsProcessingDayClick(false);
      return;
    }

    setShowForm(true);
    setActiveSection('price'); // Always start with price section

    // Reset form only if it's a different date or new selection
    if (!selectedDay || format(selectedDay, 'yyyy-MM-dd') !== dayStr) {
      setEditingDate(null);
      setReason('');
      setSelectedRoom(null);
      setAdultPrice('');
      setChildPrice('');
      setAvailableRooms(null);
      setSelectedRoom(0);
      setIsBlockAll(false);
    }

    setSelectedDay(day);
    try {
      // Find the latest blocked date for this date and accommodation
      const blockedDate = selectedAccommodationId
        ? getLatestBlockedDate(selectedAccommodationId, dayStr)
        : null;

      if (blockedDate) {
        setEditingDate(blockedDate);
        setReason(blockedDate.reason || '');
        setSelectedRoom(blockedDate.rooms || null);
        setAdultPrice(blockedDate.adult_price || '');
        setChildPrice(blockedDate.child_price || '');
        setIsBlockAll(blockedDate.rooms === null);
        setActiveSection('price'); // Always show price section first

        if (blockedDate.accommodation_id) {
          const available = await calculateAvailableRooms(blockedDate.accommodation_id, dayStr);
          setAvailableRooms(available);
          const status = getRoomStatus(blockedDate.accommodation_id, dayStr);
          setRoomStatus(status);
        }
      } else {
        // Reset to default values if no blocked date found
        if (selectedAccommodationId) {
          const defaultPrices = getDefaultPrices(selectedAccommodationId);
          setAdultPrice(defaultPrices.adult || '');
          setChildPrice(defaultPrices.child || '');
          const available = await calculateAvailableRooms(selectedAccommodationId, dayStr);
          setAvailableRooms(available);
          setSelectedRoom(available);
          const status = getRoomStatus(selectedAccommodationId, dayStr);
          setRoomStatus(status);
        }
      }
    } catch (error) {
      console.error('Error processing day click:', error);
      setError('Failed to load date information');
    } finally {
      setIsProcessingDayClick(false);
    }
  };
  const handleAccommodationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    setSelectedAccommodationId(id);
    setSelectedRoom(null);
    setIsBlockAll(false);

    if (id) {
      const defaultPrices = getDefaultPrices(id);
      setAdultPrice(defaultPrices.adult || '');
      setChildPrice(defaultPrices.child || '');

      if (selectedDay) {
        const dateStr = format(selectedDay, 'yyyy-MM-dd');
        const available = await calculateAvailableRooms(id, dateStr);
        setAvailableRooms(available);
        setSelectedRoom(available);
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
    if (activeSection === 'price' && adultPrice === '' && childPrice === '') {
      setError('Please set at least one price');
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
  const handleSaveBlockedDates = async () => {
    if (!validateForm()) return;
    if (!selectedDay && !editingDate) {
      setError('Please select a date');
      return;
    }
    try {
      setLoading(true);
      const dates = editingDate && editingDate.blocked_date
        ? [editingDate.blocked_date]
        : selectedDay
          ? [format(selectedDay, 'yyyy-MM-dd')]
          : [];

      // For inventory section, if Add All Rooms is checked, set selectedRoom to null
      const roomValue = activeSection === 'inventory' && isBlockAll ? null : selectedRoom;

      const payload = {
        dates,
        reason,
        accommodation_id: selectedAccommodationId,
        room_number: roomValue,
        adult_price: adultPrice,
        child_price: childPrice
      };

      console.log('Saving blocked date with payload:', payload);

      const url = editingDate
        ? `${admin_BASE_URL}/blocked-dates/${editingDate.id}`
        : `${admin_BASE_URL}/blocked-dates`;

      const response = await axios({
        method: editingDate ? 'put' : 'post',
        url,
        data: payload,
        headers: { 'Content-Type': 'application/json' }
      });

      const data: ApiResponse = response.data;
      if (data.success) {
        setSuccess(editingDate ? 'Updated successfully' : 'Saved successfully');
        setLastUpdated(new Date());
        resetForm();
        await fetchBlockedDates();
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveBlockedDate = async (date: BlockedDate) => {
    const dateString = date.blocked_date
      ? format(safeParseISO(date.blocked_date) || new Date(), 'MMMM d, yyyy')
      : 'this date';
    if (!confirm(`Are you sure you want to remove additional rooms for ${dateString}?`)) {
      return;
    }
    try {
      setIsDeleting(true);
      const response = await fetch(`${admin_BASE_URL}/blocked-dates/${date.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      const data: ApiResponse = await response.json();
      if (data.success) {
        setSuccess('Additional rooms removed successfully');
        setLastUpdated(new Date());
        await fetchBlockedDates();
      } else {
        setError(data.message || 'Failed to remove additional rooms');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
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
    setActiveSection('price');
    setIsBlockAll(false);
    lastClickedDate.current = null;
  };
  const getBlockStatusForDate = (date: Date) => {
    if (!selectedAccommodationId) return null;
    const dateStr = format(date, 'yyyy-MM-dd');

    // Get the latest blocked date for this accommodation and date
    const latestBlockedDate = getLatestBlockedDate(selectedAccommodationId, dateStr);

    if (!latestBlockedDate) return null;

    // Use optional chaining and nullish coalescing to handle possible undefined values
    const isFullyAdded = latestBlockedDate.rooms === null;
    const hasPartialAdds = (latestBlockedDate.rooms ?? 0) > 0;
    const hasPriceChanges = latestBlockedDate.adult_price || latestBlockedDate.child_price;
    const hasReason = latestBlockedDate.reason;

    return {
      isFullyAdded,
      hasPartialAdds,
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
  const filteredBlockedDates = selectedAccommodationId
    ? blockedDates.filter(b => b.accommodation_id === selectedAccommodationId)
    : [];
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Calendar</h1>
        <p className="mt-2 text-gray-600">Add additional rooms for dates when needed</p>

        {/* Last Updated Timestamp */}
        {lastUpdated && (
          <div className="text-sm text-gray-500 mt-1">
            Last updated: {format(lastUpdated, 'MMMM d, yyyy h:mm a')}
          </div>
        )}
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
              Select Dates to Add Rooms
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

              if (blockedStatus) {
                if (blockedStatus.isFullyAdded) {
                  dayClasses.push(
                    'bg-green-100',
                    'text-green-700'
                  );
                } else if (blockedStatus.hasPartialAdds || blockedStatus.hasReason) {
                  dayClasses.push(
                    'bg-blue-100',
                    'relative',
                    'partially-added'
                  );
                } else if (blockedStatus.hasPriceChanges) {
                  dayClasses.push(
                    'bg-purple-100',
                    'text-purple-700'
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
                  disabled={loading || isBefore(startOfDay(day), startOfDay(new Date())) || isProcessingDayClick}
                  className={dayClasses.join(' ')}
                >
                  {day.getDate()}
                  {blockedStatus?.hasPartialAdds && (
                    <span className="absolute bottom-1 right-1 w-1 h-1 bg-blue-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 mr-2"></div>
              <span>All Rooms Added</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 mr-2 relative">
                <span className="absolute bottom-0 right-0 w-1 h-1 bg-blue-500 rounded-full"></span>
              </div>
              <span>Partial Rooms Added</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-100 mr-2"></div>
              <span>Price Changes</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 mr-2 rounded-full"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-300 mr-2"></div>
              <span>Standard Availability</span>
            </div>
          </div>
        </div>

        {/* Form and Blocked Dates List */}
        <div className="space-y-6">
          {/* Form - Always visible after date click */}
          <div className="bg-white rounded-lg shadow-sm border p-6 py-0 pb-6">
            {showForm ? (
              <div className="space-y-4">
                {/* Section Tabs */}
                <div className="flex border-b mb-4">
                  <button
                    className={`py-2 px-4 font-medium text-sm ${activeSection === 'price' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveSection('price')}
                  >
                    Price Management
                  </button>
                  <button
                    className={`py-2 px-4 font-medium text-sm ${activeSection === 'inventory' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveSection('inventory')}
                  >
                    Add Rooms
                  </button>
                </div>

                {/* Selected Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Date
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {editingDate && editingDate.blocked_date
                      ? format(safeParseISO(editingDate.blocked_date) || new Date(), 'MMMM d, yyyy')
                      : selectedDay ? format(selectedDay, 'MMMM d, yyyy') : 'No date selected'
                    }
                  </div>
                </div>

                {/* Accommodation Selection */}
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
                </div>

                {/* Price Management Section */}
                {activeSection === 'price' && (
                  <div className="space-y-4 pt-4">
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
                  </div>
                )}

                {/* Inventory Management Section */}
                {activeSection === 'inventory' && selectedAccommodationId && (
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Available Rooms: {availableRooms}
                      </label>

                      {/* Add All Rooms */}
                      <div className="mb-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isBlockAll}
                            onChange={() => {
                              setIsBlockAll(!isBlockAll);
                              setSelectedRoom(0);
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700">Add All Rooms Again</span>
                        </label>
                      </div>

                      {!isBlockAll && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rooms to Add
                          </label>

                          {/* Room Counter */}
                          <div className="flex items-center">
                            <button
                              onClick={() => setSelectedRoom(prev => Math.max(0, (prev || 0) - 1))}
                              disabled={selectedRoom === null || (selectedRoom || 0) <= 0}
                              className="w-10 h-10 flex items-center justify-center rounded-md bg-green-600 text-white text-2xl font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              −
                            </button>
                            {/* Room Count */}
                            <div className="py-2 bg-white text-black-700 font-semibold text-xl min-w-[70px] h-12 flex items-center justify-center select-none">
                              {selectedRoom}
                            </div>
                            {/* Plus Button */}
                            <button
                              onClick={() => setSelectedRoom(prev => (prev || 0) + 1)}
                              className="w-10 h-10 flex items-center justify-center rounded-md bg-green-600 text-white text-2xl font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            Adding {selectedRoom} rooms to availability
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
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
                    onClick={handleSaveBlockedDates}
                    disabled={loading || isFetchingBookedRooms}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingDate ? 'Update' : 'Submit'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarIcon className="mx-auto h-10 w-10 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No dates selected</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Select a date on the calendar to add additional rooms or set custom pricing
                </p>
              </div>
            )}
          </div>

          {/* Blocked Dates List */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedAccommodationId
                ? `Additional Rooms for ${currentAccommodation?.name || 'Selected Accommodation'} (${filteredBlockedDates.length})`
                : 'Additional Rooms'}
            </h3>
            {filteredBlockedDates.length === 0 ? (
              <p className="text-gray-500 text-sm">No additional rooms have been added for this accommodation.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredBlockedDates.map((date) => {
                  // Safe date formatting
                  const formattedDate = date.blocked_date
                    ? format(safeParseISO(date.blocked_date) || new Date(), 'MMMM d, yyyy')
                    : 'Invalid date';

                  const updatedDate = date.updated_at
                    ? format(parseCustomDate(date.updated_at), 'MMM d, h:mm a')
                    : 'Unknown';

                  return (
                    <div
                      key={date.id}
                      className={`flex items-center justify-between p-3 rounded-md ${date.reason ? 'bg-blue-50' : 'bg-green-50'}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {formattedDate}
                        </div>
                        {date.accommodation_name && (
                          <div className="text-xs text-blue-600 flex items-center mt-1">
                            <Building2 className="h-3 w-3 mr-1" />
                            {date.accommodation_name}
                            {date.rooms === null ? ' - All Rooms Added' : ` - ${date.rooms} Rooms Added`}
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
                        <div className="text-xs text-gray-500 mt-1">
                          Updated: {updatedDate}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={async () => {
                            setEditingDate(date);
                            setReason(date.reason || '');
                            setSelectedAccommodationId(date.accommodation_id || null);
                            setSelectedRoom(date.rooms || null);
                            setIsBlockAll(date.rooms === null);
                            setShowForm(true);
                            setSelectedDay(date.blocked_date ? safeParseISO(date.blocked_date) : null);
                            setActiveSection('price');
                            if (date.accommodation_id && date.blocked_date) {
                              const available = await calculateAvailableRooms(date.accommodation_id, date.blocked_date);
                              setAvailableRooms(available);
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        You can manage prices or add additional rooms for selected dates. Switch between sections using the tabs.
        When adding rooms, the total availability will increase by the specified number.
      </p>
    </div>
  );
};
export default Calendar;