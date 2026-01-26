/**
 * Font utility functions for loading and managing Google Fonts
 */

/**
 * Normalizes a font name for use in Google Fonts URLs
 * Converts "Open Sans" to "Open+Sans"
 */
export function normalizeFontName(fontName: string): string {
  return fontName.replace(/\s+/g, '+');
}

/**
 * Generates a Google Fonts API URL for multiple fonts
 * @param fonts Array of font names
 * @param weights Font weights to load (default: 400, 600)
 * @returns Google Fonts CSS URL
 */
export function getGoogleFontsUrl(fonts: string[], weights: number[] = [400, 600]): string {
  if (fonts.length === 0) return '';
  
  const normalizedFonts = fonts.map(font => {
    const normalized = normalizeFontName(font);
    return `family=${normalized}:wght@${weights.join(';')}`;
  });
  
  const weightsParam = weights.join(';');
  return `https://fonts.googleapis.com/css2?${normalizedFonts.join('&')}&display=swap`;
}

/**
 * Loads a Google Font by creating a link element and adding it to the document head
 * @param fontName Font name to load
 * @param weights Font weights to load (default: 400, 600)
 * @returns Promise that resolves when font is loaded
 */
export async function loadFont(fontName: string, weights: number[] = [400, 600]): Promise<void> {
  // Check if font is already loaded
  const fontId = `font-${normalizeFontName(fontName)}`;
  const existingLink = document.getElementById(fontId);
  if (existingLink) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = getGoogleFontsUrl([fontName], weights);
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${fontName}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Loads multiple fonts from Google Fonts
 * @param fonts Array of font names to load
 * @param weights Font weights to load (default: 400, 600)
 * @returns Promise that resolves when all fonts are loaded
 */
export async function loadFonts(fonts: string[], weights: number[] = [400, 600]): Promise<void> {
  if (fonts.length === 0) return Promise.resolve();
  
  // Load all fonts in a single request for better performance
  const fontId = `fonts-${fonts.map(normalizeFontName).join('-')}`;
  const existingLink = document.getElementById(fontId);
  if (existingLink) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = getGoogleFontsUrl(fonts, weights);
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load fonts: ${fonts.join(', ')}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Gets the CSS font-family value for a font name
 * Handles common font name variations and adds fallbacks
 */
export function getFontFamily(fontName: string): string {
  // Normalize common variations
  const normalized = normalizeFontName(fontName).replace(/\+/g, ' ');
  return `"${normalized}", ${getSystemFallback(fontName)}`;
}

/**
 * Returns an appropriate system font fallback based on font characteristics
 */
function getSystemFallback(fontName: string): string {
  const lower = fontName.toLowerCase();
  
  // Monospace fonts
  if (lower.includes('mono') || lower.includes('code')) {
    return 'monospace';
  }
  
  // Serif fonts
  if (lower.includes('serif') || lower.includes('times') || lower.includes('georgia')) {
    return 'serif';
  }
  
  // Default to sans-serif
  return 'sans-serif';
}
