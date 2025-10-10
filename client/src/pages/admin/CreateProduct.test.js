import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { productSchema } from '../../schemas/productSchema';
import { validateProductPhoto } from '../../utils/photoValidation';
import CreateProduct from './CreateProduct';

jest.mock('antd', () => ({
  Select: jest.fn(({ placeholder, onChange, options }) => (
    <select
      aria-label={placeholder}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )),
}));

jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../components/AdminMenu', () =>
  jest.fn(() => <div>Admin Menu</div>)
);

jest.mock('../../components/Layout', () =>
  jest.fn(({ children, title }) => <div title={title}>{children}</div>)
);

jest.mock('../../schemas/productSchema', () => ({
  productSchema: {
    validate: jest.fn(),
  },
}));

jest.mock('../../utils/photoValidation', () => ({
  validateProductPhoto: jest.fn(),
}));

describe('CreateProduct Component', () => {
  const mockCategories = [
    { _id: '1', name: 'Electronics' },
    { _id: '2', name: 'Books' },
    { _id: '3', name: 'Clothing' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { category: mockCategories } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the component with all form fields', async () => {
    render(<CreateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    });

    expect(screen.getByRole('heading', { name: 'Create Product' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Select a category' })).toBeInTheDocument();
    expect(screen.getByLabelText('Upload photo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter product description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter quantity')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Select shipping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
  });

  it('displays existing categories in the category dropdown menu', async () => {
    render(<CreateProduct />);

    await screen.findByRole('option', { name: mockCategories[0].name });

    mockCategories.forEach(({ name }) => {
      expect(screen.getByRole('option', { name })).toBeInTheDocument();
    });
  });

  it('shows an error message when fetching categories fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.get.mockRejectedValue(new Error('Request failed'));

    render(<CreateProduct />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load categories');
    });
  });

  describe('Photo Upload', () => {
    it('displays the file name of the selected photo', async () => {
      global.URL.createObjectURL = jest.fn();
      validateProductPhoto.mockReturnValue(null);

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      render(<CreateProduct />);

      const input = await screen.findByLabelText('Upload photo');
      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    it('displays a preview of the selected photo', async () => {
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      validateProductPhoto.mockReturnValue(null);

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      render(<CreateProduct />);

      const input = await screen.findByLabelText('Upload photo');
      fireEvent.change(input, { target: { files: [file] } });

      const img = screen.getByAltText('Preview');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'mock-url');
    });

    it('shows an error message when photo validation fails', async () => {
      validateProductPhoto.mockReturnValue('Invalid file type');

      const file = new File([''], 'test.txt', { type: 'text/plain' });

      render(<CreateProduct />);

      const input = await screen.findByLabelText('Upload photo');
      fireEvent.change(input, { target: { files: [file] } });

      expect(toast.error).toHaveBeenCalled();
      expect(input).toHaveValue('');
    });
  });

  describe('Form Validation', () => {
    it('shows only the first error message when multiple fields are invalid', async () => {
      const validationError = {
        errors: ['Category is required', 'Price is required', 'Quantity is required'],
      };
      productSchema.validate.mockRejectedValue(validationError);

      render(<CreateProduct />);

      const createButton = await screen.findByRole('button', { name: /create product/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(validationError.errors[0]);
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Create Product', () => {
    const mockNavigate = jest.fn();

    const fillProductForm = async () => {
      await screen.findByRole('option', { name: mockCategories[0].name });

      fireEvent.change(screen.getByRole('combobox', { name: 'Select a category' }), {
        target: { value: 'Electronics' },
      });

      fireEvent.change(screen.getByPlaceholderText('Enter product name'), {
        target: { value: 'Laptop' },
      });

      fireEvent.change(screen.getByPlaceholderText('Enter product description'), {
        target: { value: 'High-performance laptop' },
      });

      fireEvent.change(screen.getByPlaceholderText('Enter price'), {
        target: { value: '999.99' },
      });

      fireEvent.change(screen.getByPlaceholderText('Enter quantity'), {
        target: { value: '10' },
      });

      fireEvent.change(screen.getByRole('combobox', { name: 'Select shipping' }), {
        target: { value: '1' },
      });
    };

    beforeEach(() => {
      useNavigate.mockReturnValue(mockNavigate);
      productSchema.validate.mockResolvedValue();
    });

    it('creates a new product with a photo successfully', async () => {
      axios.post.mockResolvedValue();
      global.URL.createObjectURL = jest.fn();

      const file = new File([''], 'product.jpg', { type: 'image/jpeg' });

      render(<CreateProduct />);

      await fillProductForm();

      const input = screen.getByLabelText('Upload photo');
      fireEvent.change(input, { target: { files: [file] } });

      const createButton = screen.getByRole('button', { name: /create product/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/product/create-product', expect.any(FormData));
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products', { state: { created: true } });
    });

    it('creates a new product without a photo successfully', async () => {
      axios.post.mockResolvedValue();

      render(<CreateProduct />);

      await fillProductForm();

      const createButton = screen.getByRole('button', { name: /create product/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/product/create-product', expect.any(FormData));
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products', { state: { created: true } });
    });

    it('shows an error message when creating a duplicate product', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.post.mockRejectedValue({
        response: { status: 409 },
        message: 'Product already exists',
      });

      render(<CreateProduct />);

      await fillProductForm();

      const createButton = screen.getByRole('button', { name: /create product/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Product already exists');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows an error message when creating a new product fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.post.mockRejectedValue({
        response: { status: 500 },
        message: 'Internal server error',
      });

      render(<CreateProduct />);

      await fillProductForm();

      const createButton = screen.getByRole('button', { name: /create product/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create product');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
