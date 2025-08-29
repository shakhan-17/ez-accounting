import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const PaymentCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [invoices, setInvoices] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [paymentData, setPaymentData] = useState({
    invoice_id: '',
    bank_account_id: '',
    payment_date: new Date().toISOString().slice(0, 10),
    amount: 0,
    customer_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch a list of outstanding invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, customer_id, customers(name)')
          .eq('user_id', user.id)
          .eq('status', 'pending');
        if (invoicesError) throw invoicesError;
        setInvoices(invoicesData || []);

        // Fetch a list of bank accounts
        const { data: bankAccountsData, error: bankAccountsError } = await supabase
          .from('bank_accounts')
          .select('id, bank_name, account_name')
          .eq('user_id', user.id);
        if (bankAccountsError) throw bankAccountsError;
        setBankAccounts(bankAccountsData || []);

      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };
  
  const handleInvoiceChange = (e) => {
      const { value } = e.target;
      const selectedInvoice = invoices.find(inv => inv.id === value);
      setPaymentData({
          ...paymentData,
          invoice_id: value,
          customer_id: selectedInvoice.customer_id,
          amount: selectedInvoice.total_amount
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.invoice_id || !paymentData.bank_account_id || paymentData.amount <= 0) {
      alert('Please select an invoice and bank account, and enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('record_payment', {
        invoice_id_arg: paymentData.invoice_id,
        customer_id_arg: paymentData.customer_id,
        bank_account_id_arg: paymentData.bank_account_id,
        payment_date_arg: paymentData.payment_date,
        amount_arg: parseFloat(paymentData.amount)
      });

      if (error) throw error;
      
      alert('Payment recorded successfully!');
      navigate('/payments');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && invoices.length === 0) {
    return <p>Loading form data...</p>;
  }

  return (
    <div>
      <h2>Record New Payment</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="invoice">Invoice</label>
          <select id="invoice" name="invoice_id" value={paymentData.invoice_id} onChange={handleInvoiceChange} required>
            <option value="">Select an Invoice</option>
            {invoices.map(invoice => (
              <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} ({invoice.customers.name}) - ${invoice.total_amount}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bankAccount">Bank Account</label>
          <select id="bankAccount" name="bank_account_id" value={paymentData.bank_account_id} onChange={handlePaymentChange} required>
            <option value="">Select a Bank Account</option>
            {bankAccounts.map(account => (
              <option key={account.id} value={account.id}>{account.bank_name} - {account.account_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="paymentDate">Payment Date</label>
          <input type="date" id="paymentDate" name="payment_date" value={paymentData.payment_date} onChange={handlePaymentChange} required />
        </div>
        <div>
          <label htmlFor="amount">Amount</label>
          <input type="number" id="amount" name="amount" value={paymentData.amount} onChange={handlePaymentChange} step="0.01" required />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
};

export default PaymentCreate;