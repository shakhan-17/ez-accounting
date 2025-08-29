import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const BusinessProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [businessData, setBusinessData] = useState({
    name: '',
    type: 'Sole Proprietorship',
    physical_address: '',
    mailing_address: '',
    website: '',
    fiscal_year_start: 'January',
    currency: 'USD',
  });

  const [owners, setOwners] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [newOwnerDesignation, setNewOwnerDesignation] = useState('');

  useEffect(() => {
    if (user) {
        fetchBusinessProfile();
        fetchOwnersAndUsers();
    }
  }, [user]);

  const fetchBusinessProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      if (error) throw error;
      setBusinessData(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnersAndUsers = async () => {
      setLoading(true);
      try {
        const { data: ownerData, error: ownerError } = await supabase
            .from('owners')
            .select('*')
            .eq('profile_id', user.id);
        if(ownerError) throw ownerError;
        setOwners(ownerData || []);

        const { data: allUsersData, error: allUsersError } = await supabase
            .from('profiles')
            .select('id, full_name, email');
        if(allUsersError) throw allUsersError;
        setAllUsers(allUsersData || []);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
  };

  const handleProfileChange = (e) => {
    setBusinessData({ ...businessData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from('businesses').update(businessData).eq('owner_id', user.id);
      if (error) throw error;
      alert('Business profile updated successfully!');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOwner = async (e) => {
      e.preventDefault();
      if (!newOwnerId) {
          alert('Please select a user to add as an owner.');
          return;
      }
      try {
          setLoading(true);
          const { error } = await supabase.rpc('add_owner', {
              user_id_arg: newOwnerId,
              designation_arg: newOwnerDesignation
          });
          if (error) throw error;
          alert('New owner added successfully.');
          fetchOwnersAndUsers();
          setNewOwnerId('');
          setNewOwnerDesignation('');
      } catch (error) {
          alert(error.message);
      } finally {
          setLoading(false);
      }
  };
  
  const potentialNewOwners = useMemo(() => {
      const ownerIds = new Set(owners.map(o => o.user_id));
      return allUsers.filter(u => !ownerIds.has(u.id));
  }, [allUsers, owners]);


  if (loading) return <p>Loading profile...</p>;

  return (
    <div>
      <h2>Business Profile & Settings</h2>
      <form onSubmit={handleUpdate}>
        <h3>Business Details</h3>
        <input name="name" placeholder="Business Name" value={businessData.name} onChange={handleProfileChange} required />
        <select name="type" value={businessData.type} onChange={handleProfileChange}>
          <option>Sole Proprietorship</option>
          <option>Partnership</option>
          <option>Corporation</option>
          <option>Non-Profit</option>
        </select>
        <input name="physical_address" placeholder="Physical Address" value={businessData.physical_address} onChange={handleProfileChange} />
        <input name="mailing_address" placeholder="Mailing Address" value={businessData.mailing_address} onChange={handleProfileChange} />
        <input name="website" placeholder="Website" value={businessData.website} onChange={handleProfileChange} />

        <h3>Financial Settings</h3>
        <label>First Month of Fiscal Year</label>
        <select name="fiscal_year_start" value={businessData.fiscal_year_start} onChange={handleProfileChange}>
            <option>January</option><option>February</option><option>March</option><option>April</option><option>May</option><option>June</option><option>July</option><option>August</option><option>September</option><option>October</option><option>November</option><option>December</option>
        </select>
        <label>Currency</label>
        <select name="currency" value={businessData.currency} onChange={handleProfileChange}>
          <option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update Business Profile'}</button>
      </form>

      <hr style={{margin: '40px 0'}}/>

      <h2>Business Owners</h2>
      <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
            </tr>
        </thead>
        <tbody>
            {owners.map(owner => (
                <tr key={owner.id}>
                    <td>{owner.full_name}</td>
                    <td>{owner.email}</td>
                    <td>{owner.designation}</td>
                </tr>
            ))}
        </tbody>
      </table>

      <form onSubmit={handleAddOwner} style={{marginTop: '20px'}}>
        <h3>Add New Owner</h3>
        <select value={newOwnerId} onChange={e => setNewOwnerId(e.target.value)} required>
            <option value="">Select a User to make an Owner</option>
            {potentialNewOwners.map(u => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
            ))}
        </select>
        <input type="text" placeholder="Designation (e.g., CEO)" value={newOwnerDesignation} onChange={e => setNewOwnerDesignation(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Owner'}</button>
      </form>
    </div>
  );
};
export default BusinessProfile;