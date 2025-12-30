import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const signIn = async (email: string, password: string) => {
        setLoading(true)
        setError('')
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const signUp = async (email: string, password: string) => {
        setLoading(true)
        setError('')
        try {
            const { error } = await supabase.auth.signUp({ email, password })
            if (error) throw error
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return { loading, error, signIn, signUp, signOut }
}
