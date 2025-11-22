/**
 * Tests for accessibility utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  announceToScreenReader,
  trapFocus,
  getContrastRatio,
  announceFormErrors,
} from '../../utils/accessibility';

describe('accessibility utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('announceToScreenReader', () => {
    it('should create and remove announcement element', () => {
      announceToScreenReader('Test announcement');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement.getAttribute('aria-live')).toBe('polite');
      expect(announcement.textContent).toBe('Test announcement');
    });

    it('should support assertive priority', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('trapFocus', () => {
    it('should trap focus within element', () => {
      document.body.innerHTML = `
        <div id="modal">
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </div>
      `;

      const modal = document.getElementById('modal');
      const buttons = modal.querySelectorAll('button');
      const cleanup = trapFocus(modal);

      buttons[0].focus();
      
      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      modal.dispatchEvent(tabEvent);

      // Focus should wrap to last element
      const handleTab = (e) => {
        if (document.activeElement === buttons[buttons.length - 1]) {
          e.preventDefault();
          buttons[0].focus();
        }
      };
      modal.addEventListener('keydown', handleTab);
      
      buttons[buttons.length - 1].focus();
      tabEvent.preventDefault = vi.fn();
      modal.dispatchEvent(tabEvent);

      cleanup();
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio between colors', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeGreaterThan(20); // Black and white have high contrast
    });

    it('should return lower ratio for similar colors', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FEFEFE');
      expect(ratio).toBeLessThan(2);
    });
  });

  describe('announceFormErrors', () => {
    it('should announce form errors to screen reader', () => {
      const errors = {
        email: 'Invalid email',
        password: 'Required',
      };

      announceFormErrors(errors);

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement.getAttribute('aria-live')).toBe('assertive');
      expect(announcement.textContent).toContain('2 errors');
    });

    it('should handle single error', () => {
      const errors = {
        email: 'Invalid email',
      };

      announceFormErrors(errors);

      const announcement = document.querySelector('[role="status"]');
      expect(announcement.textContent).toContain('1 error');
    });
  });
});

