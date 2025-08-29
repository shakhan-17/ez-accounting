import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const BillEdit = () => {
  const { user } = useAuth();
  const { billId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [billData, setBillData] = useState({
    supplier_id: '',
    purchase_order_id: '',
    bill_date: '',
    due_date: '',
    status: '',
    line_items: []
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch suppliers and products for the forms
        const { data: suppliersData, error: suppliersError } = await supabase.from('suppliers').select('id, name').eq('user_id', user.id);
        if (suppliersError) throw suppliersError;
        setSuppliers(suppliersData || []);

        const { data: poData, error: poError } = await supabase.from('purchase_orders').select('id, order_date').eq('user_id', user.id);
        if (poError) throw poError;
        setPurchaseOrders(poData || []);

        const { data: productsData, error: productsError } = await supabase.from('products_and_services').select('id, name, unit_cost');
        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch the main bill data
        const { data: bill, error: billError } = await supabase
          .from('bills')
          .select('*')
          .eq('id', billId)
          .single();
        if (billError) throw billError;

        // Fetch the line items for the bill
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('bill_line_items')
          .select('*')
          .eq('bill_id', billId);
        if (lineItemsError) throw lineItemsError;

        setBillData({
            supplier_id: bill.supplier_id || '',
            purchase_order_id: bill.purchase_order_id || '',
            bill_date: bill.bill_date,
            due_date: bill.due_date,
            status: bill.status,
            line_items: lineItems
        });
      } catch (error) {
        alert(error.message);
        navigate('/bills');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, billId, navigate]);

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
    if (billData.line_items.some(item => !item.product_id || item.quantity <= 0 || item.unit_cost <= 0)) {
        alert('Please ensure all line items have a product, quantity, and unit cost.');
        return;
    }

    try {
      setLoading(true);
      const { error: billError } = await supabase
        .from('bills')
        .update({
            supplier_id: billData.supplier_id,
            purchase_order_id: billData.purchase_order_id || null,
            bill_date: billData.bill_date,
            due_date: billData.due_date,
            status: billData.status,
            total_amount: billData.line_items.reduce((total, item) => total + (item.quantity * item.unit_cost), 0)
        })
        .eq('id', billId);
      if (billError) throw billError;

      await supabase.from('bill_line_items').delete().eq('bill_id', billId);
      const lineItemsWithBillId = billData.line_items.map(item => ({
        ...item,
        bill_id: billId,
        user_id: user.id
      }));
      await supabase.from('bill_line_items').insert(lineItemsWithBillId);
      
      alert('Bill updated successfully!');
      navigate(`/bills`);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading bill...</p>;
  }

  return (
    <div>
      <h2>Edit Bill: {billId}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Supplier:</label>
          <select name="supplier_id" value={billData.supplier_id} onChange={handleBillChange} required>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Purchase Order:</label>
          <select name="purchase_order_id" value={billData.purchase_order_id} onChange={handleBillChange}>
            <option value="">None</option>
            {purchaseOrders.map(po => (
              <option key={po.id} value={po.id}>PO #{po.id.slice(0, 8)}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Bill Date:</label>
          <input type="date" name="bill_date" value={billData.bill_date} onChange={handleBillChange} required />
        </div>
        <div>
          <label>Due Date:</label>
          <input type="date" name="due_date" value={billData.due_date} onChange={handleBillChange} required />
        </div>
        <div>
          <label>Status:</label>
          <select name="status" value={billData.status} onChange={handleBillChange}>
            <option value="Awaiting Payment">Awaiting Payment</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        <h3>Line Items</h3>
        {billData.line_items.map((item, index) => (
          <div key={index}>
            <select name="product_id" value={item.product_id} onChange={(e) => handleLineItemChange(index, e)} required>
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <input type="text" name="description" placeholder="Description" value={item.description} onChange={(e) => handleLineItemChange(index, e)} />
            <input type="number" name="quantity" placeholder="Quantity" value={item.quantity} onChange={(e) => handleLineItemChange(index, e)} required />
            <input type="number" name="unit_cost" placeholder="Unit Cost" value={item.unit_cost} onChange={(e) => handleLineItemChange(index, e)} required />
            <button type="button" onClick={() => removeLineItem(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addLineItem}>Add Line Item</button>

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Bill'}
        </button>
        <button type="button" onClick={() => navigate('/bills')} style={{marginLeft: '10px'}}>Cancel</button>
      </form>
    </div>
  );
};

export default BillEdit;