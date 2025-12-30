import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useEmailSender } from '../hooks/useEmailSender'
import { LoadingSpinner } from './common/LoadingSpinner'
import { Alert } from './common/Alert'
import { FormInput } from './common/FormInput'
import './Auth.css'

interface DashboardProps {
    onConfigureProject?: () => void
}

export function Dashboard({ onConfigureProject }: DashboardProps) {
    const [to, setTo] = useState('')
    const [subject, setSubject] = useState('')
    const [html, setHtml] = useState('')
    const [userSettings, setUserSettings] = useState<any>(null)
    const [loadingSettings, setLoadingSettings] = useState(true)
    const [settingsError, setSettingsError] = useState('')

    const { loading, success, error, sendEmail } = useEmailSender(userSettings?.elastic_email_api_key || '')

    useEffect(() => {
        loadUserSettings()
    }, [])

    const loadUserSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Not authenticated')
            }

            const { data, error } = await supabase
                .from('user_email_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()

            if (error) {
                console.error('Error loading settings:', error)
                throw error
            }

            setUserSettings(data)
        } catch (err: any) {
            console.error('Failed to load settings:', err)
            setSettingsError('Failed to load your email settings')
        } finally {
            setLoadingSettings(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    const handleSendEmail = async (e: FormEvent) => {
        e.preventDefault()

        try {
            await sendEmail(to, subject, html)
            setTo('')
            setSubject('')
            setHtml('')
        } catch (err) {
            // Error already handled in useEmailSender hook
        }
    }

    if (loadingSettings) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <LoadingSpinner message="Loading your settings..." />
                </div>
            </div>
        )
    }

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '600px' }}>
                <div className="logo">
                    <h1>📧 Send Email</h1>
                    <p>Sending from: <strong>{userSettings?.sender_email || 'Not configured'}</strong></p>
                    <button
                        onClick={handleLogout}
                        style={{
                            marginTop: '10px',
                            background: 'transparent',
                            border: '1px solid #667eea',
                            color: '#667eea',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginRight: '10px'
                        }}
                    >
                        Logout
                    </button>
                    {onConfigureProject && (
                        <button
                            onClick={onConfigureProject}
                            style={{
                                marginTop: '10px',
                                background: '#667eea',
                                border: 'none',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            + Configure Project
                        </button>
                    )}
                </div>

                {success && <Alert type="success" message={success} />}
                {error && <Alert type="error" message={error} />}
                {settingsError && <Alert type="error" message={settingsError} />}

                <form onSubmit={handleSendEmail}>
                    <FormInput
                        label="Recipient Email"
                        id="to"
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="recipient@example.com"
                        required
                    />

                    <FormInput
                        label="Subject"
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Email subject"
                        required
                    />

                    <div className="input-group">
                        <label htmlFor="html">Email Content (HTML)</label>
                        <textarea
                            id="html"
                            value={html}
                            onChange={(e) => setHtml(e.target.value)}
                            placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
                            rows={8}
                            required
                        />
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Email'}
                    </button>
                </form>
            </div>
        </div>
    )
}
