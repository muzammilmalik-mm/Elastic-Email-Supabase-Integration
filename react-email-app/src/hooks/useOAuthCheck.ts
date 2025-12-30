import { useState, useEffect } from 'react'
import { hasOAuthToken } from '../lib/oauthHelpers'

export function useOAuthCheck() {
    const [hasOAuth, setHasOAuth] = useState(false)
    const [checkingOAuth, setCheckingOAuth] = useState(true)

    useEffect(() => {
        checkOAuth()
    }, [])

    const checkOAuth = async () => {
        setCheckingOAuth(true)
        try {
            const hasToken = await hasOAuthToken()
            setHasOAuth(hasToken)
        } catch (err) {
            console.error('Error checking OAuth:', err)
            setHasOAuth(false)
        } finally {
            setCheckingOAuth(false)
        }
    }

    return { hasOAuth, checkingOAuth, recheckOAuth: checkOAuth }
}
