import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const AccountEdit = () => {
    const { user } = useAuth();
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [accountData, setAccountData] = useState({
        code: '',
        name: '',
        type: '',
        description: ''
    });

    useEffect(() => {
        const fetchAccount = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('chart_of_accounts')
                    .select('*')
                    .eq('id', accountId)
                    .single();
                if (error) throw error;
                setAccountData(data);
            } catch (error) {
                alert(error.message);
                navigate('/chart-of-accounts');
            } finally {
                setLoading(false);
            }
        };
        fetchAccount();
    }, [user, accountId, navigate]);

    const handleFormChange = (e) => {
        setAccountData({ ...accountData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('chart_of_accounts')
                .update(accountData)
                .eq('id', accountId);
            if (error) throw error;
            alert('Account updated successfully!');
            navigate('/chart-of-accounts');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading account details...</p>;
    }

    return (
        <div>
            <h2>Edit Account</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="code" placeholder="Account Code" value={accountData.code} onChange={handleFormChange} required />
                <input type="text" name="name" placeholder="Account Name" value={accountData.name} onChange={handleFormChange} required />
                <select name="type" value={accountData.type} onChange={handleFormChange} required>
                    <option value="">Select Account Type</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                    <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                </select>
                <textarea name="description" placeholder="Description" value={accountData.description} onChange={handleFormChange}></textarea>
                <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => navigate('/chart-of-accounts')} style={{marginLeft: '10px'}}>Cancel</button>
            </form>
        </div>
    );
};

export default AccountEdit;