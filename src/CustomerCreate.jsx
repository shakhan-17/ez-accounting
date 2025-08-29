import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const CustomerCreate = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        contact_name: ''
    });

    const handleFormChange = (e) => {
        setCustomerData({ ...customerData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('customers')
                .insert([{ ...customerData, user_id: user.id }]);
            
            if (error) throw error;

            alert('Customer created successfully!');
            navigate('/customers');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Add New Customer</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Customer Name" value={customerData.name} onChange={handleFormChange} required />
                <input type="email" name="email" placeholder="Email" value={customerData.email} onChange={handleFormChange} />
                <input type="tel" name="phone" placeholder="Phone" value={customerData.phone} onChange={handleFormChange} />
                <input type="text" name="contact_name" placeholder="Contact Name" value={customerData.contact_name} onChange={handleFormChange} />
                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Add Customer'}
                </button>
            </form>
        </div>
    );
};

export default CustomerCreate;