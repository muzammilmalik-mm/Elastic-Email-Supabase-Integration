import React, { useState } from 'react';
import { SendEmailForm } from './SendEmailForm';
import { SendTemplateForm } from './SendTemplateForm';
import { EmailStatusChecker } from './EmailStatusChecker';

type Tab = 'send' | 'template' | 'status';

export function Dashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('send');

    return (
        <div className="dashboard">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">📧 Elastic Email Dashboard</h1>
                    <p className="dashboard-subtitle">
                        Send emails, use templates, and track delivery status
                    </p>
                </div>

                <div className="tab-navigation">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`tab-button ${activeTab === 'send' ? 'active' : ''}`}
                    >
                        ✉️ Send Email
                    </button>
                    <button
                        onClick={() => setActiveTab('template')}
                        className={`tab-button ${activeTab === 'template' ? 'active' : ''}`}
                    >
                        📋 Send Template
                    </button>
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
                    >
                        📊 Check Status
                    </button>
                </div>

                <div className="card-container">
                    {activeTab === 'send' && <SendEmailForm />}
                    {activeTab === 'template' && <SendTemplateForm />}
                    {activeTab === 'status' && <EmailStatusChecker />}
                </div>
            </div>
        </div>
    );
}
