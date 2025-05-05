import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CreateTransactionRequest, TransactionType } from '../../types/transactions';
import { Portfolio } from '../../api/businessDomainService';

const FormContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

const SubmitButton = styled.button`
  padding: 12px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1976D2;
  }
  
  &:disabled {
    background-color: #BDBDBD;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #F44336;
  font-size: 14px;
  margin-top: 4px;
  margin-bottom: 0;
`;

interface TransactionFormProps {
  portfolios: Portfolio[];
  selectedPortfolioId?: string;
  availableSymbols: string[];
  onSubmit: (transaction: CreateTransactionRequest) => Promise<boolean>;
  onClose?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  portfolios,
  selectedPortfolioId,
  availableSymbols,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState<CreateTransactionRequest>({
    portfolioId: selectedPortfolioId || '',
    symbol: '',
    quantity: 0,
    pricePerShare: 0,
    type: TransactionType.Buy
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set selected portfolio when prop changes
  useEffect(() => {
    if (selectedPortfolioId) {
      setFormData(prev => ({ ...prev, portfolioId: selectedPortfolioId }));
    }
  }, [selectedPortfolioId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'pricePerShare' 
        ? parseFloat(value) || 0 
        : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!formData.portfolioId) {
      setError('Please select a portfolio');
      return;
    }
    
    if (!formData.symbol) {
      setError('Please select a symbol');
      return;
    }
    
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    
    if (formData.pricePerShare <= 0) {
      setError('Price per share must be greater than 0');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const success = await onSubmit(formData);
      
      if (success && onClose) {
        onClose();
      }
    } catch (err) {
      setError('An error occurred while creating the transaction');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <FormContainer>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="portfolioId">Portfolio</Label>
          <Select
            id="portfolioId"
            name="portfolioId"
            value={formData.portfolioId}
            onChange={handleChange}
            disabled={!!selectedPortfolioId}
          >
            <option value="">Select a portfolio</option>
            {portfolios.map(portfolio => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="symbol">Symbol</Label>
          <Select
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
          >
            <option value="">Select a symbol</option>
            {availableSymbols.map(symbol => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="type">Transaction Type</Label>
          <Select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value={TransactionType.Buy}>Buy</option>
            <option value={TransactionType.Sell}>Sell</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="1"
            value={formData.quantity || ''}
            onChange={handleChange}
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="pricePerShare">Price per Share ($)</Label>
          <Input
            id="pricePerShare"
            name="pricePerShare"
            type="number"
            min="0"
            step="0.01"
            value={formData.pricePerShare || ''}
            onChange={handleChange}
          />
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <SubmitButton type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Transaction'}
        </SubmitButton>
      </Form>
    </FormContainer>
  );
};

export default TransactionForm; 