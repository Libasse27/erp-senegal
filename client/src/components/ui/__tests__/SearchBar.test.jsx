import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '../SearchBar';

// Mock the useDebounce hook
jest.mock('../../../hooks/useDebounce', () => {
  return jest.fn((value) => value);
});

describe('SearchBar', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders search input', () => {
      render(<SearchBar onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders search icon', () => {
      const { container } = render(<SearchBar onChange={mockOnChange} />);

      // Search icon should be present
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders custom placeholder', () => {
      render(<SearchBar onChange={mockOnChange} placeholder="Rechercher un client..." />);

      expect(screen.getByPlaceholderText('Rechercher un client...')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);

      const input = screen.getByDisplayValue('test');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Input handling', () => {
    it('updates input value when typing', () => {
      render(<SearchBar onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: 'test search' } });

      expect(input).toHaveValue('test search');
    });

    it('calls onChange with debounced value', async () => {
      const useDebounce = require('../../../hooks/useDebounce');
      useDebounce.mockImplementation((value, delay) => {
        const [debouncedValue, setDebouncedValue] = React.useState(value);
        React.useEffect(() => {
          const handler = setTimeout(() => setDebouncedValue(value), delay);
          return () => clearTimeout(handler);
        }, [value, delay]);
        return debouncedValue;
      });

      render(<SearchBar onChange={mockOnChange} delay={100} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith('test');
        },
        { timeout: 200 }
      );
    });

    it('does not call onChange if debounced value equals current value', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);

      // Input already has value "test", typing same value should not trigger onChange
      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Clear button', () => {
    it('shows clear button when there is input', () => {
      render(<SearchBar onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByRole('button');
      expect(clearButton).toBeInTheDocument();
    });

    it('does not show clear button when input is empty', () => {
      render(<SearchBar onChange={mockOnChange} />);

      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('clears input when clicking clear button', () => {
      render(<SearchBar onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByRole('button');
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
    });

    it('calls onChange with empty string when clearing', () => {
      render(<SearchBar onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByRole('button');
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Value synchronization', () => {
    it('updates internal state when value prop changes', () => {
      const { rerender } = render(<SearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      expect(input).toHaveValue('');

      rerender(<SearchBar value="new value" onChange={mockOnChange} />);
      expect(input).toHaveValue('new value');
    });
  });

  describe('Default delay', () => {
    it('uses default delay of 300ms when not specified', () => {
      const useDebounce = require('../../../hooks/useDebounce');

      render(<SearchBar onChange={mockOnChange} />);

      // Check if useDebounce was called with default delay
      expect(useDebounce).toHaveBeenCalledWith('', 300);
    });

    it('uses custom delay when specified', () => {
      const useDebounce = require('../../../hooks/useDebounce');

      render(<SearchBar onChange={mockOnChange} delay={500} />);

      expect(useDebounce).toHaveBeenCalledWith('', 500);
    });
  });
});
