import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const Invoices = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchInvoices();
        }
    }, [user]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select(`*, customers:customer_id(name)`)
                .eq('user_id', user.id)
                .order('issue_date', { ascending: false });
            if (error) throw error;
            setInvoices(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading invoices...</p>;
    }

    return (
        <div>
            <h2>Invoices</h2>
            <Link to="/invoices/new">Create New Invoice</Link>
            <table>
                <thead>
                    <tr>
                        <th>Invoice Number</th>
                        <th>Customer</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map(invoice => (
                        <tr key={invoice.id}>
                            <td>{invoice.invoice_number}</td>
                            <td>{invoice.customers.name}</td>
                            <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
                            <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                            <td>${Number(invoice.total_amount).toFixed(2)}</td>
                            <td>{invoice.status}</td>
                            <td>
                                <Link to={`/invoices/${invoice.id}`}>View</Link>
                                <Link to={`/invoices/edit/${invoice.id}`} style={{marginLeft: '10px'}}>Edit</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Invoices;