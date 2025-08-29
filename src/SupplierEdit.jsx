import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const SupplierEdit = () => {
    const { user } = useAuth();
    const { supplierId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [supplierData, setSupplierData] = useState({
        name: '',
        email: '',
        phone: '',
        contact_name: ''
    });

    useEffect(() => {
        const fetchSupplier = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('suppliers')
                    .select('*')
                    .eq('id', supplierId)
                    .single();
                if (error) throw error;
                setSupplierData(data);
            } catch (error) {
                alert(error.message);
                navigate('/suppliers');
            } finally {
                setLoading(false);
            }
        };
        fetchSupplier();
    }, [user, supplierId, navigate]);

    const handleFormChange = (e) => {
        setSupplierData({ ...supplierData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('suppliers')
                .update(supplierData)
                .eq('id', supplierId);
            if (error) throw error;
            alert('Supplier updated successfully!');
            navigate('/suppliers');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading supplier details...</p>;
    }

    return (
        <div>
            <h2>Edit Supplier</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Supplier Name" value={supplierData.name} onChange={handleFormChange} required />
                <input type="email" name="email" placeholder="Email" value={supplierData.email} onChange={handleFormChange} />
                <input type="tel" name="phone" placeholder="Phone" value={supplierData.phone} onChange={handleFormChange} />
                <input type="text" name="contact_name" placeholder="Contact Name" value={supplierData.contact_name} onChange={handleFormChange} />
                <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => navigate('/suppliers')} style={{marginLeft: '10px'}}>Cancel</button>
            </form>
        </div>
    );
};

export default SupplierEdit;