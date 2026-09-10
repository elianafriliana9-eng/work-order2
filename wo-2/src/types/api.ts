export type ApiErrorCode =
  | 'ERR_ASSET_NOT_FOUND'
  | 'ERR_TAG_ALREADY_EXISTS'
  | 'ERR_SERIAL_ALREADY_EXISTS'
  | 'ERR_INVALID_TRANSITION'
  | 'ERR_PIC_INACTIVE'
  | 'ERR_BAST_NOT_COMPLETED'
  | 'ERR_TOKEN_EXPIRED'
  | 'ERR_ALREADY_SIGNED'
  | 'ERR_DOCUMENT_TAMPERED'
  | 'ERR_FORBIDDEN_ROLE'
  | 'ERR_VALIDATION_FAILED'
  | 'ERR_INTERNAL_SERVER';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    correlationId: string;
    details?: ApiErrorDetail[];
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
