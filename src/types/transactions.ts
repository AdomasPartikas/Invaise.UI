export enum TransactionType {
  Buy = 'Buy',
  Sell = 'Sell'
}

export enum TransactionStatus {
  Failed = 'Failed',
  Canceled = 'Canceled',
  OnHold = 'OnHold',
  Succeeded = 'Succeeded'
}

export enum TransactionTrigger {
  User = 'User',
  System = 'System',
  Optimization = 'Optimization'
}

export interface Transaction {
  id: string;
  userId: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  pricePerShare: number;
  transactionValue: number;
  transactionDate: string;
  type: TransactionType;
  status: TransactionStatus;
  triggeredBy: TransactionTrigger;
  optimizationId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTransactionRequest {
  portfolioId: string;
  symbol: string;
  quantity: number;
  pricePerShare: number;
  type: TransactionType;
  transactionDate?: string;
} 