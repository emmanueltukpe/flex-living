import { Request, Response, NextFunction } from "express";
import { ApiResponse, ApiErrorResponse } from "../types";
import {
  ValidationError,
  ValidationErrorItem,
  NotFoundError,
  DatabaseError,
  ExternalApiError,
} from "../types/validation";

export abstract class BaseController {
  protected sendSuccess<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      status: "success",
      data,
      message,
    };
    res.status(statusCode).json(response);
  }

  protected sendError(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: string
  ): void {
    const response: ApiErrorResponse = {
      status: "error",
      message,
      error,
    };
    res.status(statusCode).json(response);
  }

  protected handleError(error: Error, res: Response): void {
    if (error instanceof ValidationError) {
      this.sendError(
        res,
        "Validation failed",
        400,
        JSON.stringify(error.errors)
      );
      return;
    }

    if (error instanceof NotFoundError) {
      this.sendError(res, error.message, 404);
      return;
    }

    if (error instanceof DatabaseError) {
      this.sendError(res, error.message, 500);
      return;
    }

    if (error instanceof ExternalApiError) {
      this.sendError(res, error.message, 502);
      return;
    }

    // Generic error handling
    this.sendError(res, error.message || "Internal server error", 500);
  }

  protected asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        this.handleError(error, res);
      });
    };
  }

  protected parseQueryParams(query: any): Record<string, unknown> {
    const parsed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        parsed[key] = value;
      }
    }

    return parsed;
  }

  protected parseNumericParam(
    value: string | undefined,
    defaultValue?: number
  ): number | undefined {
    if (!value) return defaultValue;

    const parsed = Number(value);
    if (isNaN(parsed)) {
      throw new ValidationError([
        {
          field: "query",
          message: `Invalid numeric value: ${value}`,
          value,
        },
      ]);
    }

    return parsed;
  }

  protected parseBooleanParam(value: string | undefined): boolean | undefined {
    if (!value) return undefined;

    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    throw new ValidationError([
      {
        field: "query",
        message: `Invalid boolean value: ${value}. Expected 'true' or 'false'`,
        value,
      },
    ]);
  }

  protected validateRequiredParam(value: unknown, paramName: string): void {
    if (value === undefined || value === null || value === "") {
      throw new ValidationError([
        {
          field: paramName,
          message: `${paramName} is required`,
          value,
        },
      ]);
    }
  }

  protected validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new ValidationError([
        {
          field: "id",
          message: "Valid ID is required",
          value: id,
        },
      ]);
    }
  }

  protected sanitizeInput(input: any): any {
    if (typeof input === "string") {
      return input.trim();
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeInput(item));
    }

    if (typeof input === "object" && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  protected extractPaginationParams(query: any): {
    page: number;
    limit: number;
  } {
    const page = this.parseNumericParam(query.page, 1);
    const limit = this.parseNumericParam(query.limit, 20);

    if (page && page < 1) {
      throw new ValidationError([
        {
          field: "page",
          message: "Page must be greater than 0",
          value: page,
        },
      ]);
    }

    if (limit && (limit < 1 || limit > 100)) {
      throw new ValidationError([
        {
          field: "limit",
          message: "Limit must be between 1 and 100",
          value: limit,
        },
      ]);
    }

    return {
      page: page || 1,
      limit: limit || 20,
    };
  }

  protected extractSortParams(
    query: any,
    defaultSortBy: string = "createdAt"
  ): {
    sortBy: string;
    order: "asc" | "desc";
  } {
    const sortBy = query.sortBy || defaultSortBy;
    const order = query.order === "asc" ? "asc" : "desc";

    return { sortBy, order };
  }

  protected extractDateRangeParams(query: any): {
    startDate?: string;
    endDate?: string;
  } {
    const { startDate, endDate } = query;

    if (startDate && isNaN(Date.parse(startDate))) {
      throw new ValidationError([
        {
          field: "startDate",
          message: "Invalid start date format",
          value: startDate,
        },
      ]);
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      throw new ValidationError([
        {
          field: "endDate",
          message: "Invalid end date format",
          value: endDate,
        },
      ]);
    }

    return { startDate, endDate };
  }
}
