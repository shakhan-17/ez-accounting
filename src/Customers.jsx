import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const Customers = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchCustomers();
        }
    }, [user]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('user_id', user.id)
                .order('name');
            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (customerId) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                setLoading(true);
                const { error } = await supabase
                    .from('customers')
                    .delete()
                    .eq('id', customerId);
                if (error) throw error;
                fetchCustomers();
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return <p>Loading customers...</p>;
    }

    return (
        <div>
            <h2>Customers</h2>
            <Link to="/customers/new">Add New Customer</Link>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map(customer => (
                        <tr key={customer.id}>
                            <td>{customer.name}</td>
                            <td>{customer.email}</td>
                            <td>{customer.phone}</td>
                            <td>
                                <Link to={`/customers/edit/${customer.id}`}>Edit</Link>
                                <button onClick={() => handleDelete(customer.id)} style={{marginLeft: '10px'}}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Customers;