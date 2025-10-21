import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from 'antd';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { productSchema } from '../../schemas/productSchema';
import { validateProductPhoto } from '../../utils/photoValidation';
import { PLACEHOLDER_IMAGE } from '../../utils/productImage';
import UpdateProduct from './UpdateProduct';

jest.mock('antd', () => ({
  Modal: {
    confirm: jest.fn(),
  },
  Select: jest.fn(({ placeholder, value, onChange, options }) => (
    <select
      aria-label={placeholder}
      value={value || ''}
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
  useParams: jest.fn(),
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

describe('UpdateProduct Component', () => {
  const mockNavigate = jest.fn();

  const mockCategories = [
    { _id: '1', name: 'Electronics' },
    { _id: '2', name: 'Books' },
    { _id: '3', name: 'Clothing' },
  ];

  const mockProduct = {
    _id: '1',
    name: 'Laptop',
    slug: 'laptop',
    description: 'High-performance laptop',
    price: 999.99,
    category: mockCategories[0],
    quantity: 10,
    shipping: true,
    photo: {
      contentType: 'image/jpeg',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ slug: mockProduct.slug });

    axios.get.mockImplementation((url) => {
      if (url.includes('get-product')) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes('get-category')) {
        return Promise.resolve({ data: { category: mockCategories } });
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the component with all form fields', async () => {
    render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/get-product/${mockProduct.slug}`);
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    });

    expect(screen.getByRole('heading', { name: 'Update Product' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Select a category' })).toBeInTheDocument();
    expect(screen.getByLabelText('Upload photo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter product description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter quantity')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Select shipping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update product/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete product/i })).toBeInTheDocument();
  });

  it('populates form fields with existing product data', async () => {
    render(<UpdateProduct />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Select a category' }))
        .toHaveValue(mockProduct.category._id);
    });

    expect(screen.getByPlaceholderText('Enter product name'))
      .toHaveValue(mockProduct.name);

    expect(screen.getByPlaceholderText('Enter product description'))
      .toHaveValue(mockProduct.description);

    expect(screen.getByPlaceholderText('Enter price'))
      .toHaveValue(mockProduct.price);

    expect(screen.getByPlaceholderText('Enter quantity'))
      .toHaveValue(mockProduct.quantity);

    expect(screen.getByRole('combobox', { name: 'Select shipping' }))
      .toHaveValue(mockProduct.shipping ? '1' : '0');
  });

  it('displays the existing product photo', async () => {
    render(<UpdateProduct />);

    const img = await screen.findByAltText(mockProduct.name);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', `/api/v1/product/product-photo/${mockProduct._id}`);
  });

  it('displays the placeholder image when the product has no photo', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('get-product')) {
        return Promise.resolve({
          data: {
            product: { ...mockProduct, photo: null },
          },
        });
      }
      if (url.includes('get-category')) {
        return Promise.resolve({ data: { category: mockCategories } });
      }
    });

    render(<UpdateProduct />);

    const img = await screen.findByAltText('Product placeholder');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });

  it('displays existing categories in the category dropdown menu', async () => {
    render(<UpdateProduct />);

    await screen.findByRole('option', { name: mockCategories[0].name });

    mockCategories.forEach(({ name }) => {
      expect(screen.getByRole('option', { name })).toBeInTheDocument();
    });
  });

  it('shows an error message when fetching product fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.get.mockImplementation((url) => {
      if (url.includes('get-product')) {
        return Promise.reject(new Error('Request failed'));
      }
      if (url.includes('get-category')) {
        return Promise.resolve({ data: { category: mockCategories } });
      }
    });

    render(<UpdateProduct />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load product');
    });
  });

  it('shows an error message when fetching categories fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.get.mockImplementation((url) => {
      if (url.includes('get-product')) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes('get-category')) {
        return Promise.reject(new Error('Request failed'));
      }
    });

    render(<UpdateProduct />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load categories');
    });
  });

  describe('Photo Upload', () => {
    it('displays the file name of the selected photo', async () => {
      global.URL.createObjectURL = jest.fn();
      validateProductPhoto.mockReturnValue(null);

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      render(<UpdateProduct />);

      const input = await screen.findByLabelText('Upload photo');
      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    it('displays a preview of the selected photo', async () => {
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      validateProductPhoto.mockReturnValue(null);

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      render(<UpdateProduct />);

      const input = await screen.findByLabelText('Upload photo');
      fireEvent.change(input, { target: { files: [file] } });

      const img = screen.getByAltText('Product preview');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'mock-url');
    });

    it('shows an error message when photo validation fails', async () => {
      validateProductPhoto.mockReturnValue('Invalid file type');

      const file = new File([''], 'test.txt', { type: 'text/plain' });

      render(<UpdateProduct />);

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

      render(<UpdateProduct />);

      const updateButton = await screen.findByRole('button', { name: /update product/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(validationError.errors[0]);
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Update Product', () => {
    const updateProductDetails = async () => {
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter product name')).toHaveValue(mockProduct.name);
      });

      fireEvent.change(screen.getByPlaceholderText('Enter product name'), {
        target: { value: 'Gaming Laptop' },
      });

      fireEvent.change(screen.getByPlaceholderText('Enter price'), {
        target: { value: '1299.99' },
      });

      const updateButton = screen.getByRole('button', { name: /update product/i });
      fireEvent.click(updateButton);
    };

    beforeEach(() => {
      productSchema.validate.mockResolvedValue();
    });

    it('updates a product successfully', async () => {
      axios.put.mockResolvedValue();

      render(<UpdateProduct />);

      await updateProductDetails();

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/product/update-product/${mockProduct._id}`,
          expect.any(FormData)
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products', { state: { updated: true } });
    });

    it('shows an error message when the updated product name already exists', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.put.mockRejectedValue({
        response: { status: 409 },
        message: 'Product name already exists',
      });

      render(<UpdateProduct />);

      await updateProductDetails();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Product name already exists');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows an error message when updating a product fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.put.mockRejectedValue({
        response: { status: 500 },
        message: 'Internal server error',
      });

      render(<UpdateProduct />);

      await updateProductDetails();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update product');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Delete Product', () => {
    const clickDeleteButton = async () => {
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter product name')).toHaveValue(mockProduct.name);
      });

      const deleteButton = screen.getByRole('button', { name: /delete product/i });
      fireEvent.click(deleteButton);
    };

    it('calls Modal.confirm when clicking the delete button', async () => {
      const spy = jest.spyOn(Modal, 'confirm').mockImplementation(() => {});

      render(<UpdateProduct />);

      await clickDeleteButton();

      expect(spy).toHaveBeenCalledWith({
        title: 'Delete product?',
        content: `${mockProduct.name} will be permanently deleted. This action cannot be undone.`,
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: expect.any(Function),
      });
    });

    it('deletes a product successfully after confirmation', async () => {
      jest.spyOn(Modal, 'confirm').mockImplementation(({ onOk }) => onOk());
      axios.delete.mockResolvedValue();

      render(<UpdateProduct />);

      await clickDeleteButton();

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(`/api/v1/product/delete-product/${mockProduct._id}`);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products', { state: { deleted: true } });
    });

    it('shows an error message when deleting a product fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(Modal, 'confirm').mockImplementation(({ onOk }) => onOk());

      axios.delete.mockRejectedValue({
        response: { status: 500 },
        message: 'Internal server error',
      });

      render(<UpdateProduct />);

      await clickDeleteButton();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete product');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
