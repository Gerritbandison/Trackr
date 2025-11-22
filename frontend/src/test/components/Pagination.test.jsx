import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../../components/ui/Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render current page and total pages', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText(/Page 1 of 10/i)).toBeInTheDocument();
  });

  it('should call onPageChange when next button is clicked', async () => {
    const user = userEvent.setup();
    render(<Pagination {...defaultProps} />);

    const nextButton = screen.getByText('Next →');
    await user.click(nextButton);

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when previous button is clicked', async () => {
    const user = userEvent.setup();
    render(<Pagination {...defaultProps} currentPage={2} />);

    const prevButton = screen.getByText(/← Previous/i);
    await user.click(prevButton);

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('should disable previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    const prevButton = screen.getAllByText(/← Previous/i)[0];
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} />);
    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeDisabled();
  });

  it('should render page numbers', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should call onPageChange when page number is clicked', async () => {
    const user = userEvent.setup();
    render(<Pagination {...defaultProps} currentPage={5} />);

    const pageButton = screen.getByText('3');
    await user.click(pageButton);

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);
  });

  it('should highlight current page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    const currentPageButton = screen.getByText('5');
    expect(currentPageButton).toHaveClass('bg-gradient-to-r');
  });

  it('should show ellipsis when there are many pages', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={20} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('should show first page button when not on first page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show last page button when not on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should handle single page', () => {
    render(<Pagination {...defaultProps} currentPage={1} totalPages={1} />);
    expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
    expect(screen.getAllByText(/← Previous/i)[0]).toBeDisabled();
    expect(screen.getByText('Next →')).toBeDisabled();
  });
});

