import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const ProductsAndServices = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProducts();
        }
    }, [user]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products_and_services')
                .select('*')
                .eq('user_id', user.id)
                .order('name');
            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                setLoading(true);
                const { error } = await supabase
                    .from('products_and_services')
                    .delete()
                    .eq('id', productId);
                if (error) throw error;
                fetchProducts(); // Refresh the list
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return <p>Loading products...</p>;
    }

    return (
        <div>
            <h2>Products & Services</h2>
            <Link to="/products/new">Add New Product/Service</Link>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>${product.price}</td>
                            <td>
                                <Link to={`/products/edit/${product.id}`}>Edit</Link>
                                <button onClick={() => handleDelete(product.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductsAndServices;