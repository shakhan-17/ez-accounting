import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const UserProfile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        email: user?.email || '',
        phone: profile.phone || '',
        designation: profile.designation || '',
        department: profile.department || '',
      });
    }
  }, [profile, user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').update({
        full_name: profileData.full_name,
        username: profileData.username,
        phone: profileData.phone,
        designation: profileData.designation,
        department: profileData.department,
      }).eq('id', user.id);
      if (error) throw error;
      alert('Your profile has been updated!');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <p>Loading profile...</p>;

  return (
    <div>
      <h2>My Profile</h2>
      <form onSubmit={handleUpdate}>
        <input name="full_name" placeholder="Full Name" value={profileData.full_name} onChange={handleProfileChange} required />
        <input name="username" placeholder="Username" value={profileData.username} onChange={handleProfileChange} required />
        <input name="email" type="email" placeholder="Email Address" value={profileData.email} disabled />
        <input name="phone" placeholder="Phone Number" value={profileData.phone} onChange={handleProfileChange} />
        <input name="designation" placeholder="Designation" value={profileData.designation} onChange={handleProfileChange} />
        <input name="department" placeholder="Department" value={profileData.department} onChange={handleProfileChange} />
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update My Profile'}</button>
      </form>
    </div>
  );
};
export default UserProfile;