

interface CredentialBoxProps {
    label: string
    value: string
    masked?: boolean
}

export function CredentialBox({ label, value, masked = false }: CredentialBoxProps) {
    const displayValue = masked ? `••••••••${value.slice(-8)}` : value

    return (
        <div className="credential-box">
            <strong>{label}:</strong>
            <span>{displayValue}</span>
        </div>
    )
}
