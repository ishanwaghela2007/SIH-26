export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userId?: string;
  user_id?: string;
  email: string;
  role: string;
}

export interface AuthClient {
  validateToken(request: {
    accessToken: string;
  }): import('rxjs').Observable<ValidateTokenResponse>;
}
