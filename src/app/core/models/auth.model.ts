export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  acessToken?: string;
  accessToken?: string;
  tokenType: string;
  expiresInMinutes: number;
}

export interface RegisterRequest {
  companyName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  companyId: string;
  email: string;
  accessToken: string;
  tokenType: string;
  expiresInMinutes: number;
}
