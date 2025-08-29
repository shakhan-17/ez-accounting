import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const InvoiceDetail = () => {
    const { user } = useAuth();
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [lineItems, setLineItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && invoiceId) {
            fetchInvoiceDetails();
        }
    }, [user, invoiceId]);

    const fetchInvoiceDetails = async () => {
        try {
            setLoading(true);
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .select(`*, customers:customer_id(name)`)
                .eq('id', invoiceId)
                .single();
            if (invoiceError) throw invoiceError;
            setInvoice(invoiceData);

            const { data: lineItemsData, error: lineItemsError } = await supabase
                .from('invoice_line_items')
                .select('*')
                .eq('invoice_id', invoiceId);
            if (lineItemsError) throw lineItemsError;
            setLineItems(lineItemsData);
        } catch (error) {
            alert(error.message);
            navigate('/invoices');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading invoice details...</p>;
    }

    if (!invoice) {
        return <p>Invoice not found.</p>;
    }

    return (
        <div>
            <h2>Invoice #{invoice.invoice_number}</h2>
            <div>
                <strong>Customer:</strong> {invoice.customers.name}
            </div>
            <div>
                <strong>Issue Date:</strong> {new Date(invoice.issue_date).toLocaleDateString()}
            </div>
            <div>
                <strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}
            </div>
            <div>
                <strong>Status:</strong> {invoice.status}
            </div>

            <hr />

            <h3>Line Items</h3>
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {lineItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>${Number(item.unit_price).toFixed(2)}</td>
                            <td>${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr />

            <h3>Total: ${Number(invoice.total_amount).toFixed(2)}</h3>

            <button onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>Edit Invoice</button>
            <button onClick={() => navigate('/invoices')} style={{marginLeft: '10px'}}>Back to List</button>
        </div>
    );
};

export default InvoiceDetail;