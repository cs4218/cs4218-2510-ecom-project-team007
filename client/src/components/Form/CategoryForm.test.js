import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryForm from './CategoryForm';

describe('CategoryForm Component', () => {
  const mockHandleSubmit = jest.fn();
  const mockSetValue = jest.fn();

  const defaultProps = {
    handleSubmit: mockHandleSubmit,
    value: '',
    setValue: mockSetValue,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with input and submit button', () => {
    render(<CategoryForm {...defaultProps} />);

    expect(screen.getByRole('form', { name: 'Category form' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new category')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('displays the current value in the input field', () => {
    const value = 'Electronics';

    render(<CategoryForm {...defaultProps} value={value} />);

    expect(screen.getByPlaceholderText('Enter new category')).toHaveValue(value);
  });

  it('calls setValue when input value changes', () => {
    const newValue = 'Books';

    render(<CategoryForm {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter new category');
    fireEvent.change(input, { target: { value: newValue } });

    expect(mockSetValue).toHaveBeenCalledWith(newValue);
  });

  it.each([
    ['is empty', ''],
    ['contains only whitespace', '   '],
  ])('disables submit button when input %s', (_, value) => {
    render(<CategoryForm {...defaultProps} value={value} />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('enables submit button when input is non-empty', () => {
    render(<CategoryForm {...defaultProps} value="Test Category" />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('calls handleSubmit when form is submitted', () => {
    render(<CategoryForm {...defaultProps} value="Electronics" />);

    fireEvent.submit(screen.getByRole('form', { name: 'Category form' }));

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });
});
