import React from 'react';
import { Transaction, TransactionStatus, TransactionType, TransactionTrigger } from '../../types/transactions';
import styled from 'styled-components';

interface CardContainerProps {
  status: TransactionStatus | string;
  isOptimization?: boolean;
}

const CardContainer = styled.div<CardContainerProps>`
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  background-color: ${({ isOptimization }) => isOptimization ? '#f9f9ff' : 'white'};
  border-left: 5px solid 
    ${({ status }) => {
      switch (status) {
        case 'Succeeded':
          return '#008000'; // Green
        case 'Failed':
          return '#F44336'; // Red
        case 'Canceled':
          return '#9E9E9E'; // Gray
        case 'OnHold':
          return '#FFC107'; // Amber
        default:
          return '#2196F3'; // Blue
      }
    }};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Symbol = styled.h3`
  margin: 0;
  font-size: 18px;
`;

interface StatusProps {
  status: TransactionStatus | string;
}

const Status = styled.span<StatusProps>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  background-color: ${({ status }) => {
    switch (status) {
      case 'Succeeded':
        return '#4CAF50'; // Green
      case 'Failed':
        return '#F44336'; // Red
      case 'Canceled':
        return '#9E9E9E'; // Gray
      case 'OnHold':
        return '#FFC107'; // Amber
      default:
        return '#2196F3'; // Blue
    }
  }};
`;

const Details = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  font-size: 12px;
  color: #757575;
`;

const Value = styled.span`
  font-size: 14px;
`;

const OptimizationTag = styled.div`
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background-color: #f0f0f0;
  cursor: pointer;
  
  &:hover {
    background-color: #e0e0e0;
  }

  &:disabled {
    background-color: #f0f0f0;
    color: #bdbdbd;
    cursor: not-allowed;
  }
`;

interface TransactionCardProps {
  transaction: Transaction;
  onCancel?: (transactionId: string) => void;
  onCancelOptimization?: (optimizationId: string) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onCancel, onCancelOptimization }) => {
  const formattedDate = new Date(transaction.transactionDate).toLocaleDateString();
  const formattedTime = new Date(transaction.transactionDate).toLocaleTimeString();
  
  const isOptimizationTransaction = transaction.triggeredBy === TransactionTrigger.Optimization;
  
  const handleCancel = () => {
    if (isOptimizationTransaction && transaction.optimizationId && onCancelOptimization) {
      onCancelOptimization(transaction.optimizationId);
    } else if (onCancel) {
      onCancel(transaction.id);
    }
  };

  const getOptimizationId = () => {
    if (transaction.optimizationId) {
      // Show only first 8 characters of the ID
      return transaction.optimizationId.substring(0, 8) + '...';
    }
    return null;
  };
  
  return (
    <CardContainer status={transaction.status} isOptimization={isOptimizationTransaction}>
      <Header>
        <Symbol>{transaction.symbol}</Symbol>
        <Status status={transaction.status}>{transaction.status}</Status>
      </Header>
      
      <Details>
        <DetailItem>
          <Label>Type</Label>
          <Value>{transaction.type}</Value>
        </DetailItem>
        <DetailItem>
          <Label>Quantity</Label>
          <Value>{transaction.quantity}</Value>
        </DetailItem>
        <DetailItem>
          <Label>Price per Share</Label>
          <Value>${transaction.pricePerShare.toFixed(2)}</Value>
        </DetailItem>
        <DetailItem>
          <Label>Total Value</Label>
          <Value>${transaction.transactionValue.toFixed(2)}</Value>
        </DetailItem>
        <DetailItem>
          <Label>Date</Label>
          <Value>{formattedDate}</Value>
        </DetailItem>
        <DetailItem>
          <Label>Time</Label>
          <Value>{formattedTime}</Value>
        </DetailItem>
        <DetailItem>
          <Label>Triggered By</Label>
          <Value>{transaction.triggeredBy}</Value>
        </DetailItem>
        {isOptimizationTransaction && (
          <DetailItem>
            <Label>Optimization ID</Label>
            <Value>{getOptimizationId()}</Value>
          </DetailItem>
        )}
      </Details>
      
      {isOptimizationTransaction && (
        <OptimizationTag>Part of Portfolio Optimization</OptimizationTag>
      )}
      
      {transaction.status === 'OnHold' && (
        <Actions>
          <ActionButton 
            onClick={handleCancel}
            disabled={isOptimizationTransaction && !onCancelOptimization}
            title={isOptimizationTransaction ? "Optimization transactions can only be canceled through the portfolio optimization page" : ""}
          >
            {isOptimizationTransaction ? "Cancel Optimization" : "Cancel"}
          </ActionButton>
        </Actions>
      )}
    </CardContainer>
  );
};

export default TransactionCard; 