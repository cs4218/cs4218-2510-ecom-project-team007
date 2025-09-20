import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';

jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../components/Layout', () =>
  jest.fn(({ children, title }) => <div title={title}>{children}</div>)
);

jest.mock('../../components/AdminMenu', () =>
  jest.fn(() => <div>Admin Menu</div>)
);

jest.mock('../../components/Form/CategoryForm', () =>
  jest.fn(({ handleSubmit, value, setValue }) => (
    <form data-testid="category-form" onSubmit={handleSubmit}>
      <input
        data-testid="category-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter new category"
      />
      <button type="submit">Submit</button>
    </form>
  ))
);

describe('CreateCategory Component', () => {
  const mockCategories = [
    { _id: '1', name: 'Electronics' },
    { _id: '2', name: 'Books' },
    { _id: '3', name: 'Clothing' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with category form and table', async () => {
    axios.get.mockResolvedValue({ data: { category: [] } });

    render(<CreateCategory />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    });

    expect(screen.getByRole('heading', { name: 'Manage Category' })).toBeInTheDocument();
    expect(screen.getByTestId('category-form')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
  });

  it('displays existing categories in the table', async () => {
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    render(<CreateCategory />);

    await waitFor(() => {
      mockCategories.forEach(({ name }) => {
        expect(screen.getByRole('cell', { name })).toBeInTheDocument();
      });
    });
  });

  it('renders edit and delete buttons for each category', async () => {
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    render(<CreateCategory />);

    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

      expect(editButtons).toHaveLength(mockCategories.length);
      expect(deleteButtons).toHaveLength(mockCategories.length);
    });
  });

  it('shows an error message when fetching categories fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.get.mockRejectedValue(new Error('Request failed'));

    render(<CreateCategory />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load categories');
    });

    spy.mockRestore();
  });

  it('creates a new category successfully', async () => {
    const name = 'Electronics';

    axios.get.mockResolvedValue({ data: { category: [] } });
    axios.post.mockResolvedValue();

    render(<CreateCategory />);

    fireEvent.change(screen.getByTestId('category-input'), { target: { value: name } });
    fireEvent.submit(screen.getByTestId('category-form'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/category/create-category', { name });
      expect(toast.success).toHaveBeenCalledWith(`${name} created successfully`);
    });
  });

  it('clears the input field after successfully creating a new category', async () => {
    axios.get.mockResolvedValue({ data: { category: [] } });
    axios.post.mockResolvedValue();

    render(<CreateCategory />);

    const input = screen.getByTestId('category-input');

    fireEvent.change(input, { target: { value: 'Electronics' } });
    fireEvent.submit(screen.getByTestId('category-form'));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('displays the new category in the table after it is created', async () => {
    const name = 'Electronics';

    // Mock initial empty state
    axios.get.mockResolvedValueOnce({ data: { category: [] } });
    axios.post.mockResolvedValue();

    // Mock refetch with new category
    axios.get.mockResolvedValueOnce({ data: { category: [{ _id: '1', name }] } });

    render(<CreateCategory />);

    fireEvent.change(screen.getByTestId('category-input'), { target: { value: name } });
    fireEvent.submit(screen.getByTestId('category-form'));

    expect(await screen.findByRole('cell', { name })).toBeInTheDocument();
  });

  it('shows an error message when creating a duplicate category', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const name = 'Electronics';

    axios.get.mockResolvedValue({ data: { category: [{ _id: '1', name }] } });
    axios.post.mockRejectedValue({
      response: { status: 409 },
      message: 'Category already exists',
    });

    render(<CreateCategory />);

    // Wait for existing categories to load first
    expect(await screen.findByRole('cell', { name })).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('category-input'), { target: { value: name } });
    fireEvent.submit(screen.getByTestId('category-form'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Category already exists');
    });

    spy.mockRestore();
  });

  it('shows an error message when creating a new category fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.get.mockResolvedValue({ data: { category: [] } });
    axios.post.mockRejectedValue({
      response: { status: 500 },
      message: 'Internal server error',
    });

    render(<CreateCategory />);

    fireEvent.change(screen.getByTestId('category-input'), {
      target: { value: 'Electronics' },
    });
    fireEvent.submit(screen.getByTestId('category-form'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create category');
    });

    spy.mockRestore();
  });
});
