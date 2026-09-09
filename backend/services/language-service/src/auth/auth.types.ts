export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user_id: string;
  email: string;
  role: string;
}

export interface AuthClient {
  validateToken(request: {
    access_token: string;
  }): import('rxjs').Observable<ValidateTokenResponse>;
}
