import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

import { Box, Container, Paper, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';

const PurchaseOrderCreate = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);

    const [purchaseOrderData, setPurchaseOrderData] = useState({
        supplier_id: '',
        order_date: new Date().toISOString().slice(0, 10),
        line_items: [{ product_id: '', quantity: 1, unit_cost: 0 }]
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const { data: suppliersData, error: suppliersError } = await supabase
                    .from('suppliers')
                    .select('id, name')
                    .eq('user_id', user.id);
                if (suppliersError) throw suppliersError;
                setSuppliers(suppliersData || []);

                const { data: productsData, error: productsError } = await supabase
                    .from('products_and_services')
                    .select('id, name, unit_cost');
                if (productsError) throw productsError;
                setProducts(productsData || []);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handlePurchaseOrderChange = (e) => {
        setPurchaseOrderData({ ...purchaseOrderData, [e.target.name]: e.target.value });
    };

    const handleLineItemChange = (index, e) => {
        const newLineItems = [...purchaseOrderData.line_items];
        newLineItems[index][e.target.name] = e.target.value;
        setPurchaseOrderData({ ...purchaseOrderData, line_items: newLineItems });
    };

    const addLineItem = () => {
        setPurchaseOrderData({
            ...purchaseOrderData,
            line_items: [...purchaseOrderData.line_items, { product_id: '', quantity: 1, unit_cost: 0 }]
        });
    };

    const removeLineItem = (index) => {
        const newLineItems = [...purchaseOrderData.line_items];
        newLineItems.splice(index, 1);
        setPurchaseOrderData({ ...purchaseOrderData, line_items: newLineItems });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!purchaseOrderData.supplier_id || purchaseOrderData.line_items.some(item => !item.product_id)) {
            alert('Please select a supplier and ensure all line items have a product selected.');
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('create_purchase_order_with_line_items', {
                supplier_id_arg: purchaseOrderData.supplier_id,
                order_date_arg: purchaseOrderData.order_date,
                line_items_arg: purchaseOrderData.line_items.map(item => ({
                    product_id: item.product_id,
                    quantity: parseInt(item.quantity),
                    unit_cost: parseFloat(item.unit_cost)
                }))
            });

            if (error) throw error;
            
            alert('Purchase order created successfully!');
            navigate('/purchase-orders');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = useMemo(() => {
        return purchaseOrderData.line_items.reduce((total, item) => {
            return total + (item.quantity * item.unit_cost);
        }, 0);
    }, [purchaseOrderData.line_items]);

    if (loading && suppliers.length === 0) {
        return <CircularProgress />;
    }

    return (
        <Container component="main" maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Create New Purchase Order
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Supplier</InputLabel>
                            <Select name="supplier_id" value={purchaseOrderData.supplier_id} onChange={handlePurchaseOrderChange} required>
                                <MenuItem value="">Select a Supplier</MenuItem>
                                {suppliers.map(supplier => (
                                    <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Order Date"
                            name="order_date"
                            type="date"
                            value={purchaseOrderData.order_date}
                            onChange={handlePurchaseOrderChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            required
                        />
                    </Box>

                    <Typography variant="h6" gutterBottom>Line Items</Typography>
                    {purchaseOrderData.line_items.map((item, index) => (
                        <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1fr 0.5fr 0.5fr 0.5fr', gap: 2, alignItems: 'center', mb: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Product</InputLabel>
                                <Select
                                    name="product_id"
                                    value={item.product_id}
                                    onChange={(e) => handleLineItemChange(index, e)}
                                    label="Product"
                                    required
                                >
                                    <MenuItem value="">Select Product</MenuItem>
                                    {products.map(product => (
                                        <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Quantity"
                                name="quantity"
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(index, e)}
                                required
                            />
                            <TextField
                                label="Unit Cost"
                                name="unit_cost"
                                type="number"
                                value={item.unit_cost}
                                onChange={(e) => handleLineItemChange(index, e)}
                                required
                            />
                            <Button onClick={() => removeLineItem(index)} color="error" variant="outlined">Remove</Button>
                        </Box>
                    ))}
                    <Button onClick={addLineItem} variant="outlined" sx={{ mb: 3 }}>Add Line Item</Button>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                        <Typography variant="h6">Total: ${totalAmount.toFixed(2)}</Typography>
                        <Box>
                            <Button onClick={() => navigate('/purchase-orders')} sx={{ mr: 1 }}>Cancel</Button>
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Purchase Order'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default PurchaseOrderCreate;