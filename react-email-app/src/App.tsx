import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { Auth } from './components/Auth'
import { AuthCallback } from './components/AuthCallback'
import CallbackPage from './pages/CallbackPage'
import { EmailSetup } from './components/EmailSetup'
import { Dashboard } from './components/Dashboard'

function AppContent() {
    const navigate = useNavigate()
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [hasEmailSettings, setHasEmailSettings] = useState(false)
    const [checkingSettings, setCheckingSettings] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)

            if (session) {
                checkEmailSettings(session.user.id)
            } else {
                setCheckingSettings(false)
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session) {
                checkEmailSettings(session.user.id)
            } else {
                setHasEmailSettings(false)
                setCheckingSettings(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const checkEmailSettings = async (userId: string) => {
        setCheckingSettings(true)
        try {
            const { data, error } = await supabase
                .from('user_email_settings')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle()

            setHasEmailSettings(!!data && !error)
        } catch (err) {
            setHasEmailSettings(false)
        } finally {
            setCheckingSettings(false)
        }
    }

    const handleSetupComplete = () => {
        setHasEmailSettings(true)
        navigate('/dashboard')
    }

    const handleConfigureProject = () => {
        navigate('/setup')
    }

    if (loading || checkingSettings) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '20px'
            }}>
                Loading...
            </div>
        )
    }

    return (
        <Routes>
            {/* OAuth callback routes */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/oauth2/callback" element={<CallbackPage />} /> {/* Elastic Email OAuth callback */}

            {/* Main app routes */}
            <Route path="/" element={
                !session ? (
                    <Auth onAuthSuccess={() => { }} />
                ) : !hasEmailSettings ? (
                    <Navigate to="/setup" replace />
                ) : (
                    <Navigate to="/dashboard" replace />
                )
            } />

            <Route path="/setup" element={
                session ? (
                    <EmailSetup onSetupComplete={handleSetupComplete} />
                ) : (
                    <Navigate to="/" replace />
                )
            } />

            <Route path="/dashboard" element={
                session ? (
                    <Dashboard onConfigureProject={handleConfigureProject} />
                ) : (
                    <Navigate to="/" replace />
                )
            } />
        </Routes>
    )
}

function App() {
    return (
        <BrowserRouter basename="/supabase">
            <AppContent />
        </BrowserRouter>
    )
}

export default App
