import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, FolderOpen, Calendar, Trash2, LogOut, User, Bell } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../components/auth/AuthProvider";
import { logoutUser } from "../../lib/auth";
import { projectService } from "../../lib/projectService";
import type { Project } from "../../types/api";

export function Projects() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Create project modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState("");
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");

    // Delete project modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects();
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logoutUser();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await projectService.getProjects();
            setProjects(data);
        } catch (err: any) {
            console.error("Error fetching projects:", err);
            setError(err.message || "Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectName.trim()) {
            setCreateError("Project name is required");
            return;
        }

        try {
            setCreateLoading(true);
            setCreateError("");

            const newProject = await projectService.createProject({
                name: projectName,
                description: projectDescription,
            });

            setProjects([...projects, newProject]);
            setShowCreateModal(false);
            setProjectName("");
            setProjectDescription("");
        } catch (err: any) {
            console.error("Error creating project:", err);
            setCreateError(err.response?.data?.name?.[0] || err.message || "Failed to create project");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteClick = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        setProjectToDelete(project);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;

        try {
            setDeleteLoading(true);
            await projectService.deleteProject(projectToDelete.id);
            setProjects(projects.filter(p => p.id !== projectToDelete.id));
            setShowDeleteModal(false);
            setProjectToDelete(null);
        } catch (err: any) {
            console.error("Error deleting project:", err);
            alert(err.message || "Failed to delete project");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Navbar */}
            <header className="h-16 border-b-2 border-black flex items-center justify-between px-8 bg-white z-10">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Void AI</h1>
                    <span className="text-neutral-400">|</span>
                    <span className="text-neutral-600">Projects</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* New Project Button */}
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-black text-white hover:bg-neutral-800 px-4 py-2 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>

                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setNotificationOpen(!notificationOpen)}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                        </button>

                        {notificationOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-black shadow-lg">
                                <div className="p-4 border-b-2 border-black">
                                    <h3 className="font-semibold">Notifications</h3>
                                </div>
                                <div className="p-4 text-center text-neutral-500">
                                    No new notifications
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium">{user?.displayName || user?.email || 'User'}</span>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black shadow-lg">
                                <div className="p-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 text-left transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-8 flex-1">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
                        <p className="mt-4 text-neutral-600">Loading projects...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-600">{error}</p>
                        <Button onClick={fetchProjects} className="mt-4">
                            Retry
                        </Button>
                    </div>
                ) : projects.length === 0 ? (
                    // Empty State
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-lg mb-6">
                            <FolderOpen className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-3">No projects yet</h2>
                        <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                            Create your first project to start organizing your ML experiments, datasets, and models
                        </p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-black text-white hover:bg-neutral-800 px-8 py-3"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Your First Project
                        </Button>
                    </div>
                ) : (
                    // Projects Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative group cursor-pointer isolate"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                {/* Solid Hard Shadow Effect */}
                                <div
                                    className="absolute inset-0 bg-black translate-x-2 translate-y-2 -z-10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                />

                                {/* Card Content */}
                                <div className="relative bg-white border-2 border-black p-6 h-full transition-all duration-200 group-hover:-translate-y-1 group-hover:-translate-x-1 z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
                                                <FolderOpen className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{project.name}</h3>
                                                <p className="text-sm text-neutral-500 capitalize">{project.status}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteClick(project, e)}
                                            className="p-2 hover:bg-neutral-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete project"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>

                                    <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                                        {project.description || "No description"}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-neutral-500 border-t border-neutral-200 pt-4">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                        <div>
                                            {project.datasets_count || 0} datasets • {project.models_count || 0} models
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border-2 border-black max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b-2 border-black">
                            <h2 className="text-2xl font-bold">Create New Project</h2>
                        </div>

                        <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Project Name *</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="e.g., Customer Churn Prediction"
                                    disabled={createLoading}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black resize-none"
                                    rows={4}
                                    placeholder="Describe your project..."
                                    disabled={createLoading}
                                />
                            </div>

                            {createError && (
                                <div className="p-3 bg-red-50 border border-red-600 text-red-700 text-sm">
                                    {createError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setProjectName("");
                                        setProjectDescription("");
                                        setCreateError("");
                                    }}
                                    className="flex-1 bg-white text-black border-2 border-black hover:bg-neutral-100"
                                    disabled={createLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-black text-white hover:bg-neutral-800"
                                    disabled={createLoading}
                                >
                                    {createLoading ? "Creating..." : "Create Project"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && projectToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border-2 border-black max-w-md w-full"
                    >
                        <div className="p-6 border-b-2 border-black">
                            <h2 className="text-2xl font-bold">Delete Project</h2>
                        </div>

                        <div className="p-6">
                            <p className="mb-4">
                                Are you sure you want to delete <strong>{projectToDelete.name}</strong>?
                            </p>
                            <div className="bg-red-50 border border-red-600 p-3 mb-6">
                                <p className="text-red-700 text-sm font-medium">
                                    ⚠️ This action cannot be undone. All data associated with this project will be permanently deleted.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setProjectToDelete(null);
                                    }}
                                    className="flex-1 bg-white text-black border-2 border-black hover:bg-neutral-100"
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmDelete}
                                    className="flex-1 bg-red-600 text-white hover:bg-red-700 border-2 border-red-600"
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? "Deleting..." : "Delete Project"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
