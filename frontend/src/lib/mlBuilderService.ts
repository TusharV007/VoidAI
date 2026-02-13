import apiClient from './apiClient';

export interface MLIntent {
    task_type: string;
    target: string;
    dataset_description?: string;
    features?: string[];
    algorithm_suggestions?: string[];
    preprocessing_steps?: string[];
    evaluation_metrics?: string[];
    additional_context?: string;
}

export interface IntentExtractionRequest {
    prompt: string;
}

export interface IntentExtractionResponse {
    success: boolean;
    intent?: any;  // ML intent object
    model_id?: number; // ID of the persisted draft model
    validation?: {
        is_valid: boolean;
        warnings?: string[];
    };
    experiment_plan?: {
        task_config: any;
        preprocessing: any;
        experiments: any[];
    };
    dataset_info?: any;
    raw_prompt: string;
    error?: string;
    validation_errors?: string[];
    raw_response?: string;
}

export interface TrainingRequest {
    experiment_plan?: any;
    intent?: any;
    model_id?: number; // Optional: update existing model instead of creating new
    dataset_id: number;
    project_id: number;
    model_name: string;
}

export interface TrainingResponse {
    success: boolean;
    training_run_id: number;
    model_id: number;
    total_experiments: number;
    best_experiment_id: string;
    best_score: number;
    results?: any[];
    error?: string;
}

export const mlBuilderService = {
    /**
     * Extract ML model intent with optional dataset upload
     */
    async extractIntent(data: FormData | any): Promise<IntentExtractionResponse> {
        const isFormData = data instanceof FormData;
        const config = isFormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        } : {};

        const response = await apiClient.post<IntentExtractionResponse>(
            '/extract-intent/',
            data,
            config
        );
        return response.data;
    },

    /**
     * Start training with experiment plan
     */
    async startTraining(data: TrainingRequest): Promise<TrainingResponse> {
        const response = await apiClient.post<TrainingResponse>(
            '/train/',
            data
        );
        return response.data;
    },
};
