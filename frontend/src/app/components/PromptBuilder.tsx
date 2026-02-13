import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, Loader2, Upload, X, Play, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { mlBuilderService } from "../../lib/mlBuilderService";
import { projectService } from "../../lib/projectService";
import type { IntentExtractionResponse } from "../../lib/mlBuilderService";
import type { Dataset } from "../../types/api";
import { IntentEditor } from "./IntentEditor";

export function PromptBuilder({ projectId, initialModelId }: { projectId?: number; initialModelId?: number }) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    // ... other states ...

    useEffect(() => {
        if (initialModelId) {
            loadModel(initialModelId);
        }
    }, [initialModelId]);

    const loadModel = async (id: number) => {
        try {
            setLoading(true);
            const model = await projectService.getModel(id);
            if (model) {
                // Populate state from model
                // If model has intent, we set it to intentResult
                if (model.intent) {
                    setIntentResult({
                        success: true,
                        intent: model.intent,
                        model_id: model.id,
                        validation: { is_valid: true }, // Assuming it was valid
                        dataset_info: {}, // We might need to fetch this or store it in model
                        raw_prompt: ""
                    });
                }

                // Set dataset if available
                if (model.dataset) {
                    setSelectionMode('select');
                    setSelectedDatasetId(model.dataset.toString());
                }
            }
        } catch (err) {
            console.error("Failed to load model:", err);
            setError("Failed to load model details.");
        } finally {
            setLoading(false);
        }
    };
    const [trainingLoading, setTrainingLoading] = useState(false);
    const [error, setError] = useState("");

    // File upload state
    const [file, setFile] = useState<File | null>(null);

    // Dataset selection state
    const [selectionMode, setSelectionMode] = useState<'upload' | 'select'>('upload');
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");

    const [intentResult, setIntentResult] = useState<IntentExtractionResponse | null>(null);
    const [trainingResult, setTrainingResult] = useState<any | null>(null);

    // Fetch datasets on mount or when projectId changes
    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                // If projectId is provided, filter by it, otherwise get all (or handle appropriately)
                const results = await projectService.getDatasets(projectId);
                setDatasets(results);
            } catch (err) {
                console.error("Failed to fetch datasets:", err);
            }
        };
        fetchDatasets();
    }, [projectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectId) {
            setError("Project context missing. Please refresh the page.");
            return;
        }

        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        if (selectionMode === 'upload' && !file) {
            setError("Please upload a dataset file");
            return;
        }

        if (selectionMode === 'select' && !selectedDatasetId) {
            setError("Please select a dataset");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setIntentResult(null);
            setTrainingResult(null);

            let finalDatasetId: number | null = null;

            // Step 1: Handle Dataset (Upload if needed)
            if (selectionMode === 'upload' && file) {
                // Upload the file first to create a Dataset record
                const formData = new FormData();
                formData.append('file_path', file);
                formData.append('name', file.name.split('.')[0]); // Use filename as dataset name
                formData.append('description', 'Uploaded via Model Builder');
                formData.append('project', projectId.toString());

                const uploadedDataset = await projectService.uploadDataset(formData);
                finalDatasetId = uploadedDataset.id;

                // Refresh dataset list
                const results = await projectService.getDatasets(projectId);
                setDatasets(results);
            } else if (selectedDatasetId) {
                finalDatasetId = parseInt(selectedDatasetId);
            }

            if (!finalDatasetId) {
                throw new Error("Failed to resolve dataset ID");
            }

            // Step 2: Extract Intent (using dataset ID)
            const intentData = {
                prompt,
                dataset_id: finalDatasetId
            };

            const result: IntentExtractionResponse = await mlBuilderService.extractIntent(intentData);

            // Log intent to console
            console.log("=".repeat(60));
            console.log("🤖 ML MODEL INTENT EXTRACTED");
            console.log("=".repeat(60));
            console.log("Raw Prompt:", result.raw_prompt);
            console.log("\nExtracted Intent:");
            console.log(JSON.stringify(result.intent, null, 2));
            if (result.experiment_plan) {
                console.log("\nExperiment Plan:");
                console.log(JSON.stringify(result.experiment_plan, null, 2));
            }
            console.log("=".repeat(60));

            if (!result.success) {
                throw new Error(result.error || "Failed to extract intent");
            }

            setIntentResult(result);

            // We stop here to let user review/edit intent
            // Training is now triggered manually via handleStartTraining

        } catch (err: any) {
            console.error("Error in model building process:", err);
            setError(err.response?.data?.error || err.message || "An error occurred. Please try again.");
            // Keep intentResult visible if it exists so user sees what happened,
            // but we might want to hide the spinner if we are here.
            // Actually, if we error out, trainingLoading becomes false in finally.
        } finally {
            setLoading(false);
            setTrainingLoading(false);
        }
    };

    const handleReset = () => {
        setPrompt("");
        setFile(null);
        setIntentResult(null);
        setTrainingResult(null);
        setError("");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    const handleStartTraining = async () => {
        if (!intentResult?.intent) {
            setError("No intent available");
            return;
        }

        try {
            setTrainingLoading(true);
            setError("");

            // Determine the correct dataset ID to use for training
            let finalDatasetId = 1; // Default

            if (selectionMode === 'select' && selectedDatasetId) {
                finalDatasetId = parseInt(selectedDatasetId);
            } else if (intentResult.dataset_info?.dataset_id) {
                // If we got dataset info from extract intent (e.g. from upload), use it
                finalDatasetId = intentResult.dataset_info.dataset_id;
            }

            const trainingRequest = {
                // We send the (potentially edited) intent, backend will compile plan
                intent: intentResult.intent,
                model_id: intentResult.model_id, // Pass the ID to update the existing draft
                dataset_id: finalDatasetId,
                project_id: projectId || 1,
                model_name: `Model - ${new Date().toLocaleString()}`
            };

            const result = await mlBuilderService.startTraining(trainingRequest);

            console.log("=".repeat(60));
            console.log("🚀 TRAINING COMPLETED");
            console.log("=".repeat(60));
            console.log(JSON.stringify(result, null, 2));
            console.log("=".repeat(60));

            setTrainingResult(result);
            // Hide intent editor when training starts/completes to show results clearly
            // setIntentResult(null); 

        } catch (err: any) {
            console.error("Error starting training:", err);
            setError(err.response?.data?.error || err.message || "Failed to start training. Please try again.");
        } finally {
            setTrainingLoading(false);
        }
    };

    const isSubmitDisabled = !prompt.trim() || (selectionMode === 'upload' && !file) || (selectionMode === 'select' && !selectedDatasetId) || loading || trainingLoading;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-6xl mx-auto"
        >
            {/* Header */}
            <div className="mb-8 text-center">
                <h2 className="text-4xl font-semibold mb-3">Build Your ML Model</h2>
                <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                    Describe your machine learning model and upload your dataset. And just start training.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                {/* Prompt Input */}
                <div className="relative border-2 border-black rounded-lg overflow-hidden">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., I want to build a classification model to predict customer churn based on user behavior and demographics..."
                        className="w-full h-48 px-6 py-4 text-base border-none focus:outline-none resize-none placeholder:text-neutral-400"
                        disabled={loading || trainingLoading}
                    />
                    <div className="absolute bottom-4 right-4 text-sm text-neutral-400">
                        {prompt.length} characters
                    </div>
                </div>

                {/* Dataset Source Selection */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium font-semibold">Dataset Source</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setSelectionMode('upload')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${selectionMode === 'upload'
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                                }`}
                        >
                            Upload New File
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectionMode('select')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${selectionMode === 'select'
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                                }`}
                        >
                            Select Existing
                        </button>
                    </div>

                    {selectionMode === 'upload' ? (
                        <div className="border-2 border-dashed border-black rounded-lg p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="cursor-pointer flex items-center gap-3">
                                        <Upload className="w-5 h-5" />
                                        <span className="text-sm font-medium">
                                            {file ? file.name : "Upload Dataset (CSV, Excel)"}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            disabled={loading || trainingLoading}
                                        />
                                    </label>
                                </div>
                                {file && (
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                        disabled={loading || trainingLoading}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <select
                                value={selectedDatasetId}
                                onChange={(e) => setSelectedDatasetId(e.target.value)}
                                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none bg-white"
                                disabled={loading || trainingLoading}
                            >
                                <option value="">-- Choose a previously uploaded dataset --</option>
                                {datasets.map((dataset) => (
                                    <option key={dataset.id} value={dataset.id}>
                                        {dataset.name} ({new Date(dataset.upload_date).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                            {datasets.length === 0 && (
                                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    No datasets found. Please upload one first.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border-2 border-red-200 rounded-lg p-4"
                    >
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-900">Error</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="w-full h-14 text-base bg-black hover:bg-neutral-800 transition-colors disabled:bg-neutral-400"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Extracting Intent...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5 mr-2" />
                            Extract Intent
                        </>
                    )}
                </Button>
            </form>







            {/* Intent Editor / Experiment Plan Display */}
            <AnimatePresence>
                {intentResult && intentResult.intent && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Validation Warnings */}
                        {intentResult.validation?.warnings && intentResult.validation.warnings.length > 0 && (
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-yellow-900">Warnings</p>
                                        <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                                            {intentResult.validation.warnings.map((warning, idx) => (
                                                <li key={idx}>{warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Visual Intent Editor */}
                        <div className="border-2 border-black rounded-lg overflow-hidden">
                            <div className="bg-black text-white px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Review & Configure</h3>
                                <div className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-300">
                                    {intentResult.dataset_info?.shape ?
                                        `${intentResult.dataset_info.shape[0]} rows × ${intentResult.dataset_info.shape[1]} cols` :
                                        'Dataset loaded'}
                                </div>
                            </div>

                            <div className="p-6 bg-neutral-50">
                                <IntentEditor
                                    intent={intentResult.intent}
                                    datasetInfo={intentResult.dataset_info}
                                    onChange={(newIntent) => setIntentResult({ ...intentResult, intent: newIntent })}
                                />
                            </div>

                            <div className="p-4 bg-white border-t-2 border-neutral-200 flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIntentResult(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleStartTraining}
                                    disabled={trainingLoading}
                                    className="bg-black text-white hover:bg-neutral-800"
                                >
                                    {trainingLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Starting Training...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Confirm & Train
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Experiment Plan Executing... (Only show when training starts) */}
            <AnimatePresence>
                {intentResult && intentResult.experiment_plan && trainingLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Validation Warnings */}
                        {intentResult.validation?.warnings && intentResult.validation.warnings.length > 0 && (
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-yellow-900">Warnings</p>
                                        <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                                            {intentResult.validation.warnings.map((warning, idx) => (
                                                <li key={idx}>{warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Experiment Plan Summary */}
                        <div className="border-2 border-black rounded-lg overflow-hidden">
                            <div className="bg-black text-white px-6 py-4">
                                <h3 className="text-lg font-semibold">Experiment Plan Executing...</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-neutral-600">Task Type</p>
                                        <p className="text-lg font-medium capitalize">
                                            {intentResult.experiment_plan.task_config.type}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-600">Metric</p>
                                        <p className="text-lg font-medium uppercase">
                                            {intentResult.experiment_plan.task_config.metric}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-600">Total Experiments</p>
                                        <p className="text-lg font-medium">
                                            {intentResult.experiment_plan.experiments.length}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-600">Cross-Validation</p>
                                        <p className="text-lg font-medium">
                                            {intentResult.experiment_plan.task_config.cv_folds}-Fold
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Training Results */}
            <AnimatePresence>
                {trainingResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mt-6 border-2 border-green-500 rounded-lg overflow-hidden"
                    >
                        <div className="bg-green-500 text-white px-6 py-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6" />
                                <h3 className="text-lg font-semibold">Training Complete!</h3>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-neutral-600">Best Score</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {(trainingResult.best_score * 100).toFixed(2)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-600">Model</p>
                                    <p className="text-lg font-medium">{trainingResult.best_experiment_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-600">Experiments</p>
                                    <p className="text-lg font-medium">{trainingResult.total_experiments}</p>
                                </div>
                            </div>

                            {/* Results Table */}
                            {trainingResult.results && trainingResult.results.length > 0 && (
                                <div className="border-t-2 border-neutral-200 pt-4 mt-4">
                                    <p className="text-sm font-medium mb-3">Top Results:</p>
                                    <div className="max-h-96 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-neutral-100 sticky top-0">
                                                <tr>
                                                    <th className="text-left px-3 py-2 font-medium">ID</th>
                                                    <th className="text-left px-3 py-2 font-medium">Model</th>
                                                    <th className="text-right px-3 py-2 font-medium">CV Mean</th>
                                                    <th className="text-right px-3 py-2 font-medium">Test Score</th>
                                                    <th className="text-right px-3 py-2 font-medium">Time (s)</th>
                                                    <th className="text-center px-3 py-2 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trainingResult.results
                                                    .filter((r: any) => r.status === 'completed')
                                                    .sort((a: any, b: any) => (b.test_score || 0) - (a.test_score || 0))
                                                    .map((result: any) => (
                                                        <tr key={result.exp_id} className="border-t border-neutral-200">
                                                            <td className="px-3 py-2 font-mono text-xs">{result.exp_id}</td>
                                                            <td className="px-3 py-2">{result.model}</td>
                                                            <td className="px-3 py-2 text-right">
                                                                {result.cv_mean ? result.cv_mean.toFixed(4) : '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-medium">
                                                                {result.test_score ? result.test_score.toFixed(4) : '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-neutral-600">
                                                                {result.training_time_seconds ? result.training_time_seconds.toFixed(2) : '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                {result.status === 'completed' ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                                                                ) : (
                                                                    <XCircle className="w-4 h-4 text-red-600 mx-auto" />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Dataset Source</label>
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setSelectionMode('upload')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectionMode === 'upload'
                                                ? 'bg-black text-white'
                                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                                }`}
                                        >
                                            Upload New File
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectionMode('select')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectionMode === 'select'
                                                ? 'bg-black text-white'
                                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                                }`}
                                        >
                                            Select Existing
                                        </button>
                                    </div>
                                </div>

                                {selectionMode === 'upload' ? (
                                    <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-black transition-colors cursor-pointer bg-neutral-50 relative group">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept=".csv,.xlsx,.xls"
                                        />
                                        <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                                            {file ? (
                                                <>
                                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                                    <span className="font-medium text-green-600">{file.name}</span>
                                                    <span className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFile(null);
                                                        }}
                                                        className="mt-2 text-xs text-red-500 hover:text-red-700 z-10 relative"
                                                    >
                                                        Remove file
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-neutral-400" />
                                                    <span className="font-medium">Click to upload or drag and drop</span>
                                                    <span className="text-sm text-neutral-500">CSV, Excel files supported</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-neutral-700">Select Dataset</label>
                                        {datasets.length > 0 ? (
                                            <select
                                                value={selectedDatasetId}
                                                onChange={(e) => setSelectedDatasetId(e.target.value)}
                                                className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                                            >
                                                <option value="">-- Choose a dataset --</option>
                                                {datasets.map((dataset) => (
                                                    <option key={dataset.id} value={dataset.id}>
                                                        {dataset.name} ({new Date(dataset.upload_date).toLocaleDateString()})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                No datasets found. Please upload a new one first.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleReset}
                                className="w-full h-12 bg-black hover:bg-neutral-800"
                            >
                                Build Another Model
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
