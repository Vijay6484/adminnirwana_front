import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginGate from './components/LoginGate';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accommodations from './pages/Accommodations';
import AccommodationForm from './pages/AccommodationForm';
import Gallery from './pages/Gallery';
import Services from './pages/Services';
import ServiceForm from './pages/ServiceForm';
import Bookings from './pages/Bookings';
import Calendar from './pages/Calendar';
import CreateBooking from './pages/CreateBooking';
import CabBookings from './pages/CabBookings';
import Cabs from './pages/Cabs';
import AdminPackages from './pages/AdminPackages';
import PackageBookings from './pages/PackageBookings';
import Coupons from './pages/Coupons';
import Blogs from './pages/Blogs';
import BlogForm from './pages/BlogForm';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Amenities from './pages/Amenities';
import Cities from './pages/Cities';
import Ratings from './pages/Ratings';
import HomePromotions from './pages/HomePromotions';
import NotFound from './pages/NotFound';
import NoAccess from './pages/NoAccess';
import Success from './pages/Success';
import Failure from './pages/Failure';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginGate />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/no-access" element={<NoAccess />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="accommodations" element={<Accommodations />} />
              <Route path="accommodations/new" element={<AccommodationForm />} />
              <Route path="accommodations/:id" element={<AccommodationForm />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="services" element={<Services />} />
              <Route path="services/new" element={<ServiceForm />} />
              <Route path="services/:id" element={<ServiceForm />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/new" element={<CreateBooking />} />
              <Route path="cab-bookings" element={<CabBookings />} />
              <Route path="cabs" element={<Cabs />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="package-bookings" element={<PackageBookings />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="amenities" element={<Amenities />} />
              <Route path="cities" element={<Cities />} />
              <Route path="ratings" element={<Ratings />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="home-promotions" element={<HomePromotions />} />
              <Route path="blogs" element={<Blogs />} />
              <Route path="blogs/new" element={<BlogForm />} />
              <Route path="blogs/:id" element={<BlogForm />} />
              <Route path="users" element={<Users />} />
              <Route path="users/:id" element={<UserForm />} />
              <Route path="payment-success" element={<Success />} />
              <Route path="payment-failure" element={<Failure />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
