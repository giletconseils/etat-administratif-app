// Utilitaires pour la gestion des erreurs

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'API_ERROR');
  }
}

// Fonction pour valider les paramètres d'entrée
export function validateSirets(sirets: unknown): string[] {
  if (!Array.isArray(sirets)) {
    throw new ValidationError('sirets must be an array');
  }

  // Permettre un tableau vide pour analyser toute la base
  if (sirets.length === 0) {
    return []; // Retourner un tableau vide au lieu de lever une erreur
  }

  return sirets.filter(siret => {
    if (typeof siret !== 'string') return false;
    const cleaned = siret.replace(/[^0-9]/g, '');
    return cleaned.length === 14 && /^\d{14}$/.test(cleaned);
  });
}

export function validatePhones(phones: unknown): string[] {
  if (!Array.isArray(phones)) {
    throw new ValidationError('phones must be an array');
  }

  if (phones.length === 0) {
    throw new ValidationError('phones array cannot be empty');
  }

  return phones.filter(phone => {
    if (typeof phone !== 'string') return false;
    const cleaned = phone.replace(/[^0-9+]/g, '');
    return /^(\+33|33|0)[1-9]\d{8}$/.test(cleaned) || /^[1-9]\d{8}$/.test(cleaned);
  });
}

export function validateEnabledStatuses(enabledStatuses: unknown): Record<string, boolean> {
  if (!enabledStatuses || typeof enabledStatuses !== 'object') {
    throw new ValidationError('enabledStatuses must be an object');
  }

  const validStatuses = ['TR', 'U1', 'U1P', 'U2', 'U3', 'U4'];
  const result: Record<string, boolean> = {};

  for (const status of validStatuses) {
    result[status] = Boolean((enabledStatuses as Record<string, boolean>)[status]);
  }

  // Vérifier qu'au moins un statut est activé
  if (!Object.values(result).some(Boolean)) {
    throw new ValidationError('At least one status must be enabled');
  }

  return result;
}

// Fonction pour créer une réponse d'erreur standardisée
export function createErrorResponse(error: unknown, defaultMessage: string = 'Internal server error') {
  if (error instanceof AppError) {
    return {
      error: error.code,
      message: error.message,
      statusCode: error.statusCode
    };
  }

  if (error instanceof Error) {
    return {
      error: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500
    };
  }

  return {
    error: 'UNKNOWN_ERROR',
    message: defaultMessage,
    statusCode: 500
  };
}

// Fonction pour logger les erreurs
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const errorInfo = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack
  } : { error: String(error) };

  console.error(`[${timestamp}] ${context ? `[${context}] ` : ''}Error:`, errorInfo);
}

// Fonction pour gérer les erreurs de manière centralisée
export function handleApiError(error: unknown, context?: string) {
  logError(error, context);
  
  const errorResponse = createErrorResponse(error);
  
  return {
    status: errorResponse.statusCode,
    body: {
      error: errorResponse.error,
      message: errorResponse.message
    }
  };
}
