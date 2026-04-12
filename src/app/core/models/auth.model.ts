export interface LoginRequest {
  email: string;
  password: string;
}

/** Login: o backend devolve só `acessToken` (nome do campo no Java). Mantém `accessToken?` por tolerância a proxies ou versões futuras. */
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
