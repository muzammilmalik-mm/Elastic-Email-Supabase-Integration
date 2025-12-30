import { useState } from 'react'
import { getValidOAuthToken } from '../lib/oauthHelpers'

interface Project {
    id: string
    ref: string
    name: string
    region: string
    organization_id: string
    status: string
}

export function useProjectFetch() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchProjects = async () => {
        setLoading(true)
        setError('')

        try {
            const oauthToken = await getValidOAuthToken()

            if (!oauthToken) {
                throw new Error('No Supabase authorization. Please connect your Supabase account.')
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-projects`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userToken: oauthToken })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch Supabase projects')
            }

            const projectsData = await response.json()
            setProjects(projectsData)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return { projects, loading, error, fetchProjects }
}
