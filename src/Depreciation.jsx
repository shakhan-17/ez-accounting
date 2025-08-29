import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const Depreciation = () => {
    const { user } = useAuth();
    const [depreciationSchedules, setDepreciationSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDepreciationSchedules();
        }
    }, [user]);

    const fetchDepreciationSchedules = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('fixed_assets')
                .select(`
                    id,
                    asset_name,
                    purchase_date,
                    purchase_cost,
                    salvage_value,
                    useful_life_years
                `)
                .eq('user_id', user.id);
            if (error) throw error;
            setDepreciationSchedules(data || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateDepreciation = (asset) => {
        const depreciableCost = asset.purchase_cost - asset.salvage_value;
        const annualDepreciation = depreciableCost / asset.useful_life_years;
        const monthsPassed = (new Date() - new Date(asset.purchase_date)) / (1000 * 60 * 60 * 24 * 30.44);
        const accumulatedDepreciation = Math.min(annualDepreciation * (monthsPassed / 12), depreciableCost);
        const bookValue = asset.purchase_cost - accumulatedDepreciation;
        return { annualDepreciation, accumulatedDepreciation, bookValue };
    };

    if (loading) {
        return <p>Loading depreciation schedules...</p>;
    }

    return (
        <div>
            <h2>Depreciation Schedules</h2>
            <table>
                <thead>
                    <tr>
                        <th>Asset Name</th>
                        <th>Purchase Date</th>
                        <th>Purchase Cost</th>
                        <th>Annual Depreciation</th>
                        <th>Accumulated Depreciation</th>
                        <th>Book Value</th>
                    </tr>
                </thead>
                <tbody>
                    {depreciationSchedules.map(asset => {
                        const { annualDepreciation, accumulatedDepreciation, bookValue } = calculateDepreciation(asset);
                        return (
                            <tr key={asset.id}>
                                <td>{asset.asset_name}</td>
                                <td>{new Date(asset.purchase_date).toLocaleDateString()}</td>
                                <td>${Number(asset.purchase_cost).toFixed(2)}</td>
                                <td>${annualDepreciation.toFixed(2)}</td>
                                <td>${accumulatedDepreciation.toFixed(2)}</td>
                                <td>${bookValue.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Depreciation;