import React, { useState } from 'react'
import { useOAuthCheck } from '../hooks/useOAuthCheck'
import { useEmailSettings } from '../hooks/useEmailSettings'
import { useProjectFetch } from '../hooks/useProjectFetch'
import { getValidOAuthToken } from '../lib/oauthHelpers'
import { LoadingSpinner } from './common/LoadingSpinner'
import { Alert } from './common/Alert'
import { StepIndicator } from './email-setup/StepIndicator'
import { OAuthConnectionStep } from './email-setup/OAuthConnectionStep'
import { ApiKeyStep } from './email-setup/ApiKeyStep'
import { ProjectSelectionStep } from './email-setup/ProjectSelectionStep'
import { ProcessingStep } from './email-setup/ProcessingStep'
import { SuccessStep } from './email-setup/SuccessStep'
import './Auth.css'

interface EmailSetupProps {
    onSetupComplete: () => void
}

interface Project {
    id: string
    ref: string
    name: string
    region: string
    organization_id: string
    status: string
}

export function EmailSetup({ onSetupComplete }: EmailSetupProps) {
    const [step, setStep] = useState(0) // 0 = OAuth check, 1 = API key, 2 = Projects, 3 = Processing, 4 = Success
    const [apiKey, setApiKey] = useState('')
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Custom hooks
    const { hasOAuth, checkingOAuth } = useOAuthCheck()
    const { existingApiKey, accountEmail, setAccountEmail, updateSettings } = useEmailSettings()
    const { projects, loading: loadingProjects, fetchProjects } = useProjectFetch()

    // Set initial step based on OAuth status
    React.useEffect(() => {
        if (!checkingOAuth) {
            setStep(hasOAuth ? 1 : 0)
        }
    }, [hasOAuth, checkingOAuth])

    const validateApiKey = async (keyToValidate?: string) => {
        const keyToUse = keyToValidate || apiKey

        if (!keyToUse.trim()) {
            setError('Please enter your Elastic Email API key')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('https://api.smtprelay.co/v3/account', {
                headers: { 'X-ElasticEmail-ApiKey': keyToUse }
            })

            if (!response.ok) {
                throw new Error('Invalid API key or unable to access Elastic Email account')
            }

            const accountInfo = await response.json()
            const email = accountInfo.Profile?.Email || accountInfo.IC?.Email

            if (!email) {
                throw new Error('Could not retrieve email from Elastic Email account')
            }

            setAccountEmail(email)
            setApiKey(keyToUse)
            setStep(2)
            fetchProjects()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const configureSMTP = async () => {
        if (!selectedProject) {
            setError('Please select a project')
            return
        }

        setLoading(true)
        setError('')
        setStep(3)

        try {
            // Step 1: Generate SMTP credentials from Elastic Email
            console.log('📧 Step 1: Generating SMTP credentials from Elastic Email...')
            const smtpResponse = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-smtp-credentials`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ elastic_email_api_key: apiKey })
                }
            )

            if (!smtpResponse.ok) {
                const errorData = await smtpResponse.json()
                throw new Error(errorData.error || errorData.message || 'Failed to generate SMTP credentials')
            }

            const smtpCreds = await smtpResponse.json()
            console.log('✅ SMTP credentials generated:', smtpCreds.smtp_user)

            // Step 2: Get Supabase Management API OAuth token
            const oauthToken = await getValidOAuthToken()

            if (!oauthToken) {
                throw new Error('No Supabase authorization. Please connect your Supabase account.')
            }

            console.log('🔧 Step 2: Configuring Supabase project with SMTP...')

            // Step 3: Configure Supabase project with the SMTP credentials
            const configResponse = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/configure-supabase-smtp`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        oauth_access_token: oauthToken,
                        project_ref: selectedProject.ref,
                        smtp_config: {
                            smtp_admin_email: smtpCreds.account_email,
                            smtp_host: smtpCreds.smtp_host,
                            smtp_port: smtpCreds.smtp_port,
                            smtp_user: smtpCreds.smtp_user,
                            smtp_pass: smtpCreds.smtp_pass,
                            smtp_sender_name: accountEmail.split('@')[0],
                            smtp_max_frequency: 60
                        }
                    })
                }
            )

            if (!configResponse.ok) {
                const errorData = await configResponse.json()
                throw new Error(errorData.error || errorData.message || 'Failed to configure Supabase SMTP')
            }

            console.log('✅ Supabase SMTP configured successfully!')

            // Step 4: Save to database
            await updateSettings({
                elastic_email_api_key: apiKey,
                sender_email: accountEmail,
                sender_name: accountEmail.split('@')[0],
                supabase_project_ref: selectedProject.ref,
                supabase_project_name: selectedProject.name
            })

            setStep(4)
        } catch (err: any) {
            console.error('SMTP configuration error:', err)
            setError(err.message)
            setStep(2)
        } finally {
            setLoading(false)
        }
    }

    if (checkingOAuth) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <LoadingSpinner message="Loading..." />
                </div>
            </div>
        )
    }

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: step === 2 ? '600px' : '450px' }}>
                <div className="logo">
                    <h1>📧 SMTP Configuration</h1>
                    <p>Connect Elastic Email to your Supabase project</p>
                </div>

                <StepIndicator currentStep={step} totalSteps={4} />

                {error && <Alert type="error" message={error} />}

                {step === 0 && <OAuthConnectionStep />}

                {step === 1 && (
                    <ApiKeyStep
                        existingApiKey={existingApiKey}
                        accountEmail={accountEmail}
                        onValidate={validateApiKey}
                        loading={loading}
                    />
                )}

                {step === 2 && (
                    <ProjectSelectionStep
                        projects={projects}
                        selectedProject={selectedProject}
                        onSelect={setSelectedProject}
                        onConfigure={configureSMTP}
                        onBack={() => setStep(1)}
                        loading={loadingProjects || loading}
                    />
                )}

                {step === 3 && <ProcessingStep />}

                {step === 4 && (
                    <SuccessStep
                        project={selectedProject}
                        accountEmail={accountEmail}
                        onComplete={onSetupComplete}
                    />
                )}
            </div>
        </div>
    )
}
