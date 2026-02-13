
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { LogOut, User, Sparkles, BarChart3, Settings, Bell, FolderOpen, Database, Play, Rocket, BookOpen, ChevronLeft, ChevronRight, Plus, LayoutGrid } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../components/auth/AuthProvider";
import { logoutUser } from "../../lib/auth";
import { projectService } from "../../lib/projectService";
import type { Project, Dataset, MLModel } from "../../types/api";
import { PromptBuilder } from "../components/PromptBuilder";
import { DatasetUploadModal } from "../components/DatasetUploadModal";
import Models from "./Models";

export function Dashboard() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("datasets");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Current project state
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projectLoading, setProjectLoading] = useState(true);
    const [projectError, setProjectError] = useState("");

    // Data states
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [models, setModels] = useState<MLModel[]>([]);
    const [activeModelId, setActiveModelId] = useState<number | undefined>(undefined);

    // Navigation items for project dashboard
    const navItems = [
        { id: "datasets", label: "Datasets", icon: Database },
        { id: "models", label: "Models", icon: Sparkles },
        { id: "model-builder", label: "Model Builder", icon: Sparkles },
        { id: "training", label: "Training", icon: Play },
        { id: "deployments", label: "Deployments", icon: Rocket },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "documentation", label: "Documentation", icon: BookOpen },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationOpen(false);
            }
        };

        if (dropdownOpen || notificationOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownOpen, notificationOpen]);

    // Fetch initial data
    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) {
                navigate('/projects');
                return;
            }

            try {
                setProjectLoading(true);
                setProjectError("");
                const project = await projectService.getProject(Number(projectId));
                setCurrentProject(project);
            } catch (err: any) {
                console.error("Error fetching project:", err);
                setProjectError(err.message || "Failed to load project");
            } finally {
                setProjectLoading(false);
            }
        };

        const fetchDatasets = async () => {
            if (!projectId) return;
            try {
                const results = await projectService.getDatasets(Number(projectId));
                setDatasets(results);
            } catch (err) {
                console.error("Failed to fetch datasets:", err);
            }
        };

        const fetchModels = async () => {
            if (!projectId) return;
            try {
                const results = await projectService.getModels(Number(projectId));
                setModels(results);
            } catch (err) {
                console.error("Failed to fetch models:", err);
            }
        };

        fetchProject();
        fetchDatasets();
        fetchModels();
    }, [projectId, navigate]);

    const handleLogout = async () => {
        setLoading(true);
        setDropdownOpen(false);
        try {
            await logoutUser();
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = () => {
        if (user?.displayName) {
            return user.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return user?.email?.charAt(0).toUpperCase() || "U";
    };

    const handleUploadSuccess = (newDataset: Dataset) => {
        setDatasets(prev => [newDataset, ...prev]);
        setIsUploadModalOpen(false);
    };

    if (projectLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
                    <p className="mt-4 text-neutral-600">Loading project...</p>
                </div>
            </div>
        );
    }

    if (projectError || !currentProject) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Project not found</h2>
                    <p className="text-neutral-600 mb-6">{projectError || "The project you're looking for doesn't exist."}</p>
                    <Button onClick={() => navigate('/projects')} className="bg-black text-white">
                        Back to Projects
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex">
            {/* Sidebar */}
            <aside
                className={`${sidebarCollapsed ? "w-16" : "w-64"
                    } border-r border-black transition-all duration-300 flex flex-col`}
            >
                {/* Sidebar Header */}
                <div className={`border-b border-black flex ${sidebarCollapsed ? 'flex-col gap-4 py-4 px-2 items-center' : 'items-center justify-between px-4 py-4'}`}>
                    <button
                        onClick={() => navigate('/projects')}
                        className={`flex items-center gap-2 hover:bg-neutral-100 rounded transition-colors ${sidebarCollapsed ? 'p-2 justify-center' : 'px-2 py-1'}`}
                        title="Back to Projects"
                    >
                        <LayoutGrid className="w-5 h-5" />
                        {!sidebarCollapsed && <span className="font-medium text-sm">Projects</span>}
                    </button>
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 hover:bg-neutral-100 rounded transition-colors"
                        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <ChevronLeft className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Current Project Info */}
                {!sidebarCollapsed && (
                    <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
                        <div className="flex items-center gap-2 mb-1">
                            <FolderOpen className="w-4 h-4 text-neutral-600" />
                            <h2 className="font-semibold text-sm truncate">{currentProject.name}</h2>
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{currentProject.description || "No description"}</p>
                    </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 py-4 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeNav === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveNav(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-md transition-all duration-200 ${isActive
                                    ? "bg-black text-white shadow-sm"
                                    : "hover:bg-neutral-100 text-black"
                                    } ${sidebarCollapsed ? "justify-center" : ""
                                    }`}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && (
                                    <span className="text-sm font-medium">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                {!sidebarCollapsed && (
                    <div className="border-t border-black p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">
                                {getInitials()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-medium truncate">
                                    {user?.displayName || "User"}
                                </p>
                                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="border-b border-black px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        {sidebarCollapsed && <h1 className="text-2xl font-bold">Void AI</h1>}
                        {!sidebarCollapsed && <div></div>}

                        {/* Right side: Notifications + Profile */}
                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setNotificationOpen(!notificationOpen)}
                                    className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors relative"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-5 h-5" />
                                </button>

                                {notificationOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-black shadow-lg z-50">
                                        <div className="p-4 border-b-2 border-black">
                                            <h3 className="font-semibold">Notifications</h3>
                                        </div>
                                        <div className="p-4 text-center text-neutral-500">
                                            No new notifications
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                                    aria-label="Profile menu"
                                >
                                    <span className="text-sm font-medium">{getInitials()}</span>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-black shadow-lg z-50">
                                        <div className="px-4 py-3 border-b-2 border-black">
                                            <p className="font-medium text-sm truncate">{user?.displayName || "User"}</p>
                                            <p className="text-xs text-neutral-600 truncate">{user?.email}</p>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 flex items-center gap-2 transition-colors"
                                            >
                                                <User className="w-4 h-4" />
                                                Profile
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 flex items-center gap-2 transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Settings
                                            </button>

                                            <button
                                                onClick={handleLogout}
                                                disabled={loading}
                                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors disabled:opacity-50"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {loading ? "Logging out..." : "Logout"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        {/* Model Builder Section */}
                        {activeNav === "model-builder" && (
                            <div className="flex justify-center items-center min-h-[70vh]">
                                <PromptBuilder
                                    projectId={currentProject?.id}
                                    initialModelId={activeModelId}
                                />
                            </div>
                        )}

                        {/* Models Section */}
                        {activeNav === "models" && (
                            <Models
                                onResume={(modelId) => {
                                    setActiveModelId(modelId);
                                    setActiveNav("model-builder");
                                }}
                                onNewModel={() => {
                                    setActiveModelId(undefined);
                                    setActiveNav("model-builder");
                                }}
                            />
                        )}

                        {/* Datasets Section */}
                        {activeNav === "datasets" && (
                            datasets.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold">Datasets</h2>
                                        <Button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            className="bg-black text-white hover:bg-neutral-800 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            New Dataset
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {datasets.map((dataset) => (
                                            <motion.div
                                                key={dataset.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="p-2 bg-neutral-100 rounded-lg">
                                                        <Database className="w-6 h-6 text-neutral-600" />
                                                    </div>
                                                    <span className="text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded-full border border-neutral-100">
                                                        {(dataset.file_size / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-lg mb-2 truncate" title={dataset.name}>
                                                    {dataset.name}
                                                </h3>
                                                <p className="text-sm text-neutral-500 mb-4 line-clamp-2 min-h-[40px]">
                                                    {dataset.description || "No description provided"}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-neutral-400 pt-4 border-t border-neutral-100">
                                                    <span>{new Date(dataset.upload_date).toLocaleDateString()}</span>
                                                    <span>{dataset.rows || 0} rows • {dataset.columns || 0} cols</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                                >
                                    <Database className="w-24 h-24 mb-6 opacity-20" />
                                    <h2 className="text-3xl mb-4">No Datasets</h2>
                                    <p className="text-lg text-neutral-600 mb-8 max-w-md">
                                        Upload your first dataset for this project to start building ML models
                                    </p>
                                    <Button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="bg-black text-white hover:bg-neutral-800 px-6 py-3 text-lg flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Upload Dataset
                                    </Button>
                                </motion.div>
                            )
                        )}

                        {/* Models Section */}
                        {activeNav === "models" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                            >
                                <Sparkles className="w-24 h-24 mb-6 opacity-20" />
                                <h2 className="text-3xl mb-4">No Models</h2>
                                <p className="text-lg text-neutral-600 mb-8 max-w-md">
                                    Create your first model using the Model Builder
                                </p>
                                <Button
                                    onClick={() => setActiveNav("model-builder")}
                                    className="bg-black text-white hover:bg-neutral-800 px-6 py-3 text-lg flex items-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Go to Model Builder
                                </Button>
                            </motion.div>
                        )}

                        {/* Training Section */}
                        {activeNav === "training" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                            >
                                <Play className="w-24 h-24 mb-6 opacity-20" />
                                <h2 className="text-3xl mb-4">No Training Jobs</h2>
                                <p className="text-lg text-neutral-600 mb-8 max-w-md">
                                    Start training your first machine learning model
                                </p>
                                <Button
                                    onClick={() => console.log("Start training")}
                                    className="bg-black text-white hover:bg-neutral-800 px-6 py-3 text-lg flex items-center gap-2"
                                >
                                    <Play className="w-5 h-5" />
                                    Start Training
                                </Button>
                            </motion.div>
                        )}

                        {/* Deployments Section */}
                        {activeNav === "deployments" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                            >
                                <Rocket className="w-24 h-24 mb-6 opacity-20" />
                                <h2 className="text-3xl mb-4">No Deployments</h2>
                                <p className="text-lg text-neutral-600 mb-8 max-w-md">
                                    Deploy your trained models to production
                                </p>
                                <Button
                                    onClick={() => console.log("Create deployment")}
                                    className="bg-black text-white hover:bg-neutral-800 px-6 py-3 text-lg flex items-center gap-2"
                                >
                                    <Rocket className="w-5 h-5" />
                                    Create Deployment
                                </Button>
                            </motion.div>
                        )}

                        {/* Analytics Section */}
                        {activeNav === "analytics" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                            >
                                <BarChart3 className="w-24 h-24 mb-6 opacity-20" />
                                <h2 className="text-3xl mb-4">No Analytics Data</h2>
                                <p className="text-lg text-neutral-600 mb-8 max-w-md">
                                    Track your model performance and usage metrics
                                </p>
                                <Button
                                    onClick={() => console.log("View analytics")}
                                    className="bg-black text-white hover:bg-neutral-800 px-6 py-3 text-lg flex items-center gap-2"
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    View Analytics
                                </Button>
                            </motion.div>
                        )}

                        {/* Documentation Section */}
                        {activeNav === "documentation" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                            >
                                <BookOpen className="w-24 h-24 mb-6 opacity-20" />
                                <h2 className="text-3xl mb-4">Documentation</h2>
                                <p className="text-lg text-neutral-600 mb-8 max-w-md">
                                    Learn how to use Void AI to build and deploy machine learning models
                                </p>
                                <Button
                                    onClick={() => window.open("https://docs.voidai.com", "_blank")}
                                    className="bg-black text-white hover:bg-neutral-800 px-6 py-3 text-lg flex items-center gap-2"
                                >
                                    <BookOpen className="w-5 h-5" />
                                    View Docs
                                </Button>
                            </motion.div>
                        )}

                        {/* Settings Section */}
                        {activeNav === "settings" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                            >
                                <Settings className="w-24 h-24 mb-6 opacity-20" />
                                <h2 className="text-3xl mb-4">Project Settings</h2>
                                <p className="text-lg text-neutral-600 mb-8 max-w-md">
                                    Configure your project preferences and settings
                                </p>
                                <Button
                                    onClick={() => console.log("Open settings")}
                                    className="bg-black text-white hover:bg-neutral-800 px-6 py-3 text-lg flex items-center gap-2"
                                >
                                    <Settings className="w-5 h-5" />
                                    Configure Settings
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <DatasetUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
                projectId={currentProject?.id}
            />
        </div>
    );
}
