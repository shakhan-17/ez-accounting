import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const BankAccountEdit = () => {
    const { user } = useAuth();
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [accounts, setAccounts] = useState([]);
    
    const [bankAccountData, setBankAccountData] = useState({
        bank_name: '',
        account_name: '',
        account_number: '',
        current_balance: 0,
        chart_of_account_id: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                // Fetch chart of accounts for the dropdown
                const { data: accountsData, error: accountsError } = await supabase
                    .from('chart_of_accounts')
                    .select('id, name, code')
                    .eq('user_id', user.id)
                    .in('type', ['Asset'])
                    .order('code');
                if (accountsError) throw accountsError;
                setAccounts(accountsData || []);

                // Fetch the bank account to be edited
                const { data: bankAccount, error: bankAccountError } = await supabase
                    .from('bank_accounts')
                    .select('*')
                    .eq('id', accountId)
                    .single();
                if (bankAccountError) throw bankAccountError;
                setBankAccountData(bankAccount);

            } catch (error) {
                alert(error.message);
                navigate('/bank-accounts');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, accountId, navigate]);

    const handleFormChange = (e) => {
        setBankAccountData({ ...bankAccountData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('bank_accounts')
                .update({
                    bank_name: bankAccountData.bank_name,
                    account_name: bankAccountData.account_name,
                    account_number: bankAccountData.account_number,
                    current_balance: bankAccountData.current_balance,
                    chart_of_account_id: bankAccountData.chart_of_account_id
                })
                .eq('id', accountId);
            if (error) throw error;
            alert('Bank account updated successfully!');
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
            <h2>Edit Bank Account</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="bank_name" placeholder="Bank Name" value={bankAccountData.bank_name} onChange={handleFormChange} required />
                <input type="text" name="account_name" placeholder="Account Name" value={bankAccountData.account_name} onChange={handleFormChange} required />
                <input type="text" name="account_number" placeholder="Account Number" value={bankAccountData.account_number} onChange={handleFormChange} required />
                <input type="number" name="current_balance" placeholder="Current Balance" value={bankAccountData.current_balance} onChange={handleFormChange} required />
                <select name="chart_of_account_id" value={bankAccountData.chart_of_account_id} onChange={handleFormChange} required>
                    <option value="">Select Associated Chart of Account</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                </select>
                <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => navigate('/bank-accounts')} style={{marginLeft: '10px'}}>Cancel</button>
            </form>
        </div>
    );
};

export default BankAccountEdit;