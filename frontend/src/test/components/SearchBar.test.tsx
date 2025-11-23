import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../../components/ui/SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    onSearch: vi.fn(),
    placeholder: 'Search...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render with placeholder', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should call onSearch with empty string on mount', () => {
    render(<SearchBar {...defaultProps} />);
    expect(defaultProps.onSearch).toHaveBeenCalledWith('');
  });

  it('should update value when typing', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');

    expect(input).toHaveValue('test');
  });

  it('should debounce search calls', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchBar {...defaultProps} debounceMs={200} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');

    // Should not be called yet (debounced)
    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1); // Only the initial call

    // Fast forward time
    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith('test');
    });
  });

  it('should call onSearch on form submit', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'search term');
    await user.keyboard('{Enter}');

    expect(defaultProps.onSearch).toHaveBeenCalledWith('search term');
  });

  it('should clear value when clear button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');

    const clearButton = screen.getByRole('button');
    await user.click(clearButton);

    expect(input).toHaveValue('');
  });

  it('should not show clear button when value is empty', () => {
    render(<SearchBar {...defaultProps} />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <SearchBar {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should use custom placeholder', () => {
    render(<SearchBar {...defaultProps} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });
});


