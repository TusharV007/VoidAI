import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Brain, Search, Filter, MoreVertical, Play, FileText, AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { projectService } from "../../lib/projectService";
import type { MLModel } from "../../types/api";
import { Button } from "../components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { toast } from "sonner";

interface ModelsProps {
    onResume: (modelId: number) => void;
    onNewModel: () => void;
}

export default function Models({ onResume, onNewModel }: ModelsProps) {
    const [models, setModels] = useState<MLModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [modelToDelete, setModelToDelete] = useState<MLModel | null>(null);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            setLoading(true);
            const data = await projectService.getModels();
            setModels(data);
        } catch (error) {
            console.error("Failed to fetch models:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (model: MLModel) => {
        setModelToDelete(model);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!modelToDelete) return;

        try {
            await projectService.deleteModel(modelToDelete.id);
            setModels(models.filter(m => m.id !== modelToDelete.id));
            toast.success("Model deleted successfully");
        } catch (error) {
            console.error("Failed to delete model:", error);
            toast.error("Failed to delete model");
        } finally {
            setIsDeleteDialogOpen(false);
            setModelToDelete(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'training': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'failed': return 'bg-red-100 text-red-700 border-red-200';
            case 'draft': return 'bg-neutral-100 text-neutral-700 border-neutral-200';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-3.5 h-3.5" />;
            case 'training': return <Clock className="w-3.5 h-3.5 animate-pulse" />;
            case 'failed': return <AlertCircle className="w-3.5 h-3.5" />;
            case 'draft': return <FileText className="w-3.5 h-3.5" />;
            default: return <Brain className="w-3.5 h-3.5" />;
        }
    };

    const filteredModels = models.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.algorithm?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">My Models</h1>
                    <p className="text-neutral-500">Manage and monitor your machine learning models.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                    </Button>
                    <Button
                        onClick={onNewModel}
                        className="bg-black text-white hover:bg-neutral-800 gap-2"
                    >
                        <Brain className="w-4 h-4" />
                        Train New Model
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search models by name or algorithm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
            </div>

            {/* Models Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
            ) : filteredModels.length === 0 ? (
                <div className="text-center py-20 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                    <Brain className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">No models found</h3>
                    <p className="text-neutral-500 mb-6">Start by training your first machine learning model.</p>
                    <Button
                        onClick={onNewModel}
                        className="bg-black text-white hover:bg-neutral-800"
                    >
                        Build Model
                    </Button>
                </div>
            ) : (
                <div className="bg-white border-2 border-neutral-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 border-b-2 border-neutral-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-sm text-neutral-600">Model Name</th>
                                <th className="px-6 py-4 font-semibold text-sm text-neutral-600">Status</th>
                                <th className="px-6 py-4 font-semibold text-sm text-neutral-600">Algorithm</th>
                                <th className="px-6 py-4 font-semibold text-sm text-neutral-600">Accuracy</th>
                                <th className="px-6 py-4 font-semibold text-sm text-neutral-600">Created</th>
                                <th className="px-6 py-4 font-semibold text-sm text-neutral-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {filteredModels.map((model) => (
                                <motion.tr
                                    key={model.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-neutral-50 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-neutral-900">{model.name}</div>
                                        <div className="text-xs text-neutral-500 truncate max-w-[200px]">{model.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(model.status)}`}>
                                            {getStatusIcon(model.status)}
                                            <span className="capitalize">{model.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize text-sm text-neutral-600">
                                            {model.algorithm.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {model.accuracy ? (
                                            <span className="text-sm font-medium">
                                                {(model.accuracy * 100).toFixed(1)}%
                                            </span>
                                        ) : (
                                            <span className="text-neutral-400 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-neutral-600">
                                            {new Date(model.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {model.status === 'draft' ? (
                                                <Button
                                                    onClick={() => onResume(model.id)}
                                                    size="sm"
                                                    className="bg-black text-white hover:bg-neutral-800 h-8 gap-1.5"
                                                >
                                                    <Play className="w-3 h-3" />
                                                    Resume
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="w-4 h-4 text-neutral-400" />
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteClick(model)}
                                                title="Delete Model"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the model
                            <span className="font-semibold text-black"> {modelToDelete?.name} </span>
                            and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
