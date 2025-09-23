import { HttpStatus } from '@nestjs/common';

/**
 * Swagger reusable response schemas
 */
export const BAD_REQUEST_RESPONSE = {
  status: HttpStatus.BAD_REQUEST,
  description: 'Bad Request - Invalid input data',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      message: { type: 'string', example: 'Bad Request' },
      error: { type: 'string', example: 'Bad Request' },
    },
  },
};

export const UNAUTHORIZED_RESPONSE = {
  status: HttpStatus.UNAUTHORIZED,
  description: 'Unauthorized - Invalid or expired credentials',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Unauthorized' },
      error: { type: 'string', example: 'Unauthorized' },
    },
  },
};

export const FORBIDDEN_RESPONSE = {
  status: HttpStatus.FORBIDDEN,
  description: 'Forbidden - Insufficient permissions',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 403 },
      message: { type: 'string', example: 'Forbidden resource' },
      error: { type: 'string', example: 'Forbidden' },
    },
  },
};

export const NOT_FOUND_RESPONSE = {
  status: HttpStatus.NOT_FOUND,
  description: 'Not Found - Resource does not exist',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 404 },
      message: { type: 'string', example: 'Resource not found' },
      error: { type: 'string', example: 'Not Found' },
    },
  },
};

export const INTERNAL_SERVER_ERROR_RESPONSE = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  description: 'Internal Server Error',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 500 },
      message: { type: 'string', example: 'Internal server error' },
      error: { type: 'string', example: 'Internal Server Error' },
    },
  },
};
