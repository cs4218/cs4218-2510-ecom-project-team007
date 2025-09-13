import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryForm from './CategoryForm';

describe('CategoryForm Component', () => {
  const mockHandleSubmit = jest.fn(e => e.preventDefault());
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

    expect(screen.getByPlaceholderText('Enter new category')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('displays the current value in the input field', () => {
    render(<CategoryForm {...defaultProps} value="Test Category" />);

    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
  });

  it('calls setValue when input value changes', () => {
    render(<CategoryForm {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter new category');
    fireEvent.change(input, { target: { value: 'New Category' } });

    expect(mockSetValue).toHaveBeenCalledWith('New Category');
  });

  it.each([
    ['is empty', ''],
    ['contains only whitespace', '   '],
    ['contains only tabs', '\t\t'],
  ])('disables submit button when input %s', (description, value) => {
    render(<CategoryForm {...defaultProps} value={value} />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('enables submit button when input is non-empty', () => {
    render(<CategoryForm {...defaultProps} value="Test Category" />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('calls handleSubmit when form is submitted', () => {
    render(<CategoryForm {...defaultProps} value="Test Category" />);

    fireEvent.submit(screen.getByRole('form', { name: /category form/i }));

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls handleSubmit when submit button is clicked', () => {
    render(<CategoryForm {...defaultProps} value="Test Category" />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });
});
