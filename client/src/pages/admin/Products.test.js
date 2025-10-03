import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Products from './Products';

jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

jest.mock('../../components/AdminMenu', () =>
  jest.fn(() => <div>Admin Menu</div>)
);

jest.mock('../../components/Layout', () =>
  jest.fn(({ children }) => <div>{children}</div>)
);

describe('Products Component', () => {
  const mockLaptop = {
    _id: 'product1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    slug: 'laptop',
  };

  const mockMouse = {
    _id: 'product2',
    name: 'Mouse',
    description: 'Wireless mouse with ergonomic design',
    slug: 'mouse',
  };

  const mockProducts = [mockLaptop, mockMouse];

  const renderWithRouter = (component) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { products: mockProducts } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the component without any products', async () => {
    axios.get.mockResolvedValue({ data: { products: [] } });

    renderWithRouter(<Products />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product');
    });

    expect(screen.getByRole('heading', { name: 'All Products List' })).toBeInTheDocument();
  });

  it('displays product details', async () => {
    renderWithRouter(<Products />);

    await screen.findByText(mockLaptop.name);

    mockProducts.forEach((product) => {
      expect(screen.getByText(product.name)).toBeInTheDocument();
      expect(screen.getByText(product.description)).toBeInTheDocument();
    });
  });

  it('displays product images with correct attributes', async () => {
    renderWithRouter(<Products />);

    const laptopImage = await screen.findByAltText(mockLaptop.name);
    const mouseImage = screen.getByAltText(mockMouse.name);

    expect(laptopImage).toHaveAttribute(
      'src',
      `/api/v1/product/product-photo/${mockLaptop._id}`
    );
    expect(mouseImage).toHaveAttribute(
      'src',
      `/api/v1/product/product-photo/${mockMouse._id}`
    );
  });

  it('displays product links with correct paths', async () => {
    renderWithRouter(<Products />);

    const laptopLink = await screen.findByRole('link', {
      name: new RegExp(mockLaptop.name),
    });
    const mouseLink = screen.getByRole('link', {
      name: new RegExp(mockMouse.name),
    });

    expect(laptopLink).toHaveAttribute(
      'href',
      `/dashboard/admin/product/${mockLaptop.slug}`
    );
    expect(mouseLink).toHaveAttribute(
      'href',
      `/dashboard/admin/product/${mockMouse.slug}`
    );
  });

  it('shows an error message when fetching products fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.get.mockRejectedValue(new Error('Request failed'));

    renderWithRouter(<Products />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load products');
    });
  });
});
