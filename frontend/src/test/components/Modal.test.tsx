import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../components/ui/Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const backdrop = screen.getByRole('dialog').parentElement;
    await user.click(backdrop!);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    await user.keyboard('{Escape}');

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    let modal = screen.getByRole('dialog');
    expect(modal.querySelector('.max-w-md')).toBeInTheDocument();

    rerender(<Modal {...defaultProps} size="lg" />);
    modal = screen.getByRole('dialog');
    expect(modal.querySelector('.max-w-2xl')).toBeInTheDocument();
  });

  it('should render footer when provided', () => {
    const footer = <button>Save</button>;
    render(<Modal {...defaultProps} footer={footer} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('should trap focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal {...defaultProps}>
        <button>Button 1</button>
        <button>Button 2</button>
      </Modal>
    );

    const buttons = screen.getAllByRole('button');
    const firstButton = buttons.find(btn => btn.textContent === 'Button 1');
    const lastButton = buttons.find(btn => btn.textContent === 'Button 2');

    // Focus should start on first focusable element
    await waitFor(() => {
      expect(document.activeElement).toBe(firstButton);
    });
  });

  it('should restore body overflow when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('unset');
  });
});


