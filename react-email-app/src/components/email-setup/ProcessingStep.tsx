
import { LoadingSpinner } from '../common/LoadingSpinner'

interface ProcessingStepProps {
    message?: string
}

export function ProcessingStep({ message = 'Configuring SMTP...' }: ProcessingStepProps) {
    return (
        <div>
            <LoadingSpinner />
            <h3>{message}</h3>
            <p>Generating credentials and updating your project</p>
        </div>
    )
}
