import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const ExpenseCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [expenseData, setExpenseData] = useState({
    supplier_id: '',
    expense_date: new Date().toISOString().slice(0, 10),
    line_items: [{ account_id: '', description: '', amount: 0 }]
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

        const { data: accountsData, error: accountsError } = await supabase
          .from('chart_of_accounts')
          .select('id, code, name');
        if (accountsError) throw accountsError;
        setAccounts(accountsData || []);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

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
      const { data, error } = await supabase.rpc('create_expense_with_line_items', {
        supplier_id_arg: expenseData.supplier_id || null,
        expense_date_arg: expenseData.expense_date,
        line_items_arg: expenseData.line_items.map(item => ({
          account_id: item.account_id,
          description: item.description,
          amount: parseFloat(item.amount)
        }))
      });

      if (error) throw error;
      
      alert('Expense created successfully!');
      navigate('/expenses');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = useMemo(() => {
    return expenseData.line_items.reduce((total, item) => {
      return total + (Number(item.amount) || 0);
    }, 0);
  }, [expenseData.line_items]);


  if (loading) {
    return <p>Loading form data...</p>;
  }

  return (
    <div>
      <h2>Create New Expense</h2>
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

export default ExpenseCreate;