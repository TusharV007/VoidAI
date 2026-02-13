import apiClient from './apiClient';
import type { Project, Dataset, MLModel, PaginatedResponse } from '../types/api';

export const projectService = {
    // Get all projects
    async getProjects(): Promise<Project[]> {
        const response = await apiClient.get<PaginatedResponse<Project>>('/projects/');
        return response.data.results;
    },

    // Get all datasets
    async getDatasets(projectId?: number): Promise<Dataset[]> {
        const url = projectId ? `/datasets/?project=${projectId}` : '/datasets/';
        const response = await apiClient.get<PaginatedResponse<Dataset>>(url);
        return response.data.results;
    },

    // Get all models
    async getModels(projectId?: number): Promise<MLModel[]> {
        const url = projectId ? `/models/?project=${projectId}` : '/models/';
        const response = await apiClient.get<PaginatedResponse<MLModel>>(url);
        return response.data.results;
    },

    // Get single model
    async getModel(id: number): Promise<MLModel> {
        const response = await apiClient.get<MLModel>(`/models/${id}/`);
        return response.data;
    },

    // Get single dataset
    async getDataset(id: number): Promise<Dataset> {
        const response = await apiClient.get<Dataset>(`/datasets/${id}/`);
        return response.data;
    },

    // Upload new dataset
    async uploadDataset(formData: FormData): Promise<Dataset> {
        const response = await apiClient.post<Dataset>('/datasets/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get single project
    async getProject(id: number): Promise<Project> {
        const response = await apiClient.get<Project>(`/projects/${id}/`);
        return response.data;
    },

    // Create project
    async createProject(data: {
        name: string;
        description?: string;
    }): Promise<Project> {
        const response = await apiClient.post<Project>('/projects/', data);
        return response.data;
    },

    // Update project
    async updateProject(
        id: number,
        data: Partial<{
            name: string;
            description: string;
            status: 'active' | 'archived';
        }>
    ): Promise<Project> {
        const response = await apiClient.patch<Project>(`/projects/${id}/`, data);
        return response.data;
    },

    // Delete project
    async deleteProject(id: number): Promise<void> {
        await apiClient.delete(`/projects/${id}/`);
    },

    // Delete model
    async deleteModel(id: number): Promise<void> {
        await apiClient.delete(`/models/${id}/`);
    },
};
