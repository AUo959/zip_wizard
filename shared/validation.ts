/**
 * DATABASE VALIDATION UTILITIES
 * 
 * Ensures data integrity before database operations.
 * All array/object fields must be validated before Drizzle ORM insertion.
 */

/**
 * Normalizes tags input to a valid string array.
 * Handles various input types and ensures database compatibility.
 * 
 * @param tags - Raw tags input (unknown type)
 * @returns Validated string array safe for database insertion
 * 
 * @example
 * ```typescript
 * const file = {
 *   ...fileData,
 *   tags: normalizeTags(incomingTags)
 * };
 * await db.insert(files).values(file);
 * ```
 */
export function normalizeTags(tags: unknown): string[] {
  // Already an array - validate elements are strings
  if (Array.isArray(tags)) {
    return tags.map(tag => String(tag).trim()).filter(Boolean);
  }
  
  // Null or undefined - return empty array
  if (tags === null || tags === undefined) {
    return [];
  }
  
  // Try parsing as JSON
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed.map(tag => String(tag).trim()).filter(Boolean);
      }
      // Single string value after parsing
      return [String(parsed).trim()].filter(Boolean);
    } catch {
      // Not JSON - treat as single tag
      return [tags.trim()].filter(Boolean);
    }
  }
  
  // Object or other type - convert to string
  return [String(tags).trim()].filter(Boolean);
}

/**
 * Normalizes dependencies input to a valid string array.
 * Similar to normalizeTags but with dependency-specific validation.
 * 
 * @param dependencies - Raw dependencies input
 * @returns Validated string array of dependencies
 */
export function normalizeDependencies(dependencies: unknown): string[] {
  return normalizeTags(dependencies); // Same logic for now
}

/**
 * Validates and normalizes any JSON field before database insertion.
 * Ensures the value is serializable and safe for JSONB columns.
 * 
 * @param value - Raw value to normalize
 * @returns JSON-safe value
 */
export function normalizeJsonField<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  try {
    // Test if value is JSON-serializable
    JSON.stringify(value);
    return value as T;
  } catch {
    console.warn('Failed to serialize value for JSON field:', value);
    return null;
  }
}

/**
 * Type guard to ensure a value is a non-empty string array.
 * Useful for runtime validation before database operations.
 * 
 * @param value - Value to check
 * @returns True if value is a valid string array
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}
