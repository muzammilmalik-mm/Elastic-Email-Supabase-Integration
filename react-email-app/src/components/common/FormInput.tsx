import React from 'react'

interface FormInputProps {
    label: string
    id: string
    type?: 'text' | 'email' | 'password'
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    required?: boolean
    autoFocus?: boolean
    minLength?: number
}

export function FormInput({
    label,
    id,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    autoFocus = false,
    minLength
}: FormInputProps) {
    return (
        <div className="input-group">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoFocus={autoFocus}
                minLength={minLength}
            />
        </div>
    )
}
