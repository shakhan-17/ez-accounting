import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const PurchaseOrders = () => {
    const { user } = useAuth();
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchPurchaseOrders();
        }
    }, [user]);

    const fetchPurchaseOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('purchase_orders')
                .select(`*, suppliers:supplier_id(name)`)
                .eq('user_id', user.id)
                .order('order_date', { ascending: false });
            if (error) throw error;
            setPurchaseOrders(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading purchase orders...</p>;
    }

    return (
        <div>
            <h2>Purchase Orders</h2>
            <Link to="/purchase-orders/new">Create New Purchase Order</Link>
            <table>
                <thead>
                    <tr>
                        <th>Order Date</th>
                        <th>Supplier</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {purchaseOrders.map(po => (
                        <tr key={po.id}>
                            <td>{new Date(po.order_date).toLocaleDateString()}</td>
                            <td>{po.suppliers.name}</td>
                            <td>${Number(po.total_amount).toFixed(2)}</td>
                            <td>{po.status}</td>
                            <td>
                                <Link to={`/purchase-orders/edit/${po.id}`}>Edit</Link>
                                {/* We will add more actions here later, like 'Receive Products' */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PurchaseOrders;