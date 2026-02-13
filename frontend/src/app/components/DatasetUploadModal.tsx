import { useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { projectService } from "../../lib/projectService";
import type { Dataset } from "../../types/api";

interface DatasetUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: (dataset: Dataset) => void;
    projectId?: number;
}

export function DatasetUploadModal({ isOpen, onClose, onUploadSuccess, projectId = 1 }: DatasetUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Auto-fill name if empty
            if (!name) {
                const fileName = selectedFile.name.split('.')[0];
                setName(fileName.charAt(0).toUpperCase() + fileName.slice(1).replace(/[-_]/g, ' '));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !name) {
            setError("Please select a file and provide a name");
            return;
        }

        try {
            setUploading(true);
            setError("");

            const formData = new FormData();
            formData.append('file_path', file);
            formData.append('name', name);
            formData.append('description', description);
            formData.append('project', projectId.toString());

            const dataset = await projectService.uploadDataset(formData);
            onUploadSuccess(dataset);
            handleClose();
        } catch (err: any) {
            console.error("Upload failed:", err);
            setError(err.response?.data?.error || "Failed to upload dataset. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setName("");
        setDescription("");
        setError("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Upload Dataset</h2>
                    <button onClick={handleClose} className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700">Dataset File (CSV, Excel)</label>
                        <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-black transition-colors cursor-pointer bg-neutral-50 relative group">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".csv,.xlsx,.xls"
                            />
                            <div className="flex flex-col items-center gap-2">
                                {file ? (
                                    <>
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                        <span className="font-medium text-green-600 truncate max-w-[200px]">{file.name}</span>
                                        <span className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-neutral-400 group-hover:scale-110 transition-transform" />
                                        <span className="font-medium text-neutral-600">Click to upload</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700">Dataset Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            placeholder="e.g., Credit Card Transactions"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none h-24 resize-none"
                            placeholder="Brief description of the dataset..."
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={uploading || !file} className="bg-black text-white hover:bg-neutral-800">
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload Dataset'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
