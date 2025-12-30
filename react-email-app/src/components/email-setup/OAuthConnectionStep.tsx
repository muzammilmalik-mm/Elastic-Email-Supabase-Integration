
import { initiateOAuthFlow } from '../../lib/oauth'

export function OAuthConnectionStep() {
    return (
        <div>
            <h2>Connect Your Supabase Account</h2>
            <p>To configure SMTP settings, we need access to your Supabase projects</p>

            <div className="alert alert-info" style={{ textAlign: 'left', margin: '20px 0' }}>
                <strong>What this does:</strong><br />
                • Fetches your Supabase projects<br />
                • Allows automatic SMTP configuration<br />
                • You'll grant permission once via OAuth
            </div>

            <button
                className="btn"
                onClick={initiateOAuthFlow}
                style={{ marginTop: '20px' }}
            >
                🔗 Connect Supabase Account
            </button>
        </div>
    )
}
