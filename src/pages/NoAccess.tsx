import React from 'react';
import { Link } from 'react-router-dom';

const NoAccess: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">No access assigned</h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        Your account does not have permission to any admin sections. Please contact an administrator.
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          window.location.href = '/login';
        }}
        className="text-nature-600 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
};

export default NoAccess;
