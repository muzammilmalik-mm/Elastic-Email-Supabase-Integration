import { useState } from 'react'

export function useEmailSender(apiKey: string) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const sendEmail = async (to: string, subject: string, html: string) => {
        setLoading(true)
        setSuccess('')
        setError('')

        try {
            if (!apiKey) {
                throw new Error('Elastic Email API key not configured')
            }

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-ElasticEmail-ApiKey': apiKey
                },
                body: JSON.stringify({ to, subject, html })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send email')
            }

            setSuccess(`✅ Email sent! Transaction ID: ${result.transactionId}`)
            return result
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    return { loading, success, error, sendEmail, clearMessages: () => { setSuccess(''); setError('') } }
}
