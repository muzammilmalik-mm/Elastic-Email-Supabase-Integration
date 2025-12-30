

interface StepIndicatorProps {
    currentStep: number
    totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
    return (
        <div className="step-indicator">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div
                    key={step}
                    className={`step-dot ${currentStep >= step ? 'active' : ''}`}
                />
            ))}
        </div>
    )
}
