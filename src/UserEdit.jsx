import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const UserEdit = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
  });
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (roleError && roleError.code !== 'PGRST116') throw roleError;

        if (roleData?.role === 'admin') {
          setIsCurrentUserAdmin(true);
        } else {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('get-user', {
          body: { userId },
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;
        
        setProfileData({
          full_name: data.full_name || '',
          username: data.username || '',
          email: data.email || '',
          phone: data.phone || '',
          designation: data.designation || '',
          department: data.department || '',
        });
        setRole(data.role || 'employee');

      } catch (error) {
        alert(error.message);
        navigate('/user-management');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, user, navigate, session]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.rpc('update_user_profile_and_role', {
        user_id_arg: userId,
        profile_data: {
          full_name: profileData.full_name,
          username: profileData.username,
          phone: profileData.phone,
          designation: profileData.designation,
          department: profileData.department,
        },
        new_role_arg: role,
      });
      
      if (error) throw error;
      
      alert('User profile updated successfully!');
      navigate('/user-management');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading user details...</p>;
  }

  if (!isCurrentUserAdmin) {
    return (
      <Container>
        <Typography variant="h5" component="h2" sx={{ mt: 4 }}>
          Access Denied
        </Typography>
        <Typography>
          You must be an administrator to view this page.
        </Typography>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Edit User: {profileData.email}
        </Typography>
        <form onSubmit={handleUpdate}>
          <Box display="grid" gap={2}>
            <TextField
              label="Full Name"
              name="full_name"
              value={profileData.full_name}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Username"
              name="username"
              value={profileData.username}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Email (Read-only)"
              name="email"
              value={profileData.email}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Phone Number"
              name="phone"
              value={profileData.phone}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Designation"
              name="designation"
              value={profileData.designation}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Department"
              name="department"
              value={profileData.department}
              onChange={handleProfileChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="button" onClick={() => navigate('/user-management')} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default UserEdit;