import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for the main invoice details
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  
  // State for line items
  const [lineItems, setLineItems] = useState([
    { product_id: '', quantity: 1, unit_price: 0 }
  ]);

  // State for fetched data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch customers and products when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, name')
          .eq('user_id', user.id);
        if (customersError) throw customersError;
        setCustomers(customersData || []);

        const { data: productsData, error: productsError } = await supabase
          .from('products_and_services')
          .select('id, name, price')
          .eq('user_id', user.id);
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

  // Line item management functions
  const addLineItem = () => {
    setLineItems([...lineItems, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index) => {
    const updatedItems = [...lineItems];
    updatedItems.splice(index, 1);
    setLineItems(updatedItems);
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...lineItems];
    const item = updatedItems[index];
    item[field] = value;

    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        item['unit_price'] = selectedProduct.price;
      }
    }
    setLineItems(updatedItems);
  };
  
  // Calculate total amount whenever line items change
  const totalAmount = useMemo(() => {
    return lineItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  }, [lineItems]);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId || lineItems.some(item => !item.product_id)) {
      alert('Please select a customer and ensure all line items have a product selected.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('create_invoice_with_line_items', {
        customer_id_arg: customerId,
        invoice_date_arg: invoiceDate,
        due_date_arg: dueDate || null,
        status_arg: 'Draft',
        line_items_arg: lineItems.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      });

      if (error) throw error;
      
      alert(`Invoice created successfully!`);
      navigate('/invoices');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return <p>Loading form data...</p>;
  }

  return (
    <div>
      <h2>Create New Invoice</h2>
      <form onSubmit={handleSubmit}>
        {/* Main Invoice Details */}
        <div>
          <label htmlFor="customer">Customer</label>
          <select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Select a Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="invoiceDate">Invoice Date</label>
          <input type="date" id="invoiceDate" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="dueDate">Due Date</label>
          <input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <hr style={{ margin: '20px 0' }}/>
        
        {/* Line Items */}
        <h3>Line Items</h3>
        {lineItems.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select value={item.product_id} onChange={(e) => handleLineItemChange(index, 'product_id', e.target.value)} required>
              <option value="">Select a Product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" placeholder="Quantity" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)} min="1" required />
            <input type="number" placeholder="Unit Price" value={item.unit_price} onChange={(e) => handleLineItemChange(index, 'unit_price', e.target.value)} step="0.01" required />
            <span>Subtotal: ${(item.quantity * item.unit_price).toFixed(2)}</span>
            <button type="button" onClick={() => removeLineItem(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addLineItem}>Add Line Item</button>
        
        <hr style={{ margin: '20px 0' }}/>

        {/* Total and Submit */}
        <h3>Total: ${totalAmount.toFixed(2)}</h3>
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Invoice'}</button>
          <button type="button" onClick={() => navigate('/invoices')} style={{ marginLeft: '10px' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreate;