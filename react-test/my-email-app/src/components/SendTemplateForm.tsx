import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export function SendTemplateForm() {
    const [to, setTo] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [status, setStatus] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');
        setTransactionId('');
        try {
            const { data, error } = await supabase.functions.invoke('send-template', { body: { to, templateName } });
            if (error) { setStatus(`Error: ${error.message}`); return; }
            let parsedData = data;
            if (typeof data === 'string') parsedData = JSON.parse(data);
            if (parsedData.success === false) {
                setStatus(`Error: ${parsedData.error}`);
                return;
            }
            setTransactionId(parsedData.transactionId);
            setStatus('success');
            setTo(''); setTemplateName('');
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        } finally { setLoading(false); }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Send Template Email</h2>
            <p className="form-description">Use a pre-designed template from your Elastic Email account</p>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="to" className="input-label">Recipient Email</label>
                    <input id="to" type="email" value={to} onChange={(e) => setTo(e.target.value)} required placeholder="recipient@example.com" className="input-field" />
                </div>
                <div className="input-group">
                    <label htmlFor="templateName" className="input-label">Template Name</label>
                    <input id="templateName" type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} required placeholder="welcome-email" className="input-field" />
                    <span className="input-hint">Enter the exact name of your template from Elastic Email. Template will use its own predefined subject.</span>
                </div>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '⏳ Sending...' : '📋 Send Template'}</button>
            </form>
            {status && (
                <div className={status.includes('Error') ? 'alert alert-error' : 'alert alert-success'}>
                    <div className="alert-title">{status.includes('Error') ? '❌ Error' : '✅ Template Sent Successfully!'}</div>
                    {status.includes('Error') ? <p className="alert-message">{status}</p> : <p className="alert-detail">Transaction ID: <span className="transaction-id">{transactionId}</span></p>}
                </div>
            )}
        </div>
    );
}
