import { apolloApi } from './api';

export interface PredictResponse {
  symbol: string;
  predicted_next_close: number;
  heat_score: Record<string, any>;
  forecasts: Array<Record<string, any>>;
  status: string;
}

export interface HealthResponse {
  status: string;
}

export interface InfoResponse {
  model_version: string;
  model_description: string;
}

export interface TrainingStatusResponse {
  is_training: boolean;
  started_at?: string;
  current_epoch: number;
  total_epochs: number;
  last_val_loss?: number;
}

export interface TrainingStartResponse {
  success: boolean;
  message: string;
}

export const apolloService = {
  // Get health status
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await apolloApi.get('/health');
    return response.data;
  },

  // Get model info
  getInfo: async (): Promise<InfoResponse> => {
    const response = await apolloApi.get('/info');
    return response.data;
  },

  // Get prediction for a symbol
  getPrediction: async (symbol: string): Promise<PredictResponse> => {
    const response = await apolloApi.get('/predict', {
      params: { symbol }
    });
    return response.data;
  },

  // Start model training
  startTraining: async (): Promise<TrainingStartResponse> => {
    const response = await apolloApi.post('/train');
    return response.data;
  },

  // Get training status
  getTrainingStatus: async (): Promise<TrainingStatusResponse> => {
    const response = await apolloApi.get('/train/status');
    return response.data;
  }
}; 