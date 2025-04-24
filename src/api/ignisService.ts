import { ignisApi } from './api';

export interface HealthResponse {
  status: string;
}

export interface InfoResponse {
  model_version: string;
  model_description: string;
}

export interface PredictRequest {
  symbol: string;
  horizon?: number;
}

export interface PredictResponse {
  symbol: string;
  horizon: number;
  pred_close: number;
  delta: number;
  lookback_used: number;
  heat_score: number;
  confidence: number;
  explanation: string;
}

export interface TrainingStartResponse {
  success: boolean;
  message: string;
}

export enum TrainingStatus {
  IDLE = "idle",
  TRAINING = "training",
  SUCCESS = "success",
  FAILED = "failed"
}

export interface TrainingStatusResponse {
  status: TrainingStatus;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  error?: string;
}

export const ignisService = {
  // Get health status
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await ignisApi.get('/health');
    return response.data;
  },

  // Get model info
  getInfo: async (): Promise<InfoResponse> => {
    const response = await ignisApi.get('/info');
    return response.data;
  },

  // Get prediction for a symbol
  getPrediction: async (request: PredictRequest): Promise<PredictResponse> => {
    const response = await ignisApi.post('/predict', request);
    return response.data;
  },

  // Start model training
  startTraining: async (): Promise<TrainingStartResponse> => {
    const response = await ignisApi.post('/train');
    return response.data;
  },

  // Get training status
  getTrainingStatus: async (): Promise<TrainingStatusResponse> => {
    const response = await ignisApi.get('/train/status');
    return response.data;
  }
}; 