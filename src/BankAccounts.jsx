import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const BankAccounts = () => {
    const { user } = useAuth();
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchBankAccounts();
        }
    }, [user]);

    const fetchBankAccounts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('bank_accounts')
                .select(`*, chart_of_accounts:chart_of_account_id(name, code)`)
                .eq('user_id', user.id)
                .order('bank_name');
            if (error) throw error;
            setBankAccounts(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (accountId) => {
        if (window.confirm('Are you sure you want to delete this bank account?')) {
            try {
                setLoading(true);
                // Assuming a 'delete_bank_account' RPC exists
                const { error } = await supabase.rpc('delete_bank_account', { account_id_arg: accountId });
                if (error) throw error;
                fetchBankAccounts(); // Refresh the list
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return <p>Loading bank accounts...</p>;
    }

    return (
        <div>
            <h2>Bank Accounts</h2>
            <Link to="/bank-accounts/new">Add New Bank Account</Link>
            <table>
                <thead>
                    <tr>
                        <th>Bank Name</th>
                        <th>Account Name</th>
                        <th>Account Number</th>
                        <th>Balance</th>
                        <th>Associated Account</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bankAccounts.map(account => (
                        <tr key={account.id}>
                            <td>{account.bank_name}</td>
                            <td>{account.account_name}</td>
                            <td>{account.account_number}</td>
                            <td>${Number(account.current_balance).toFixed(2)}</td>
                            <td>{account.chart_of_accounts.code} - {account.chart_of_accounts.name}</td>
                            <td>
                                <Link to={`/bank-accounts/edit/${account.id}`}>Edit</Link>
                                <button onClick={() => handleDelete(account.id)} style={{marginLeft: '10px'}}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BankAccounts;