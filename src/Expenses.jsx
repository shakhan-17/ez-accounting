import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const Expenses = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchExpenses();
        }
    }, [user]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('expenses')
                .select(`*, suppliers:supplier_id(name)`)
                .eq('user_id', user.id)
                .order('expense_date', { ascending: false });
            if (error) throw error;
            setExpenses(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (expenseId) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                setLoading(true);
                // We'll use a backend function to handle the deletion and any related journal entries.
                // This RPC is not yet created.
                const { error } = await supabase.rpc('delete_expense', { expense_id_arg: expenseId });
                if (error) throw error;
                fetchExpenses();
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return <p>Loading expenses...</p>;
    }

    return (
        <div>
            <h2>Expenses</h2>
            <Link to="/expenses/new">Create New Expense</Link>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Total Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map(expense => (
                        <tr key={expense.id}>
                            <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                            <td>{expense.suppliers?.name || 'N/A'}</td>
                            <td style={{textAlign: 'right'}}>${Number(expense.total_amount).toFixed(2)}</td>
                            <td>
                                <Link to={`/expenses/edit/${expense.id}`}>Edit</Link>
                                <button onClick={() => handleDelete(expense.id)} style={{marginLeft: '10px'}}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Expenses;