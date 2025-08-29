import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data: ownerCheck, error: ownerError } = await supabase.from('owners').select('id').eq('user_id', user.id).maybeSingle();
      if(ownerError) throw ownerError;
      const isUserOwner = !!ownerCheck;
      setIsOwner(isUserOwner);

      const { data: userData, error: userError } = await supabase.functions.invoke('list-users');
      if (userError) throw userError;

      const { data: ownerData, error: ownersError } = await supabase.from('owners').select('user_id, designation');
      if (ownersError) throw ownersError;
      
      const combinedUsers = userData.map(u => {
          const ownerInfo = ownerData.find(o => o.user_id === u.id);
          return { ...u, is_owner: !!ownerInfo, designation: ownerInfo?.designation };
      });
      setUsers(combinedUsers);

      if (isUserOwner) {
          // This is the corrected query, specifying the join column
          const { data: approvalData, error: approvalError } = await supabase
            .from('approvals')
            .select('*, target_user:target_user_id(email)')
            .eq('status', 'pending');
          if (approvalError) throw approvalError;
          setApprovals(approvalData || []);
      }
    } catch (err) {
      setError(err.message.includes('JSON') ? 'Permission denied. You must be an administrator.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.is_owner) {
        alert('Owners cannot be deleted from this page.');
        return;
    }
    if (userToDelete.role === 'admin') {
        if (window.confirm('This will submit a deletion request to an owner for approval. Continue?')) {
            const { data, error } = await supabase.rpc('request_admin_deletion', { target_user_id_arg: userToDelete.id });
            if (error) alert(`Error: ${error.message}`);
            else alert(data);
        }
    } else {
        if (window.confirm('Are you sure you want to permanently delete this user?')) {
            const { data, error } = await supabase.functions.invoke('delete-user', { body: { userIdToDelete: userToDelete.id } });
            if (error) alert(`Error: ${error.message}`);
            else {
                alert(data.message);
                fetchData();
            }
        }
    }
  };

  const handleApproveDeletion = async (targetUserId) => {
    if(window.confirm('Are you sure you want to approve the deletion of this administrator?')) {
        const { data, error } = await supabase.rpc('delete_user_by_owner', { target_user_id_arg: targetUserId });
        if(error) alert(`Error: ${error.message}`);
        else {
            alert(data);
            fetchData();
        }
    }
  };

  const handleRoleChange = async (userIdToUpdate, newRole) => {
    try {
        setLoading(true);
        const { error } = await supabase.rpc('update_user_role', { user_id_arg: userIdToUpdate, new_role_arg: newRole });
        if (error) throw error;
        alert('User role updated successfully.');
        fetchData();
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('invite-user', { body: { email: inviteEmail, role: inviteRole } });
        if (error) throw error;
        alert(data.message);
        fetchData();
        setInviteEmail('');
        setInviteRole('employee');
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: 'salmon' }}>Error: {error}</p>;

  return (
    <div>
      {isOwner && approvals.length > 0 && (
        <div style={{border: '1px solid salmon', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>
            <h3>Pending Admin Deletion Approvals</h3>
            {approvals.map(approval => (
                <div key={approval.id}>
                    <p>Request to delete admin: {approval.target_user.email}</p>
                    <button onClick={() => handleApproveDeletion(approval.target_user_id)}>Approve</button>
                </div>
            ))}
        </div>
      )}

      <h2>User Management</h2>
      <form onSubmit={handleInviteUser}>
        <h3>Invite New User</h3>
        <input type="email" placeholder="New user's email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>

      <hr />
      <h3>Current Users & Owners</h3>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Title</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ backgroundColor: u.is_owner ? 'rgba(255, 215, 0, 0.1)' : 'transparent' }}>
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={u.id === user.id || u.is_owner}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{u.is_owner ? `Owner (${u.designation || 'N/A'})` : 'User'}</td>
              <td>
                <Link to={`/user-management/edit/${u.id}`} style={{marginRight: '10px'}}>Edit</Link>
                <button onClick={() => handleDeleteUser(u)} disabled={u.id === user.id || u.is_owner}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;