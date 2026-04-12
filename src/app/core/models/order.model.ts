/** Alinhado a `OrderType` / `OrderStatus` e DTOs Java (`FinancialOrderResponse`, `CreateFinancialOrderRequest`). */
export type OrderType = 'PAYABLE' | 'RECEIVABLE';
export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

export interface FinancialOrderResponse {
  id: string;
  companyId: string;
  /** `BigDecimal` serializado como número JSON. */
  amount: number;
  type: OrderType;
  status: OrderStatus;
  description: string;
  /** `LocalDateTime` do backend em ISO-8601. */
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialOrderRequest {
  type: OrderType;
  /** Mínimo **0.01** (`@DecimalMin` no backend). */
  amount: number;
  description: string;
}

export interface RejectFinancialOrderRequest {
  reason?: string;
}
