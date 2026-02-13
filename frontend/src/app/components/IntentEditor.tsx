import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Settings, Database, Cpu, Check, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface IntentEditorProps {
    intent: any;
    datasetInfo?: any;
    onChange: (newIntent: any) => void;
}

export function IntentEditor({ intent, datasetInfo, onChange }: IntentEditorProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'data' | 'models'>('general');

    // safe access helpers
    const task = intent.task || {};
    const preprocessing = intent.preprocessing || {};
    const searchSpace = intent.search_space || {};
    const models = searchSpace.models || [];

    const updateTask = (key: string, value: any) => {
        onChange({
            ...intent,
            task: { ...task, [key]: value }
        });
    };

    const updatePreprocessing = (key: string, value: any) => {
        onChange({
            ...intent,
            preprocessing: { ...preprocessing, [key]: value }
        });
    };

    const toggleModel = (modelName: string) => {
        const currentModels = [...models];
        const existingIndex = currentModels.findIndex((m: any) => m.name === modelName);

        if (existingIndex >= 0) {
            // Remove model
            currentModels.splice(existingIndex, 1);
        } else {
            // Add model with empty params (defaults)
            currentModels.push({ name: modelName, params: {} });
        }

        onChange({
            ...intent,
            search_space: {
                ...searchSpace,
                models: currentModels
            }
        });
    };

    const isModelSelected = (modelName: string) => {
        return models.some((m: any) => m.name === modelName);
    };

    return (
        <div className="bg-white border-2 border-black rounded-lg overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="bg-neutral-100 px-6 py-4 border-b-2 border-neutral-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Configuration Editor</h3>
                <div className="flex gap-2">
                    <TabButton
                        active={activeTab === 'general'}
                        onClick={() => setActiveTab('general')}
                        icon={<Settings className="w-4 h-4" />}
                        label="General"
                    />
                    <TabButton
                        active={activeTab === 'data'}
                        onClick={() => setActiveTab('data')}
                        icon={<Database className="w-4 h-4" />}
                        label="Data"
                    />
                    <TabButton
                        active={activeTab === 'models'}
                        onClick={() => setActiveTab('models')}
                        icon={<Cpu className="w-4 h-4" />}
                        label="Models"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Task Type</label>
                                    <select
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={task.type || 'regression'}
                                        onChange={(e) => updateTask('type', e.target.value)}
                                    >
                                        <option value="regression">Regression</option>
                                        <option value="classification">Classification</option>
                                        <option value="clustering">Clustering</option>
                                        <option value="timeseries">Time Series</option>
                                    </select>
                                    <p className="text-xs text-neutral-500">
                                        Type of machine learning problem to solve
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Optimization Metric</label>
                                    <select
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={task.metric || ''}
                                        onChange={(e) => updateTask('metric', e.target.value)}
                                    >
                                        <optgroup label="Regression">
                                            <option value="rmse">RMSE</option>
                                            <option value="mae">MAE</option>
                                            <option value="r2">R2 Score</option>
                                        </optgroup>
                                        <optgroup label="Classification">
                                            <option value="accuracy">Accuracy</option>
                                            <option value="f1">F1 Score</option>
                                            <option value="precision">Precision</option>
                                            <option value="recall">Recall</option>
                                            <option value="roc_auc">ROC AUC</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Column</label>
                                {datasetInfo?.columns ? (
                                    <select
                                        className="w-full p-2 border-2 border-black rounded-lg bg-yellow-50"
                                        value={task.target_column || ''}
                                        onChange={(e) => updateTask('target_column', e.target.value)}
                                    >
                                        <option value="">-- Select Target Column --</option>
                                        {datasetInfo.columns.map((col: string) => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={task.target_column || ''}
                                        onChange={(e) => updateTask('target_column', e.target.value)}
                                        placeholder="Enter column name"
                                    />
                                )}
                                <p className="text-xs text-neutral-500">
                                    The column you want to predict
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cross-Validation Folds</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={task.cv_folds || 5}
                                        onChange={(e) => updateTask('cv_folds', parseInt(e.target.value))}
                                        min={2}
                                        max={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Test Size</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={task.test_size || 0.2}
                                        onChange={(e) => updateTask('test_size', parseFloat(e.target.value))}
                                        step={0.05}
                                        min={0.1}
                                        max={0.5}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            <h4 className="font-semibold border-b pb-2">Preprocessing Strategy</h4>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Missing Values (Numeric)</label>
                                    <select
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={preprocessing.missing_strategy?.numeric || 'mean'}
                                        onChange={(e) => updatePreprocessing('missing_strategy', {
                                            ...preprocessing.missing_strategy,
                                            numeric: e.target.value
                                        })}
                                    >
                                        <option value="mean">Mean Imputation</option>
                                        <option value="median">Median Imputation</option>
                                        <option value="most_frequent">Most Frequent</option>
                                        <option value="constant">Constant (0)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Missing Values (Categorical)</label>
                                    <select
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={preprocessing.missing_strategy?.categorical || 'most_frequent'}
                                        onChange={(e) => updatePreprocessing('missing_strategy', {
                                            ...preprocessing.missing_strategy,
                                            categorical: e.target.value
                                        })}
                                    >
                                        <option value="most_frequent">Most Frequent</option>
                                        <option value="constant">Constant ("Missing")</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Scaling</label>
                                    <select
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={preprocessing.scaling || 'standard'}
                                        onChange={(e) => updatePreprocessing('scaling', e.target.value)}
                                    >
                                        <option value="standard">Standard Scaler (Z-Score)</option>
                                        <option value="minmax">MinMax Scaler (0-1)</option>
                                        <option value="robust">Robust Scaler (Outlier Safe)</option>
                                        <option value="none">No Scaling</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Encoding</label>
                                    <select
                                        className="w-full p-2 border-2 border-neutral-200 rounded-lg"
                                        value={preprocessing.encoding || 'onehot'}
                                        onChange={(e) => updatePreprocessing('encoding', e.target.value)}
                                    >
                                        <option value="onehot">One-Hot Encoding</option>
                                        <option value="label">Label Encoding</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'models' && (
                        <div className="space-y-6">
                            <h4 className="font-semibold border-b pb-2">Model Selection</h4>
                            <p className="text-sm text-neutral-500 mb-4">
                                Select algorithms to include in the search space. More models mean longer training time.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['random_forest', 'xgboost', 'lightgbm', 'linear_regression', 'decision_tree', 'svm', 'knn'].map((model) => (
                                    <label key={model} className={`
                                        flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                                        ${isModelSelected(model) ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'}
                                    `}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isModelSelected(model) ? 'bg-black border-black' : 'border-neutral-300'
                                                }`}>
                                                {isModelSelected(model) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="font-medium capitalize">{model.replace('_', ' ')}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isModelSelected(model)}
                                            onChange={() => toggleModel(model)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-200'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
