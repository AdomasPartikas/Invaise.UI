import { gaiaApi } from './api';

export interface PredictionRequest {
  symbol: string;
  user_id?: string;
}

export interface OptimizationRequest {
  user_id: string;
  symbols: string[];
  risk_tolerance?: number;
}

export interface WeightAdjustRequest {
  apollo_weight: number;
  ignis_weight: number;
}

export interface HeatData {
  heat_score: number;
  confidence: number;
  direction: string;
  timestamp: string;
  source: string;
  explanation: string;
  apollo_contribution: number;
  ignis_contribution: number;
}

export interface PredictionResponse {
  symbol: string;
  combined_heat: HeatData;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime: string;
}

export interface OptimizationResponse {
  portfolio: {
    symbols: string[];
    weights: number[];
    expected_return: number;
    expected_risk: number;
  };
}

export const gaiaService = {
  // Get health status
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await gaiaApi.get('/health');
    return response.data;
  },

  // Get prediction for a symbol
  getPrediction: async (request: PredictionRequest): Promise<PredictionResponse> => {
    const response = await gaiaApi.post('/predict', request);
    return response.data;
  },

  // Optimize portfolio based on symbols and risk tolerance
  optimizePortfolio: async (request: OptimizationRequest): Promise<OptimizationResponse> => {
    const response = await gaiaApi.post('/optimize', request);
    return response.data;
  },

  // Adjust weights for Apollo and Ignis models
  adjustWeights: async (request: WeightAdjustRequest): Promise<void> => {
    await gaiaApi.post('/adjust-weights', request);
  }
}; 