
import './Auth.css'

interface Project {
    id: string
    ref: string
    name: string
    region: string
    organization_id: string
    status: string
}

interface ProjectSelectorProps {
    projects: Project[]
    selectedProject: Project | null
    onSelect: (project: Project) => void
    loading?: boolean
}

export function ProjectSelector({ projects, selectedProject, onSelect, loading }: ProjectSelectorProps) {
    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Fetching your Supabase projects...</p>
            </div>
        )
    }

    if (projects.length === 0) {
        return (
            <div className="alert alert-error">
                No Supabase projects found. Please create a project first.
            </div>
        )
    }

    return (
        <div>
            <h2>Select Supabase Project</h2>
            <p>Choose which project to configure SMTP settings for:</p>

            <div className="project-list">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                        onClick={() => onSelect(project)}
                    >
                        <div className="project-card-header">
                            <input
                                type="radio"
                                checked={selectedProject?.id === project.id}
                                onChange={() => onSelect(project)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <h3>{project.name}</h3>
                        </div>
                        <div className="project-card-details">
                            <span className="project-ref">Ref: {project.ref}</span>
                            <span className="project-region">Region: {project.region}</span>
                            <span className={`project-status status-${project.status.toLowerCase()}`}>
                                {project.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
