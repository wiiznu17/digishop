export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409)
  }
}
