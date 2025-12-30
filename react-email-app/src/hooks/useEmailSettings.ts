import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useEmailSettings() {
    const [existingApiKey, setExistingApiKey] = useState<string | null>(null)
    const [accountEmail, setAccountEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        setError('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('user_email_settings')
                .select('elastic_email_api_key, sender_email')
                .eq('user_id', user.id)
                .maybeSingle()

            if (data?.elastic_email_api_key) {
                setExistingApiKey(data.elastic_email_api_key)
                setAccountEmail(data.sender_email || '')
            }
        } catch (err: any) {
            console.error('Error loading settings:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const updateSettings = async (updates: {
        elastic_email_api_key?: string
        sender_email?: string
        sender_name?: string
        supabase_project_ref?: string
        supabase_project_name?: string
    }) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error: dbError } = await supabase
            .from('user_email_settings')
            .upsert({
                user_id: user.id,
                ...updates,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })

        if (dbError) throw dbError
    }

    return {
        existingApiKey,
        accountEmail,
        loading,
        error,
        setAccountEmail,
        updateSettings,
        reloadSettings: loadSettings
    }
}
