import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

import { Box, Container, Paper, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';

const BillCreate = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [suppliers, setSuppliers] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [products, setProducts] = useState([]);

    const [billData, setBillData] = useState({
        supplier_id: '',
        purchase_order_id: '',
        bill_date: new Date().toISOString().slice(0, 10),
        due_date: '',
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

                // Fetch a list of open purchase orders
                const { data: poData, error: poError } = await supabase
                    .from('purchase_orders')
                    .select('id, order_date, total_amount')
                    .eq('user_id', user.id)
                    .eq('status', 'Sent');
                if (poError) throw poError;
                setPurchaseOrders(poData || []);

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

    const handleBillChange = (e) => {
        setBillData({ ...billData, [e.target.name]: e.target.value });
    };

    const handleLineItemChange = (index, e) => {
        const newLineItems = [...billData.line_items];
        newLineItems[index][e.target.name] = e.target.value;
        setBillData({ ...billData, line_items: newLineItems });
    };

    const addLineItem = () => {
        setBillData({
            ...billData,
            line_items: [...billData.line_items, { product_id: '', quantity: 1, unit_cost: 0 }]
        });
    };

    const removeLineItem = (index) => {
        const newLineItems = [...billData.line_items];
        newLineItems.splice(index, 1);
        setBillData({ ...billData, line_items: newLineItems });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!billData.supplier_id || billData.line_items.some(item => !item.product_id)) {
            alert('Please select a supplier and ensure all line items have a product selected.');
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('create_bill_with_line_items', {
                supplier_id_arg: billData.supplier_id,
                purchase_order_id_arg: billData.purchase_order_id || null,
                bill_date_arg: billData.bill_date,
                due_date_arg: billData.due_date || null,
                line_items_arg: billData.line_items.map(item => ({
                    product_id: item.product_id,
                    quantity: parseInt(item.quantity),
                    unit_cost: parseFloat(item.unit_cost)
                }))
            });

            if (error) throw error;
            
            alert('Bill created successfully!');
            navigate('/bills');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = useMemo(() => {
        return billData.line_items.reduce((total, item) => {
            return total + (item.quantity * item.unit_cost);
        }, 0);
    }, [billData.line_items]);

    if (loading && suppliers.length === 0) {
        return <CircularProgress />;
    }

    return (
        <Container component="main" maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Create New Bill
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Supplier</InputLabel>
                            <Select name="supplier_id" value={billData.supplier_id} onChange={handleBillChange} required>
                                <MenuItem value="">Select a Supplier</MenuItem>
                                {suppliers.map(supplier => (
                                    <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Purchase Order</InputLabel>
                            <Select name="purchase_order_id" value={billData.purchase_order_id} onChange={handleBillChange}>
                                <MenuItem value="">None</MenuItem>
                                {purchaseOrders.map(po => (
                                    <MenuItem key={po.id} value={po.id}>PO #{po.id.slice(0, 8)}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Bill Date"
                            name="bill_date"
                            type="date"
                            value={billData.bill_date}
                            onChange={handleBillChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Due Date"
                            name="due_date"
                            type="date"
                            value={billData.due_date}
                            onChange={handleBillChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Box>

                    <Typography variant="h6" gutterBottom>Line Items</Typography>
                    {billData.line_items.map((item, index) => (
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
                            <Button onClick={() => navigate('/bills')} sx={{ mr: 1 }}>Cancel</Button>
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Bill'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default BillCreate;