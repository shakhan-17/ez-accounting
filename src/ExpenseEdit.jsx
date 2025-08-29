import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const ExpenseEdit = () => {
  const { user } = useAuth();
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [expenseData, setExpenseData] = useState({
    supplier_id: '',
    expense_date: '',
    line_items: [{ account_id: '', description: '', amount: 0 }]
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch suppliers and accounts for the forms
        const { data: suppliersData, error: suppliersError } = await supabase.from('suppliers').select('id, name').eq('user_id', user.id);
        if (suppliersError) throw suppliersError;
        setSuppliers(suppliersData || []);

        const { data: accountsData, error: accountsError } = await supabase.from('chart_of_accounts').select('id, code, name');
        if (accountsError) throw accountsError;
        setAccounts(accountsData || []);

        // Fetch the main expense data
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', expenseId)
          .single();
        if (expenseError) throw expenseError;

        // Fetch the line items for the expense
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('expense_line_items')
          .select('*')
          .eq('expense_id', expenseId);
        if (lineItemsError) throw lineItemsError;

        setExpenseData({
            supplier_id: expense.supplier_id || '',
            expense_date: expense.expense_date,
            line_items: lineItems
        });

      } catch (error) {
        alert(error.message);
        navigate('/expenses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, expenseId, navigate]);

  const handleExpenseChange = (e) => {
    setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
  };

  const handleLineItemChange = (index, e) => {
    const newLineItems = [...expenseData.line_items];
    newLineItems[index][e.target.name] = e.target.value;
    setExpenseData({ ...expenseData, line_items: newLineItems });
  };

  const addLineItem = () => {
    setExpenseData({
      ...expenseData,
      line_items: [...expenseData.line_items, { account_id: '', description: '', amount: 0 }]
    });
  };

  const removeLineItem = (index) => {
    const newLineItems = [...expenseData.line_items];
    newLineItems.splice(index, 1);
    setExpenseData({ ...expenseData, line_items: newLineItems });
  };
    
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (expenseData.line_items.some(item => !item.account_id || item.amount <= 0)) {
      alert('Please ensure all line items have an account and a valid amount.');
      return;
    }

    try {
      setLoading(true);
      // Update the main expense record
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
            supplier_id: expenseData.supplier_id || null,
            expense_date: expenseData.expense_date,
            total_amount: expenseData.line_items.reduce((total, item) => total + (Number(item.amount) || 0), 0)
        })
        .eq('id', expenseId);
      if (expenseError) throw expenseError;

      // Delete old line items and insert new ones
      await supabase.from('expense_line_items').delete().eq('expense_id', expenseId);
      const lineItemsWithExpenseId = expenseData.line_items.map(item => ({
        ...item,
        expense_id: expenseId,
        user_id: user.id
      }));
      await supabase.from('expense_line_items').insert(lineItemsWithExpenseId);
      
      alert('Expense updated successfully!');
      navigate(`/expenses`);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading expense...</p>;
  }

  return (
    <div>
      <h2>Edit Expense</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="supplier">Supplier</label>
          <select id="supplier" name="supplier_id" value={expenseData.supplier_id} onChange={handleExpenseChange}>
            <option value="">Select a Supplier</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expenseDate">Expense Date</label>
          <input type="date" id="expenseDate" name="expense_date" value={expenseData.expense_date} onChange={handleExpenseChange} required />
        </div>

        <hr />
        
        <h3>Line Items</h3>
        {expenseData.line_items.map((item, index) => (
          <div key={index}>
            <select name="account_id" value={item.account_id} onChange={(e) => handleLineItemChange(index, e)} required>
              <option value="">Select an Account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.code} - {account.name}</option>
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
              name="amount"
              placeholder="Amount"
              value={item.amount}
              onChange={(e) => handleLineItemChange(index, e)}
              required
            />
            <button type="button" onClick={() => removeLineItem(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addLineItem}>Add Line Item</button>
        
        <hr />

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Expense'}
        </button>
      </form>
    </div>
  );
};

export default ExpenseEdit;