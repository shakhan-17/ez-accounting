import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const InvoiceEdit = () => {
    const { user } = useAuth();
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [invoiceData, setInvoiceData] = useState({
        customer_id: '',
        issue_date: '',
        due_date: '',
        invoice_number: '',
        status: '',
        line_items: []
    });

    useEffect(() => {
        if (user && invoiceId) {
            fetchData();
        }
    }, [user, invoiceId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: customersData, error: customersError } = await supabase.from('customers').select('id, name');
            if (customersError) throw customersError;
            setCustomers(customersData);

            const { data: productsData, error: productsError } = await supabase.from('products_and_services').select('id, name, price');
            if (productsError) throw productsError;
            setProducts(productsData);

            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();
            if (invoiceError) throw invoiceError;

            const { data: lineItems, error: lineItemsError } = await supabase
                .from('invoice_line_items')
                .select('*')
                .eq('invoice_id', invoiceId);
            if (lineItemsError) throw lineItemsError;

            setInvoiceData({
                customer_id: invoice.customer_id,
                issue_date: invoice.issue_date,
                due_date: invoice.due_date,
                invoice_number: invoice.invoice_number,
                status: invoice.status,
                line_items: lineItems
            });

        } catch (error) {
            alert(error.message);
            navigate('/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleInvoiceChange = (e) => {
        setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });
    };

    const handleLineItemChange = (index, e) => {
        const newLineItems = [...invoiceData.line_items];
        newLineItems[index][e.target.name] = e.target.value;
        setInvoiceData({ ...invoiceData, line_items: newLineItems });
    };

    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('invoices')
                .update({
                    customer_id: invoiceData.customer_id,
                    issue_date: invoiceData.issue_date,
                    due_date: invoiceData.due_date,
                    invoice_number: invoiceData.invoice_number,
                    status: invoiceData.status,
                    total_amount: invoiceData.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
                })
                .eq('id', invoiceId);
            if (error) throw error;
            
            // Delete old line items and insert new ones
            await supabase.from('invoice_line_items').delete().eq('invoice_id', invoiceId);
            const lineItemsWithInvoiceId = invoiceData.line_items.map(item => ({
                ...item,
                invoice_id: invoiceId,
                user_id: user.id
            }));
            await supabase.from('invoice_line_items').insert(lineItemsWithInvoiceId);

            alert('Invoice updated successfully!');
            navigate(`/invoices/${invoiceId}`);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const addLineItem = () => {
        setInvoiceData({
            ...invoiceData,
            line_items: [...invoiceData.line_items, { product_id: '', description: '', quantity: 1, unit_price: 0 }]
        });
    };

    const removeLineItem = (index) => {
        const newLineItems = [...invoiceData.line_items];
        newLineItems.splice(index, 1);
        setInvoiceData({ ...invoiceData, line_items: newLineItems });
    };

    if (loading) {
        return <p>Loading invoice...</p>;
    }

    return (
        <div>
            <h2>Edit Invoice</h2>
            <form onSubmit={handleSaveInvoice}>
                <div>
                    <label>Customer:</label>
                    <select name="customer_id" value={invoiceData.customer_id} onChange={handleInvoiceChange} required>
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Invoice Number:</label>
                    <input type="text" name="invoice_number" value={invoiceData.invoice_number} onChange={handleInvoiceChange} required />
                </div>
                <div>
                    <label>Issue Date:</label>
                    <input type="date" name="issue_date" value={invoiceData.issue_date} onChange={handleInvoiceChange} required />
                </div>
                <div>
                    <label>Due Date:</label>
                    <input type="date" name="due_date" value={invoiceData.due_date} onChange={handleInvoiceChange} required />
                </div>
                <div>
                    <label>Status:</label>
                    <select name="status" value={invoiceData.status} onChange={handleInvoiceChange}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="void">Void</option>
                    </select>
                </div>

                <h3>Line Items</h3>
                {invoiceData.line_items.map((item, index) => (
                    <div key={index}>
                        <select name="product_id" value={item.product_id} onChange={(e) => handleLineItemChange(index, e)}>
                            <option value="">Select Product</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            name="description"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, e)}
                        />
                        <input
                            type="number"
                            name="quantity"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(index, e)}
                            required
                        />
                        <input
                            type="number"
                            name="unit_price"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => handleLineItemChange(index, e)}
                            required
                        />
                        <button type="button" onClick={() => removeLineItem(index)}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addLineItem}>Add Line Item</button>

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Invoice'}
                </button>
                <button type="button" onClick={() => navigate(`/invoices/${invoiceId}`)} style={{marginLeft: '10px'}}>Cancel</button>
            </form>
        </div>
    );
};

export default InvoiceEdit;