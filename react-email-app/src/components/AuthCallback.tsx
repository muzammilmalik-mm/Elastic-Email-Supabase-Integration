
import { useOAuthCallback } from '../hooks/useOAuthCallback'
import { LoadingSpinner } from './common/LoadingSpinner'
import { Alert } from './common/Alert'
import './Auth.css'

export function AuthCallback() {
    const { loading, error, navigate } = useOAuthCallback()

    if (loading) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <LoadingSpinner />
                    <h3>Connecting to Supabase...</h3>
                    <p>Please wait while we complete the authorization</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>⚠️ Authorization Failed</h2>
                    <Alert type="error" message={error} />
                    <button
                        className="btn"
                        onClick={() => navigate('/')}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return null
}
