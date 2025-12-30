import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export function EmailStatusChecker() {
    const [transactionId, setTransactionId] = useState('');
    const [status, setStatus] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatus(null);
        try {
            const { data, error: err } = await supabase.functions.invoke('email-status', { body: { transactionId } });
            if (err) { setError(err.message); return; }
            let parsedData = data;
            if (typeof data === 'string') parsedData = JSON.parse(data);
            if (parsedData.success === false) {
                setError(parsedData.error);
                return;
            }
            setStatus(parsedData);
        } catch (err) {
            setError((err as Error).message);
        } finally { setLoading(false); }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Check Email Status</h2>
            <p className="form-description">Track the delivery status of your sent emails</p>
            <form onSubmit={handleCheck}>
                <div className="input-group">
                    <label htmlFor="transactionId" className="input-label">Transaction ID</label>
                    <input id="transactionId" type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required placeholder="Enter transaction ID from sent email" className="input-field" />
                    <span className="input-hint">You can find the transaction ID in the success message after sending an email</span>
                </div>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '⏳ Checking...' : '🔍 Check Status'}</button>
            </form>
            {error && <div className="alert alert-error"><div className="alert-title">❌ Error</div><p className="alert-message">{error}</p></div>}
            {status && <div className="status-result"><h3 className="status-title">📊 Email Status Details</h3><pre className="status-data">{JSON.stringify(status, null, 2)}</pre></div>}
        </div>
    );
}