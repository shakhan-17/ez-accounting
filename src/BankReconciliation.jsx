import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const BankReconciliation = () => {
    const { user } = useAuth();
    const [reconciliations, setReconciliations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchReconciliations();
        }
    }, [user]);

    const fetchReconciliations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('bank_reconciliations')
                .select(`*, bank_accounts:bank_account_id(bank_name, account_name)`)
                .eq('user_id', user.id)
                .order('statement_date', { ascending: false });
            if (error) throw error;
            setReconciliations(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading reconciliations...</p>;
    }

    return (
        <div>
            <h2>Bank Reconciliation</h2>
            {/* The bank reconciliation feature will be built later. */}
            <table>
                <thead>
                    <tr>
                        <th>Bank Account</th>
                        <th>Statement Date</th>
                        <th>Ending Balance</th>
                        <th>Reconciled At</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {reconciliations.map(rec => (
                        <tr key={rec.id}>
                            <td>{rec.bank_accounts.bank_name} - {rec.bank_accounts.account_name}</td>
                            <td>{new Date(rec.statement_date).toLocaleDateString()}</td>
                            <td>${Number(rec.statement_ending_balance).toFixed(2)}</td>
                            <td>{new Date(rec.reconciled_at).toLocaleDateString()}</td>
                            <td>{rec.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BankReconciliation;