import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const BankCreate = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);

    const [bankAccountData, setBankAccountData] = useState({
        bank_name: '',
        account_name: '',
        account_number: '',
        current_balance: 0,
        chart_of_account_id: ''
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('chart_of_accounts')
                    .select('id, name, code')
                    .eq('user_id', user.id)
                    .in('type', ['Asset'])
                    .order('code');
                if (error) throw error;
                setAccounts(data || []);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, [user]);

    const handleFormChange = (e) => {
        setBankAccountData({ ...bankAccountData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('bank_accounts')
                .insert([{ ...bankAccountData, user_id: user.id }]);
            
            if (error) throw error;
            alert('Bank account created successfully!');
            navigate('/bank-accounts');
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
            <h2>Add New Bank Account</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="bank_name" placeholder="Bank Name" value={bankAccountData.bank_name} onChange={handleFormChange} required />
                <input type="text" name="account_name" placeholder="Account Name" value={bankAccountData.account_name} onChange={handleFormChange} required />
                <input type="text" name="account_number" placeholder="Account Number" value={bankAccountData.account_number} onChange={handleFormChange} required />
                <input type="number" name="current_balance" placeholder="Initial Balance" value={bankAccountData.current_balance} onChange={handleFormChange} required />
                <select name="chart_of_account_id" value={bankAccountData.chart_of_account_id} onChange={handleFormChange} required>
                    <option value="">Select Associated Chart of Account</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                </select>
                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Add Account'}
                </button>
                <button type="button" onClick={() => navigate('/bank-accounts')} style={{marginLeft: '10px'}}>Cancel</button>
            </form>
        </div>
    );
};

export default BankCreate;