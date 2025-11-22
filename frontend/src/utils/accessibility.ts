/**
 * Accessibility utility functions
 */

type AriaLivePriority = 'polite' | 'assertive';

/**
 * Announce a message to screen readers
 * 
 * Creates a temporary ARIA live region to announce messages to assistive technologies.
 * 
 * @param {string} message - Message to announce
 * @param {AriaLivePriority} [priority='polite'] - Priority level ('polite' or 'assertive')
 * @example
 * ```typescript
 * announceToScreenReader('Form submitted successfully', 'polite');
 * announceToScreenReader('Error: Invalid input', 'assertive');
 * ```
 */
export const announceToScreenReader = (message: string, priority: AriaLivePriority = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (announcement.parentNode) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

/**
 * Trap focus within an element (for modals and dialogs)
 * 
 * Implements focus trapping so keyboard navigation stays within the specified element.
 * Returns a cleanup function to remove the event listener.
 * 
 * @param {HTMLElement} element - Element to trap focus within
 * @returns {Function} Cleanup function to remove focus trap
 * @example
 * ```typescript
 * const cleanup = trapFocus(modalElement);
 * // Later, when closing modal:
 * cleanup();
 * ```
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTab = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleTab);
  
  return () => {
    element.removeEventListener('keydown', handleTab);
  };
};

/**
 * Skip to main content link
 */
export const createSkipLink = (): void => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
};

/**
 * ARIA label helpers
 */
export const getARIALabel = (element: HTMLElement): string | null => {
  return element.getAttribute('aria-label') || 
         element.getAttribute('aria-labelledby') ||
         element.textContent?.trim() ||
         null;
};

/**
 * Check if element is visible to screen readers
 */
export const isVisibleToScreenReader = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         element.getAttribute('aria-hidden') !== 'true';
};

/**
 * Keyboard navigation helpers
 */
export const handleKeyboardNavigation = (
  items: HTMLElement[],
  onSelect?: (item: HTMLElement) => void
): ((e: KeyboardEvent) => void) => {
  return (e: KeyboardEvent): void => {
    const currentIndex = items.findIndex(item => item === document.activeElement);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex]?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0 && items[currentIndex]) {
          onSelect?.(items[currentIndex]);
        }
        break;
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  };
};

/**
 * Color contrast checker
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

const getLuminance = (color: string): number => {
  const rgb = hexToRgb(color);
  const [r = 0, g = 0, b = 0] = rgb;
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;
  const rLuminance = normalizedR <= 0.03928 ? normalizedR / 12.92 : Math.pow((normalizedR + 0.055) / 1.055, 2.4);
  const gLuminance = normalizedG <= 0.03928 ? normalizedG / 12.92 : Math.pow((normalizedG + 0.055) / 1.055, 2.4);
  const bLuminance = normalizedB <= 0.03928 ? normalizedB / 12.92 : Math.pow((normalizedB + 0.055) / 1.055, 2.4);
  return 0.2126 * rLuminance + 0.7152 * gLuminance + 0.0722 * bLuminance;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  const r = result[1];
  const g = result[2];
  const b = result[3];
  if (!r || !g || !b) return [0, 0, 0];
  return [
    parseInt(r, 16),
    parseInt(g, 16),
    parseInt(b, 16)
  ];
};

/**
 * Announce form errors
 */
export const announceFormErrors = (errors: Record<string, unknown>): void => {
  const errorCount = Object.keys(errors).length;
  if (errorCount > 0) {
    announceToScreenReader(
      `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please review and correct.`,
      'assertive'
    );
  }
};

export default {
  announceToScreenReader,
  trapFocus,
  createSkipLink,
  getARIALabel,
  isVisibleToScreenReader,
  handleKeyboardNavigation,
  getContrastRatio,
  announceFormErrors,
};

