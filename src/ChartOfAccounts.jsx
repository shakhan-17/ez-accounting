import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const ChartOfAccounts = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAccounts();
        }
    }, [user]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('code');

            if (error) throw error;
            setAccounts(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading accounts...</p>;
    }

    return (
        <div>
            <h2>Chart of Accounts</h2>
            <Link to="/accounts/new">Add New Account</Link>
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(account => (
                        <tr key={account.id}>
                            <td>{account.code}</td>
                            <td>{account.name}</td>
                            <td>{account.type}</td>
                            <td>{account.description}</td>
                            <td>
                                <Link to={`/accounts/edit/${account.id}`}>Edit</Link>
                                {/* Implement delete functionality if needed */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ChartOfAccounts;