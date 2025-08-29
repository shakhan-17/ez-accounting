import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const Payments = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchPayments();
        }
    }, [user]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            // Fetch payments
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .order('payment_date', { ascending: false });
            if (paymentsError) throw paymentsError;

            // Fetch customer names in a separate query to bypass schema cache issues
            const customerIds = [...new Set(paymentsData.map(p => p.customer_id))];
            const { data: customersData, error: customersError } = await supabase
                .from('customers')
                .select('id, name')
                .in('id', customerIds);
            if (customersError) throw customersError;
            
            const customerMap = customersData.reduce((map, customer) => {
                map[customer.id] = customer.name;
                return map;
            }, {});

            const combinedPayments = paymentsData.map(payment => ({
                ...payment,
                customer_name: customerMap[payment.customer_id] || 'N/A'
            }));

            setPayments(combinedPayments || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading payments...</p>;
    }

    return (
        <div>
            <h2>Payments Received</h2>
            <Link to="/payments/new">Record New Payment</Link>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Invoice</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map(payment => (
                        <tr key={payment.id}>
                            <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                            <td>{payment.customer_name}</td>
                            <td>{payment.invoice_number}</td>
                            <td>${Number(payment.amount).toFixed(2)}</td>
                            <td>
                                {/* Edit and Delete buttons will be added later */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Payments;