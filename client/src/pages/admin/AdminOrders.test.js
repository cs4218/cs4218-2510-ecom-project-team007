import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth';
import AdminOrders from './AdminOrders';

jest.mock('antd', () => ({
  Select: jest.fn(({ value, onChange, options }) => (
    <select
      aria-label="Select order status"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
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

jest.mock('../../components/AdminMenu', () =>
  jest.fn(() => <div>Admin Menu</div>)
);

jest.mock('../../components/Layout', () =>
  jest.fn(({ children, title }) => <div title={title}>{children}</div>)
);

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));

describe('AdminOrders Component', () => {
  const mockProduct = {
    _id: 'product1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 999,
    photo: {
      contentType: 'image/jpeg',
    },
  };

  const mockOrder = {
    _id: 'order1',
    status: 'Shipped',
    buyer: { name: 'John Doe' },
    createdAt: '2025-01-15T10:00:00Z',
    payment: { success: true },
    products: [mockProduct, mockProduct],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ token: 'mock-token' }]);
    axios.get.mockResolvedValue({ data: [mockOrder] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the component without any orders', async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
    });

    expect(screen.getByRole('heading', { name: 'All Orders' })).toBeInTheDocument();
  });

  it('displays column headers for the order summary table', async () => {
    render(<AdminOrders />);

    expect(await screen.findByRole('columnheader', { name: '#' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Buyer' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Order Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Payment' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Products' })).toBeInTheDocument();
  });

  it('displays order details in the table', async () => {
    render(<AdminOrders />);

    expect(await screen.findByText('1')).toBeInTheDocument(); // Order number
    expect(screen.getByDisplayValue('Shipped')).toBeInTheDocument(); // Order status
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Buyer
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument(); // Order date
    expect(screen.getByText('Success')).toBeInTheDocument(); // Payment status
    expect(screen.getByText('2')).toBeInTheDocument(); // Product count
  });

  it('displays product details for an order', async () => {
    render(<AdminOrders />);

    const img = await screen.findByAltText(mockProduct.name);
    expect(img).toHaveAttribute('src', `/api/v1/product/product-photo/${mockProduct._id}`);

    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
    expect(screen.getByText(`Price: $${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
  });

  it('updates the order status successfully', async () => {
    const newStatus = 'Delivered';

    axios.put.mockResolvedValue();

    render(<AdminOrders />);

    const select = await screen.findByRole('combobox', { name: 'Select order status' });
    fireEvent.change(select, { target: { value: newStatus } });

    await waitFor(() => {
      expect(select).toHaveValue(newStatus);
    });

    expect(axios.put).toHaveBeenCalledWith(
      `/api/v1/auth/order-status/${mockOrder._id}`,
      { status: newStatus }
    );
    expect(toast.success).toHaveBeenCalledWith('Order status updated successfully');
  });

  it('shows an error message when fetching orders fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.get.mockRejectedValue(new Error('Request failed'));

    render(<AdminOrders />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load orders');
    });
  });

  it('shows an error message when updating the order status fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.put.mockRejectedValue(new Error('Update failed'));

    render(<AdminOrders />);

    const select = await screen.findByRole('combobox', { name: 'Select order status' });
    fireEvent.change(select, { target: { value: 'Delivered' } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update order status');
    });

    expect(select).toHaveValue(mockOrder.status);
  });
});
