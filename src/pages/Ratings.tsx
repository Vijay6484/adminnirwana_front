import React, { useState, useEffect } from 'react';
import { Star, Building2, User, Calendar, Trash2 } from 'lucide-react';

interface Rating {
  id: number;
  propertyName: string;
  guestName: string;
  rating: number;
  review: string;
  date: string;
  image?: string;
}

const Ratings = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://adminnirwana-back-1.onrender.com/admin/ratings')
      .then(res => res.json())
      .then(data => {
        setRatings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this rating?')) {
      await fetch(`https://adminnirwana-back-1.onrender.com/admin/ratings/${id}`, { method: 'DELETE' });
      setRatings(ratings.filter(rating => rating.id !== id));
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ratings & Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor guest ratings and reviews
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200">
          {loading && (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          )}
          {!loading && ratings.map((rating) => (
            <div key={rating.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {rating.propertyName}
                    </h3>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="flex mr-4">
                      {renderStars(rating.rating)}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{rating.review}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-4">{rating.guestName}</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(rating.date)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(rating.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && ratings.length === 0 && (
          <div className="text-center py-12">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No ratings yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ratings and reviews will appear here once guests start reviewing their stays.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ratings;