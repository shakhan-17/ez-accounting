import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Setup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessName] = useState('');

    const handleSetup = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({ business_name: businessName, has_completed_setup: true })
                .eq('id', user.id);

            if (error) throw error;
            alert('Setup complete! You can now use the application.');
            navigate('/');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Initial Business Setup</h2>
            <p>Welcome! Please provide a name for your business to get started.</p>
            <form onSubmit={handleSetup}>
                <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter Business Name"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Complete Setup'}
                </button>
            </form>
        </div>
    );
};

export default Setup;