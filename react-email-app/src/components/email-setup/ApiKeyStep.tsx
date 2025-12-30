import { useState } from 'react'
import { CredentialBox } from './CredentialBox'

interface ApiKeyStepProps {
    existingApiKey: string | null
    accountEmail: string
    onValidate: (apiKey?: string) => Promise<void>
    loading: boolean
}

export function ApiKeyStep({ existingApiKey, accountEmail, onValidate, loading }: ApiKeyStepProps) {
    const [apiKey, setApiKey] = useState('')
    const [showNewKeyForm, setShowNewKeyForm] = useState(false)

    const handleUseExisting = () => {
        onValidate(existingApiKey!)
    }

    const handleValidateNew = () => {
        onValidate(apiKey)
    }

    if (existingApiKey && !showNewKeyForm) {
        return (
            <div>
                <h2>API Key Found</h2>
                <p>You have an existing Elastic Email API key</p>

                <CredentialBox
                    label="Existing API Key"
                    value={existingApiKey}
                    masked={true}
                />

                {accountEmail && (
                    <CredentialBox
                        label="Email"
                        value={accountEmail}
                    />
                )}

                <button
                    className="btn"
                    onClick={handleUseExisting}
                    disabled={loading}
                >
                    {loading ? 'Validating...' : 'Use This API Key'}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={() => setShowNewKeyForm(true)}
                >
                    Enter Different API Key
                </button>
            </div>
        )
    }

    return (
        <div>
            <h2>Enter Elastic Email API Key</h2>
            <p>We'll use this to generate SMTP credentials</p>

            <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '20px' }}>
                <strong>Get your API key:</strong><br />
                1. Login to <a href="https://elasticemail.com/account#/settings/new/manage-api" target="_blank" rel="noreferrer" className="link">Elastic Email</a><br />
                2. Settings → Manage API<br />
                3. Create new API key<br />
                4. Paste below
            </div>

            <div className="input-group">
                <label htmlFor="apiKey">Elastic Email API Key</label>
                <input
                    id="apiKey"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    autoFocus
                />
            </div>

            <button
                className="btn"
                onClick={handleValidateNew}
                disabled={loading}
            >
                {loading ? 'Validating...' : 'Continue'}
            </button>

            {existingApiKey && showNewKeyForm && (
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowNewKeyForm(false)}
                >
                    Back to Existing Key
                </button>
            )}
        </div>
    )
}
