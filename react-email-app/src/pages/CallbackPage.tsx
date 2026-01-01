import { useEffect, useState, useRef } from 'react';
import { getAuthorizationCode } from '../lib/supabaseOAuth';
import '../components/Auth.css';

interface Project {
    id: string;
    ref: string;
    name: string;
    organization_id: string;
    region: string;
}

interface Domain {
    Domain: string;
    DefaultDomain: boolean;
    Spf: boolean;
    Dkim: boolean;
    MX: boolean;
    DMARC: boolean;
    IsRewriteDomainValid: boolean;
    Verify: boolean;
    Type: string;
    TrackingStatus: string;
    CertificateStatus: string;
    CertificateValidationError: string | null;
    TrackingTypeUserRequest: string | null;
    VERP: boolean;
    CustomBouncesDomain: string | null;
    IsCustomBouncesDomainDefault: boolean;
    IsMarkedForDeletion: boolean;
    Ownership: string;
}

function extractEmailFromDomain(domainString: string): string {
    // Extract email from "domain.com (email@domain.com)" format
    const match = domainString.match(/\(([^)]+)\)/);
    return match ? match[1] : domainString;
}

export default function CallbackPage() {
    // Get base path from environment (e.g., '/supabase' or '')
    const basePath = import.meta.env.VITE_APP_BASE_PATH || '/supabase';

    const [status, setStatus] = useState<'loading' | 'select_project' | 'enter_api_key' | 'configuring' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Connecting to Supabase...');
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [username, setUsername] = useState('');
    const [domains, setDomains] = useState<Domain[]>([]);
    const [emailOption, setEmailOption] = useState<'dropdown' | 'custom'>('dropdown');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [emailPrefix, setEmailPrefix] = useState('');
    const [customDomainSelection, setCustomDomainSelection] = useState('');
    const [oauthToken, setOauthToken] = useState(''); // Supabase OAuth token
    const [elasticEmailAccessToken, setElasticEmailAccessToken] = useState(''); // Elastic Email OAuth token
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        handleCallback();
    }, []);

    // Load OAuth token from sessionStorage once when component mounts
    useEffect(() => {
        const storedToken = sessionStorage.getItem('elastic_email_access_token');
        if (storedToken) {
            setElasticEmailAccessToken(storedToken);
        }
    }, []);

    // Fetch domains when OAuth token becomes available
    useEffect(() => {
        if (elasticEmailAccessToken && domains.length === 0) {
            console.log('📧 Fetching domains with OAuth token');
            fetchDomainsWithToken(elasticEmailAccessToken);
        }
    }, [elasticEmailAccessToken]);

    // Auto-select dropdown when domains are fetched, or switch to custom if no domains
    useEffect(() => {
        if (domains.length > 0 && emailOption === 'custom') {
            // Domains are available, switch to dropdown
            setEmailOption('dropdown');
        } else if (domains.length === 0 && emailOption === 'dropdown' && elasticEmailAccessToken) {
            // No domains available after token is set, switch to custom
            setEmailOption('custom');
        }
    }, [domains, elasticEmailAccessToken]);

    async function handleCallback() {
        try {
            // Check if this is an Elastic Email OAuth callback or Supabase OAuth callback
            const urlParams = new URLSearchParams(window.location.search);
            const currentPath = window.location.pathname;

            // Detect Elastic Email OAuth by path or sessionStorage flag
            const isElasticEmailOAuth =
                currentPath.includes('/oauth2/callback') ||
                sessionStorage.getItem('elastic_email_oauth_flow');

            if (isElasticEmailOAuth) {
                console.log('🔵 Detected Elastic Email OAuth flow');
                await handleElasticEmailOAuth(urlParams);
                return;
            }

            // Otherwise, handle Supabase OAuth
            console.log('🟢 Detected Supabase OAuth flow');
            const code = getAuthorizationCode();
            if (!code) {
                setStatus('error');
                setMessage('No authorization code found');
                return;
            }

            setMessage('Exchanging authorization code...');

            const response = await fetch(
                'https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/supabase-oauth-exchange',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to exchange authorization code');
            }

            const data = await response.json();
            console.log('✅ OAuth tokens received');

            setOauthToken(data.access_token);
            setProjects(data.projects || []);
            setStatus('select_project');
            setMessage('Select your Supabase project');

            // Clean the URL by removing query parameters after successful exchange
            window.history.replaceState({}, document.title, window.location.pathname);

        } catch (error) {
            console.error('OAuth error:', error);
            setStatus('error');
            setMessage((error as Error).message);
        }
    }

    async function handleElasticEmailOAuth(urlParams: URLSearchParams) {
        try {
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            if (!code) {
                throw new Error('No authorization code received from Elastic Email');
            }

            // Verify state to prevent CSRF (only if we saved a state)
            const savedState = sessionStorage.getItem('elastic_email_oauth_state');
            if (savedState && state !== savedState) {
                throw new Error('State mismatch - possible CSRF attack');
            }

            setMessage('Exchanging Elastic Email authorization code...');

            // Call your Edge Function to securely exchange the code
            const response = await fetch(
                'https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/elastic-email-oauth-token',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: code,
                        redirect_uri: window.location.origin + basePath + '/oauth2/callback'
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to exchange Elastic Email code');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Elastic Email OAuth failed');
            }

            // Store the Elastic Email OAuth token
            setElasticEmailAccessToken(data.access_token);
            sessionStorage.setItem('elastic_email_access_token', data.access_token);
            if (data.refresh_token) {
                sessionStorage.setItem('elastic_email_refresh_token', data.refresh_token);
            }

            // Clean up
            sessionStorage.removeItem('elastic_email_oauth_state');
            sessionStorage.removeItem('elastic_email_oauth_flow');

            console.log('✅ Elastic Email OAuth successful');

            // Redirect to home page for Supabase login
            window.location.href = basePath + '/';


        } catch (error) {
            console.error('Elastic Email OAuth error:', error);
            setStatus('error');
            setMessage((error as Error).message);
        }
    }

    async function fetchDomainsWithToken(token: string) {
        try {
            const response = await fetch(
                'https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/fetch-domains',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({
                        oauth_token: token
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch domains');
            }

            const data = await response.json();
            setDomains(data.domains || []);

            // Select first domain's email by default if available
            if (data.domains && data.domains.length > 0) {
                const firstEmail = extractEmailFromDomain(data.domains[0].Domain);
                setSelectedDomain(firstEmail);
            }

            console.log('✅ Domains loaded:', data.domains?.length || 0);

        } catch (error) {
            console.error('Error fetching domains:', error);
            setMessage((error as Error).message);
        }
    }

    async function handleProjectSelect(project: Project) {
        setSelectedProject(project);
        setStatus('enter_api_key');
        setMessage(`Configure SMTP for ${project.name}`);
    }


    async function handleConfigureSMTP() {
        // Determine sender_email based on user choice
        let senderEmail: string;

        if (emailOption === 'dropdown') {
            // Use the selected email directly from dropdown
            senderEmail = selectedDomain;
        } else {
            // Build custom email from prefix @ selected domain
            senderEmail = `${emailPrefix}@${customDomainSelection}`;
        }

        if (!elasticEmailAccessToken || !selectedProject || !username || !senderEmail) return;

        try {
            setStatus('configuring');
            setMessage('Generating SMTP credentials...');

            // Generate SMTP credentials with username and sender email using OAuth token
            const smtpResponse = await fetch(
                'https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/generate-smtp-credentials',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({
                        oauth_token: elasticEmailAccessToken,
                        username: username,
                        sender_email: senderEmail
                    })
                }
            );

            if (!smtpResponse.ok) {
                const errorData = await smtpResponse.json();
                throw new Error(errorData.error || errorData.message || 'Failed to generate SMTP credentials');
            }

            const smtpCreds = await smtpResponse.json();
            console.log('✅ SMTP credentials generated:', smtpCreds.smtp_user);

            // Configure Supabase with OAuth token
            setMessage('Configuring Supabase project...');

            const configResponse = await fetch(
                'https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/configure-supabase-smtp',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        oauth_access_token: oauthToken,
                        project_ref: selectedProject?.ref,
                        smtp_config: {
                            smtp_admin_email: smtpCreds.sender_email,
                            smtp_host: "smtp.elasticemail.com",
                            smtp_port: smtpCreds.smtp_port,
                            smtp_user: smtpCreds.smtp_user,
                            smtp_pass: smtpCreds.smtp_pass,
                            smtp_sender_name: 'Elastic Email',
                            smtp_max_frequency: 60
                        }
                    })
                }
            );

            if (!configResponse.ok) {
                const errorData = await configResponse.json();
                throw new Error(errorData.error || errorData.message || 'Failed to configure Supabase SMTP');
            }

            console.log('✅ Supabase SMTP configured successfully!');

            setStatus('success');
            setMessage('✅ SMTP configured successfully!');

        } catch (error) {
            console.error('Configuration error:', error);

            // Parse error message for user-friendly display
            const errorMessage = (error as Error).message;
            console.log('Full error message:', errorMessage);

            // Convert to lowercase for easier matching
            const errorLower = errorMessage.toLowerCase();

            if (errorLower.includes('operation failed')) {
                setStatus('error');
                setMessage('SMTP is already configured for this Elastic Email account!');
            }
            // Check if it's a "username already taken" error OR "already taken" error
            // This covers both direct errors and nested JSON errors
            else if ((errorLower.includes('username') && errorLower.includes('already taken')) ||
                errorLower.includes('already taken')) {
                // Show as error, not success
                setStatus('error');
                setMessage('SMTP credentials already exist. Username is already taken.');
            }
            // Check if it's any "failed to generate smtp" error
            else if (errorLower.includes('failed to generate smtp') ||
                errorLower.includes('failed to generate')) {
                setStatus('error');
                setMessage('This Elastic Email account is already configured.');
            }
            else if (errorLower.includes("smtp token's name must be a valid email address")) {
                setStatus('error');
                setMessage("SMTP token's name must be a valid email address");
            }
            // Generic error - contact support
            else {
                setStatus('error');
                setMessage(`Configuration error: ${errorMessage}`);
            }
        }
    }

    if (status === 'error') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div style={{ fontSize: '64px', textAlign: 'center', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ textAlign: 'center' }}>Error</h2>
                    <div className="alert alert-error">{message}</div>
                    <button onClick={() => window.location.href = '/'} className="btn">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="success-icon">✅</div>
                    <h2 style={{ textAlign: 'center' }}>SMTP Configured!</h2>
                    <p style={{ textAlign: 'center', color: '#666' }}>
                        Your Supabase project "{selectedProject?.name}" is now configured with Elastic Email SMTP.
                    </p>
                    <button onClick={() => window.location.href = '/'} className="btn" style={{ marginTop: '20px' }}>
                        Done
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'loading' || status === 'configuring') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="loading">
                        <div className="spinner"></div>
                        <h3>{message}</h3>
                        <p style={{ color: '#666' }}>Please wait...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'select_project') {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ maxWidth: '700px' }}>
                    <div className="logo">
                        <h1>Select Your Project</h1>
                        <p>Choose which project to configure with Elastic Email SMTP</p>
                    </div>

                    <div className="project-list">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="project-card"
                                onClick={() => handleProjectSelect(project)}
                            >
                                <div className="project-card-header">
                                    <h3>{project.name}</h3>
                                </div>
                                <div className="project-card-details">
                                    <span className="project-ref">Ref: {project.ref}</span>
                                    <span className="project-region">Region: {project.region}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'enter_api_key') {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ maxWidth: '600px' }}>
                    <div className="logo">
                        <h1>Configure SMTP</h1>
                        <p>Set up Elastic Email for {selectedProject?.name}</p>
                    </div>


                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g., noreply, support, hello"
                        />
                    </div>

                    <div className="input-group">
                        <label>Email Option</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="emailOption"
                                    value="dropdown"
                                    checked={emailOption === 'dropdown'}
                                    onChange={() => setEmailOption('dropdown')}
                                    style={{ marginRight: '5px' }}
                                />
                                Use domain from dropdown
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="emailOption"
                                    value="custom"
                                    checked={emailOption === 'custom'}
                                    onChange={() => setEmailOption('custom')}
                                    style={{ marginRight: '5px' }}
                                />
                                Custom email
                            </label>
                        </div>

                        {emailOption === 'dropdown' ? (
                            <>
                                {domains.length > 0 ? (
                                    <select
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {domains.map((domain) => {
                                            const emailAddress = extractEmailFromDomain(domain.Domain);
                                            return (
                                                <option key={domain.Domain} value={emailAddress}>
                                                    {emailAddress}
                                                    {domain.DefaultDomain && ' (Default)'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                ) : (
                                    <p style={{ color: '#666', fontSize: '14px', margin: '10px 0' }}>
                                        {elasticEmailAccessToken
                                            ? 'No domains found. Please add a domain in Elastic Email or use custom email.'
                                            : 'Complete OAuth to load domains'}
                                    </p>
                                )}
                                {selectedDomain && username && (
                                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                                        Sender will be: <code>{selectedDomain}</code>
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input
                                        type="text"
                                        value={emailPrefix}
                                        onChange={(e) => setEmailPrefix(e.target.value)}
                                        placeholder="prefix (e.g., support, noreply)"
                                        style={{
                                            flex: '0 0 200px',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>@</span>
                                    <input
                                        type="text"
                                        value={customDomainSelection}
                                        onChange={(e) => setCustomDomainSelection(e.target.value)}
                                        placeholder="domain.com (e.g., gmail.com, example.com)"
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                {emailPrefix && customDomainSelection && (
                                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                                        Sender will be: <code>{emailPrefix}@{customDomainSelection}</code>
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '20px' }}>
                        <strong>Get your API key:</strong><br />
                        1. Login to <a href="https://elasticemail.com/account#/settings/new/manage-api" target="_blank" rel="noreferrer" className="link">Elastic Email</a><br />
                        2. Settings → Manage API<br />
                        3. Create new API key<br />
                        4. Paste above
                    </div>

                    {!elasticEmailAccessToken && (
                        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                            ⚠️ Please complete Elastic Email OAuth first to get access token
                        </div>
                    )}

                    <button
                        onClick={handleConfigureSMTP}
                        disabled={
                            !elasticEmailAccessToken ||
                            !username ||
                            (emailOption === 'dropdown' ? !selectedDomain : (!emailPrefix || !customDomainSelection))
                        }
                        className="btn"
                    >
                        Configure SMTP
                    </button>

                    <button
                        onClick={() => setStatus('select_project')}
                        className="btn btn-secondary"
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
