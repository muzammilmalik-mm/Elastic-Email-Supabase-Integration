
import { ProjectSelector } from '../ProjectSelector'

interface Project {
    id: string
    ref: string
    name: string
    region: string
    organization_id: string
    status: string
}

interface ProjectSelectionStepProps {
    projects: Project[]
    selectedProject: Project | null
    onSelect: (project: Project) => void
    onConfigure: () => void
    onBack: () => void
    loading: boolean
}

export function ProjectSelectionStep({
    projects,
    selectedProject,
    onSelect,
    onConfigure,
    onBack,
    loading
}: ProjectSelectionStepProps) {
    return (
        <div>
            <ProjectSelector
                projects={projects}
                selectedProject={selectedProject}
                onSelect={onSelect}
                loading={loading}
            />

            {selectedProject && (
                <button className="btn" onClick={onConfigure} disabled={loading}>
                    Configure SMTP
                </button>
            )}

            <button className="btn btn-secondary" onClick={onBack}>
                Back
            </button>
        </div>
    )
}
