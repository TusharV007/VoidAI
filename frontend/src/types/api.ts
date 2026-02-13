// API Types
export interface User {
    id: number;
    firebase_uid: string;
    email: string;
    display_name: string;
    created_at: string;
    updated_at: string;
    storage_used: number;
    projects_count: number;
}

export interface Project {
    id: number;
    owner: number;
    owner_email: string;
    name: string;
    description: string;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
    datasets_count: number;
    models_count: number;
}

export interface Dataset {
    id: number;
    project: number;
    project_name: string;
    name: string;
    description: string;
    file_path: string;
    file_size: number;
    rows: number | null;
    columns: number | null;
    upload_date: string;
    preprocessing_config: Record<string, any>;
}

export interface MLModel {
    id: number;
    project: number;
    project_name: string;
    name: string;
    description: string;
    algorithm: string;
    status: 'draft' | 'training' | 'completed' | 'failed';
    intent?: any;
    dataset?: number; // Dataset ID
    accuracy: number | null;
    metrics: Record<string, any>;
    model_file_path: string;
    created_at: string;
    training_duration: string | null;
}

export interface TrainingRun {
    id: number;
    model: number;
    model_name: string;
    dataset: number;
    dataset_name: string;
    started_at: string;
    completed_at: string | null;
    hyperparameters: Record<string, any>;
    logs: string;
    status: 'running' | 'completed' | 'failed';
}

export interface Deployment {
    id: number;
    model: number;
    model_name: string;
    name: string;
    endpoint_url: string;
    status: 'active' | 'inactive';
    deployed_at: string;
    requests_count: number;
    avg_response_time: number | null;
}

// API Response types
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
