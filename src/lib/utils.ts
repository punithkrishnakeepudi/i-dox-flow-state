import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUserId(): string {
  // Generate a 6-digit unique ID
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function calculateReadingTime(text: string): number {
  // Average reading speed is 200-250 words per minute
  const wordsPerMinute = 225;
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function getCharacterCount(text: string): number {
  return text.length;
}
