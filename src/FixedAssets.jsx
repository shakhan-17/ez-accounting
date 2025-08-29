import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const FixedAssets = () => {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAssets();
        }
    }, [user]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('fixed_assets')
                .select(`*, asset_account:asset_account_id(code, name)`)
                .eq('user_id', user.id)
                .order('purchase_date', { ascending: false });
            if (error) throw error;
            setAssets(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading fixed assets...</p>;
    }

    return (
        <div>
            <h2>Fixed Assets</h2>
            <Link to="/fixed-assets/new">Add New Asset</Link>
            <table>
                <thead>
                    <tr>
                        <th>Asset Name</th>
                        <th>Purchase Date</th>
                        <th>Purchase Cost</th>
                        <th>Useful Life (Years)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map(asset => (
                        <tr key={asset.id}>
                            <td>{asset.asset_name}</td>
                            <td>{new Date(asset.purchase_date).toLocaleDateString()}</td>
                            <td>${Number(asset.purchase_cost).toFixed(2)}</td>
                            <td>{asset.useful_life_years}</td>
                            <td>
                                <Link to={`/fixed-assets/edit/${asset.id}`}>Edit</Link>
                                {/* Implement delete functionality if needed */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FixedAssets;