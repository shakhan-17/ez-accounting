import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const CustomerEdit = () => {
    const { user } = useAuth();
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        contact_name: ''
    });

    useEffect(() => {
        const fetchCustomer = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', customerId)
                    .single();
                if (error) throw error;
                setCustomerData(data);
            } catch (error) {
                alert(error.message);
                navigate('/customers');
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [user, customerId, navigate]);

    const handleFormChange = (e) => {
        setCustomerData({ ...customerData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('customers')
                .update(customerData)
                .eq('id', customerId);
            if (error) throw error;
            alert('Customer updated successfully!');
            navigate('/customers');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading customer details...</p>;
    }

    return (
        <div>
            <h2>Edit Customer</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Customer Name" value={customerData.name} onChange={handleFormChange} required />
                <input type="email" name="email" placeholder="Email" value={customerData.email} onChange={handleFormChange} />
                <input type="tel" name="phone" placeholder="Phone" value={customerData.phone} onChange={handleFormChange} />
                <input type="text" name="contact_name" placeholder="Contact Name" value={customerData.contact_name} onChange={handleFormChange} />
                <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => navigate('/customers')} style={{marginLeft: '10px'}}>Cancel</button>
            </form>
        </div>
    );
};

export default CustomerEdit;