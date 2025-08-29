import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const FixedAssetEdit = () => {
    const { user } = useAuth();
    const { assetId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [accounts, setAccounts] = useState([]);
    
    // Form state
    const [assetName, setAssetName] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [purchaseCost, setPurchaseCost] = useState('');
    const [salvageValue, setSalvageValue] = useState(0);
    const [usefulLife, setUsefulLife] = useState('');
    const [assetAccountId, setAssetAccountId] = useState('');
    const [accDepAccountId, setAccDepAccountId] = useState('');
    const [depExpAccountId, setDepExpAccountId] = useState('');

    useEffect(() => {
        if (!user) return;

        const fetchAccounts = async () => {
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('id, name, type, code')
                .eq('user_id', user.id)
                .order('code');
            if (error) throw error;
            setAccounts(data || []);
        };

        const fetchAsset = async () => {
            const { data, error } = await supabase
                .from('fixed_assets')
                .select('*')
                .eq('id', assetId)
                .single();
            if (error) throw error;

            if (data) {
                setAssetName(data.asset_name);
                setPurchaseDate(data.purchase_date);
                setPurchaseCost(data.purchase_cost);
                setSalvageValue(data.salvage_value);
                setUsefulLife(data.useful_life_years);
                setAssetAccountId(data.asset_account_id);
                setAccDepAccountId(data.accumulated_depreciation_account_id);
                setDepExpAccountId(data.depreciation_expense_account_id);
            }
        };

        const loadData = async () => {
            setLoading(true);
            try {
                await fetchAccounts();
                await fetchAsset();
            } catch (error) {
                alert(error.message);
                navigate('/fixed-assets');
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [assetId, user, navigate]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('fixed_assets')
                .update({
                    asset_name: assetName,
                    purchase_date: purchaseDate,
                    purchase_cost: purchaseCost,
                    salvage_value: salvageValue,
                    useful_life_years: usefulLife,
                    asset_account_id: assetAccountId,
                    accumulated_depreciation_account_id: accDepAccountId,
                    depreciation_expense_account_id: depExpAccountId,
                })
                .eq('id', assetId);
            
            if (error) throw error;
            alert('Asset updated successfully!');
            navigate('/fixed-assets');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const assetTypeAccounts = accounts.filter(a => a.type === 'Asset');
    const expenseTypeAccounts = accounts.filter(a => a.type === 'Expense');

    if (loading) {
        return <p>Loading asset details...</p>;
    }

    return (
        <div>
            <h2>Edit Fixed Asset</h2>
            <form onSubmit={handleUpdate}>
                <input type="text" placeholder="Asset Name" value={assetName} onChange={e => setAssetName(e.target.value)} required />
                <input type="number" placeholder="Purchase Cost" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} required />
                <input type="number" placeholder="Salvage Value" value={salvageValue} onChange={e => setSalvageValue(e.target.value)} required />
                <input type="number" placeholder="Useful Life (Years)" value={usefulLife} onChange={e => setUsefulLife(e.target.value)} required />
                <input type="date" placeholder="Purchase Date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />

                <select value={assetAccountId} onChange={e => setAssetAccountId(e.target.value)} required>
                    <option value="">Select Asset Account</option>
                    {assetTypeAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                </select>
                <select value={accDepAccountId} onChange={e => setAccDepAccountId(e.target.value)} required>
                    <option value="">Select Accumulated Depreciation Account</option>
                    {assetTypeAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                </select>
                <select value={depExpAccountId} onChange={e => setDepExpAccountId(e.target.value)} required>
                    <option value="">Select Depreciation Expense Account</option>
                    {expenseTypeAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                </select>
                
                <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => navigate('/fixed-assets')}>Cancel</button>
            </form>
        </div>
    );
};

export default FixedAssetEdit;