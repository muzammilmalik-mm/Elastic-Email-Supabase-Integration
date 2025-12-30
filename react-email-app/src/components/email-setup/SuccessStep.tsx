
import { CredentialBox } from './CredentialBox'

interface Project {
    id: string
    ref: string
    name: string
    region: string
    organization_id: string
    status: string
}

interface SuccessStepProps {
    project: Project | null
    accountEmail: string
    onComplete: () => void
}

export function SuccessStep({ project, accountEmail, onComplete }: SuccessStepProps) {
    return (
        <div>
            <div className="success-icon">✅</div>
            <h2>SMTP Configured!</h2>
            <p>Your project is ready to send emails</p>

            <CredentialBox
                label="Project"
                value={project?.name || 'N/A'}
            />

            <CredentialBox
                label="Sender Email"
                value={accountEmail}
            />

            <CredentialBox
                label="SMTP Host"
                value="smtp.elasticemail.com:2525"
            />

            <div className="alert alert-success" style={{ marginTop: '20px' }}>
                ✨ SMTP credentials generated, stored securely, and Supabase project configured automatically!
            </div>

            <button className="btn" onClick={onComplete}>
                Start Sending Emails
            </button>
        </div>
    )
}
