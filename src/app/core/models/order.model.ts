export type OrderType = 'PAYABLE' | 'RECEIVABLE';
export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

export interface FinancialOrderResponse {
  id: string;
  companyId: string;
  amount: number;
  type: OrderType;
  status: OrderStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialOrderRequest {
  type: OrderType;
  amount: number;
  description: string;
}

export interface RejectFinancialOrderRequest {
  reason?: string;
}
