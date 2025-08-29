import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const ProductEdit = () => {
    const { user } = useAuth();
    const { productId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [productData, setProductData] = useState({
        name: '',
        price: 0,
        unit_cost: 0,
        type: 'Product',
        description: ''
    });

    useEffect(() => {
        const fetchProduct = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('products_and_services')
                    .select('*')
                    .eq('id', productId)
                    .single();
                if (error) throw error;
                setProductData(data);
            } catch (error) {
                alert(error.message);
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [user, productId, navigate]);

    const handleFormChange = (e) => {
        setProductData({ ...productData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('products_and_services')
                .update(productData)
                .eq('id', productId);
            if (error) throw error;
            alert('Product updated successfully!');
            navigate('/products');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading product details...</p>;
    }

    return (
        <div>
            <h2>Edit Product/Service</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Product/Service Name" value={productData.name} onChange={handleFormChange} required />
                <input type="number" name="price" placeholder="Selling Price" value={productData.price} onChange={handleFormChange} required />
                <input type="number" name="unit_cost" placeholder="Unit Cost" value={productData.unit_cost} onChange={handleFormChange} required />
                <select name="type" value={productData.type} onChange={handleFormChange} required>
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                </select>
                <textarea name="description" placeholder="Description" value={productData.description} onChange={handleFormChange}></textarea>
                <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => navigate('/products')} style={{marginLeft: '10px'}}>Cancel</button>
            </form>
        </div>
    );
};

export default ProductEdit;