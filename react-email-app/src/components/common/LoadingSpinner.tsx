

interface LoadingSpinnerProps {
    message?: string
    size?: 'small' | 'medium' | 'large'
}

export function LoadingSpinner({ message, size = 'medium' }: LoadingSpinnerProps) {
    return (
        <div className="loading">
            <div className={`spinner spinner-${size}`}></div>
            {message && <p>{message}</p>}
        </div>
    )
}
