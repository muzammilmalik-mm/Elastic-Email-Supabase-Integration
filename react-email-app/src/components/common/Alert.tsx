import React from 'react'

interface AlertProps {
    type: 'success' | 'error' | 'info'
    message: string
    children?: React.ReactNode
}

export function Alert({ type, message, children }: AlertProps) {
    return (
        <div className={`alert alert-${type}`}>
            {children || message}
        </div>
    )
}
