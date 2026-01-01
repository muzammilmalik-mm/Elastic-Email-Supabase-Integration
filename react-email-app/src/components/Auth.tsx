import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { FormInput } from './common/FormInput'
import { Alert } from './common/Alert'
import { SupabaseLogo } from './common/SupabaseLogo'
import './Auth.css'

interface AuthProps {
    onAuthSuccess: () => void
}

export function Auth({ onAuthSuccess }: AuthProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { loading, error, signIn } = useAuth()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        try {
            await signIn(email, password)
            onAuthSuccess()
        } catch (err) {
            // Error already handled in useAuth hook
        }
    }

    const handleSupabaseOAuth = () => {
        const params = new URLSearchParams({
            client_id: '493357a3-0356-449d-a187-bcb6019741c1',
            response_type: 'code',
            scope: 'all',
            redirect_uri: `${window.location.origin}/supabase/callback`
        })

        window.location.href = `https://api.supabase.com/v1/oauth/authorize?${params.toString()}`
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="logo">
                    <h1>📧 Elastic Email</h1>
                    <p>Send emails with Supabase</p>
                </div>

                {error && <Alert type="error" message={error} />}

                <button
                    className="supabase-oauth-button"
                    onClick={handleSupabaseOAuth}
                    disabled={loading}
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '0',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        transition: 'transform 0.2s ease, opacity 0.2s ease',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.opacity = '1';
                    }}
                >
                    <img
                        src="/connect-supabase-dark.svg"
                        alt="Connect to Supabase"
                        style={{ width: '80%', height: 'auto', display: 'block' }}
                    />
                </button>

                <div style={{ textAlign: 'center', margin: '20px 0', color: '#999', fontSize: '14px' }}>
                    OR
                </div>

                <form onSubmit={handleSubmit}>
                    <FormInput
                        label="Email"
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                    />

                    <FormInput
                        label="Password"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Loading...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    )
}
