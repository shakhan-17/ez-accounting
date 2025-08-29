import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const Bills = () => {
    const { user } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchBills();
        }
    }, [user]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('bills')
                .select(`*, suppliers:supplier_id(name)`)
                .eq('user_id', user.id)
                .order('bill_date', { ascending: false });
            if (error) throw error;
            setBills(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading bills...</p>;
    }

    return (
        <div>
            <h2>Bills to Pay</h2>
            <Link to="/bills/new">Create New Bill</Link>
            <table>
                <thead>
                    <tr>
                        <th>Bill Date</th>
                        <th>Supplier</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bills.map(bill => (
                        <tr key={bill.id}>
                            <td>{new Date(bill.bill_date).toLocaleDateString()}</td>
                            <td>{bill.suppliers.name}</td>
                            <td>${Number(bill.total_amount).toFixed(2)}</td>
                            <td>{bill.status}</td>
                            <td>
                                <Link to={`/bills/edit/${bill.id}`}>Edit</Link>
                                {/* We will add a 'Pay' button here later */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Bills;