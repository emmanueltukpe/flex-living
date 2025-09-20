import {
  ValidationError,
  ValidationErrorItem,
  ValidationResult,
  FieldValidationRules,
} from "../types/validation";

export abstract class BaseService {
  protected validateData(
    data: any,
    rules: FieldValidationRules
  ): ValidationResult {
    const errors: ValidationErrorItem[] = [];

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const value = data[fieldName];
      const fieldErrors = this.validateField(fieldName, value, fieldRules);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateField(
    fieldName: string,
    value: unknown,
    rules: any
  ): ValidationErrorItem[] {
    const errors: ValidationErrorItem[] = [];

    // Required validation
    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        value,
      });
      return errors; // If required and missing, skip other validations
    }

    // Skip other validations if value is not provided and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    if (rules.type) {
      const typeError = this.validateType(fieldName, value, rules.type);
      if (typeError) {
        errors.push(typeError);
        return errors; // If type is wrong, skip other validations
      }
    }

    // String validations
    if (typeof value === "string") {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rules.minLength} characters long`,
          value,
        });
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${rules.maxLength} characters long`,
          value,
        });
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} format is invalid`,
          value,
        });
      }
    }

    // Number validations
    if (typeof value === "number") {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rules.min}`,
          value,
        });
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${rules.max}`,
          value,
        });
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value as string | number)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be one of: ${rules.enum.join(", ")}`,
        value,
      });
    }

    return errors;
  }

  private validateType(
    fieldName: string,
    value: unknown,
    expectedType: string
  ): ValidationErrorItem | null {
    let isValidType = false;

    switch (expectedType) {
      case "string":
        isValidType = typeof value === "string";
        break;
      case "number":
        isValidType = typeof value === "number" && !isNaN(value);
        break;
      case "boolean":
        isValidType = typeof value === "boolean";
        break;
      case "date":
        isValidType =
          value instanceof Date ||
          (typeof value === "string" && !isNaN(Date.parse(value)));
        break;
      case "array":
        isValidType = Array.isArray(value);
        break;
      case "object":
        isValidType =
          typeof value === "object" && value !== null && !Array.isArray(value);
        break;
      default:
        isValidType = true; // Unknown type, skip validation
    }

    if (!isValidType) {
      return {
        field: fieldName,
        message: `${fieldName} must be of type ${expectedType}`,
        value,
      };
    }

    return null;
  }

  protected throwValidationError(errors: ValidationErrorItem[]): never {
    throw new ValidationError(errors);
  }

  protected parseDate(dateValue: string | Date): Date {
    if (dateValue instanceof Date) {
      return dateValue;
    }

    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${dateValue}`);
    }

    return parsed;
  }

  protected parseNumber(value: string | number): number {
    if (typeof value === "number") {
      return value;
    }

    const parsed = Number(value);
    if (isNaN(parsed)) {
      throw new Error(`Invalid number format: ${value}`);
    }

    return parsed;
  }

  protected parseBoolean(value: string | boolean): boolean {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }

    return Boolean(value);
  }

  protected sanitizeString(value: string): string {
    return value.trim();
  }

  protected calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }
}
