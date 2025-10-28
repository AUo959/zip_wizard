import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of a string and lowercases the rest.
 * Useful for formatting status strings and enums for display.
 * 
 * @param str - The string to capitalize
 * @returns The capitalized string
 * 
 * @example
 * capitalizeFirst('loading') // 'Loading'
 * capitalizeFirst('in_progress') // 'In_progress'
 */
export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
