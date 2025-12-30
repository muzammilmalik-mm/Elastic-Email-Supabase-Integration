import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export function SendEmailForm() {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [html, setHtml] = useState('');
    const [status, setStatus] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');
        setTransactionId('');
        try {
            const { data, error } = await supabase.functions.invoke('send-email', { body: { to, subject, html } });
            if (error) { setStatus(`Error: ${error.message}`); return; }
            let parsedData = data;
            if (typeof data === 'string') parsedData = JSON.parse(data);
            if (parsedData.success === false) {
                setStatus(`Error: ${parsedData.error}`);
                return;
            }
            setTransactionId(parsedData.transactionId);
            setStatus('success');
            setTo(''); setSubject(''); setHtml('');
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        } finally { setLoading(false); }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Send Custom Email</h2>
            <p className="form-description">Send a custom HTML email to any recipient</p>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="to" className="input-label">Recipient Email</label>
                    <input id="to" type="email" value={to} onChange={(e) => setTo(e.target.value)} required placeholder="recipient@example.com" className="input-field" />
                </div>
                <div className="input-group">
                    <label htmlFor="subject" className="input-label">Subject</label>
                    <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Enter your email subject" className="input-field" />
                </div>
                <div className="input-group">
                    <label htmlFor="html" className="input-label">HTML Message</label>
                    <textarea id="html" value={html} onChange={(e) => setHtml(e.target.value)} required placeholder="<h1>Hello!</h1><p>Your message here...</p>" className="textarea-field" />
                    <span className="input-hint">Enter your email content in HTML format</span>
                </div>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '⏳ Sending...' : '📤 Send Email'}</button>
            </form>
            {status && (
                <div className={status.includes('Error') ? 'alert alert-error' : 'alert alert-success'}>
                    <div className="alert-title">{status.includes('Error') ? '❌ Error' : '✅ Email Sent Successfully!'}</div>
                    {status.includes('Error') ? <p className="alert-message">{status}</p> : <p className="alert-detail">Transaction ID: <span className="transaction-id">{transactionId}</span></p>}
                </div>
            )}
        </div>
    );
}