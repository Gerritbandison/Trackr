import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge, { getStatusVariant, getConditionVariant } from '../../components/ui/Badge';

describe('Badge', () => {
  it('should render children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('text-slate-700');
  });

  it('should apply success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    expect(container.firstChild).toHaveClass('text-success-700');
  });

  it('should apply warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    expect(container.firstChild).toHaveClass('text-accent-700');
  });

  it('should apply danger variant', () => {
    const { container } = render(<Badge variant="danger">Danger</Badge>);
    expect(container.firstChild).toHaveClass('text-red-700');
  });

  it('should apply different sizes', () => {
    const { container: smContainer } = render(<Badge size="sm">Small</Badge>);
    expect(smContainer.firstChild).toHaveClass('text-xs');

    const { container: lgContainer } = render(<Badge size="lg">Large</Badge>);
    expect(lgContainer.firstChild).toHaveClass('text-sm');
  });

  it('should capitalize text', () => {
    const { container } = render(<Badge>lowercase text</Badge>);
    expect(container.firstChild).toHaveClass('capitalize');
  });
});

describe('getStatusVariant', () => {
  it('should return correct variant for status', () => {
    expect(getStatusVariant('active')).toBe('success');
    expect(getStatusVariant('available')).toBe('success');
    expect(getStatusVariant('assigned')).toBe('info');
    expect(getStatusVariant('inactive')).toBe('gray');
    expect(getStatusVariant('repair')).toBe('warning');
    expect(getStatusVariant('expired')).toBe('danger');
    expect(getStatusVariant('unknown')).toBe('gray');
  });

  it('should handle case insensitive status', () => {
    expect(getStatusVariant('ACTIVE')).toBe('success');
    expect(getStatusVariant('Active')).toBe('success');
  });

  it('should return gray for null or undefined', () => {
    expect(getStatusVariant(null)).toBe('gray');
    expect(getStatusVariant(undefined)).toBe('gray');
  });
});

describe('getConditionVariant', () => {
  it('should return correct variant for condition', () => {
    expect(getConditionVariant('excellent')).toBe('success');
    expect(getConditionVariant('good')).toBe('info');
    expect(getConditionVariant('fair')).toBe('warning');
    expect(getConditionVariant('poor')).toBe('danger');
    expect(getConditionVariant('damaged')).toBe('danger');
    expect(getConditionVariant('unknown')).toBe('gray');
  });

  it('should handle case insensitive condition', () => {
    expect(getConditionVariant('EXCELLENT')).toBe('success');
    expect(getConditionVariant('Excellent')).toBe('success');
  });
});

