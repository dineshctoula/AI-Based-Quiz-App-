import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HttpExceptionFilter intercepts and handles all thrown exceptions globally.
 * Formats errors consistently, hides internal details for 500 errors, and logs details.
 * 
 * HttpExceptionFilter ले प्रणालीमा आउने सबै exceptions लाई globally handle गर्छ।
 * यसले error response लाई एकै नासको format मा client लाई पठाउँछ र console मा log गर्छ।
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code: default to 500 Internal Server Error
    // Status code पत्ता लगाउने: default मा ५०० Internal Server Error हुन्छ
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Retrieve exception message
    // Exception को message तान्ने
    let message = 'Internal server error | आन्तरिक प्रणालीमा समस्या देखियो';
    if (exception instanceof HttpException) {
      const resContent = exception.getResponse();
      if (typeof resContent === 'object' && resContent !== null) {
        message = (resContent as any).message || exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error details with stack trace
    // stack trace सहित error details log गर्ने
    const stack = exception instanceof Error ? exception.stack : '';
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Message: ${message}`,
      stack,
    );

    // Send formatted JSON response
    // Formatted JSON response client लाई पठाउने
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message[0] : message, // Standardize validation arrays
    });
  }
}
