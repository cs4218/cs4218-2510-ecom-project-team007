import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
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
    <form onSubmit={handleSubmit} aria-label="Category Form">
      <input
        type="text"
        placeholder="Enter new category"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  ))
);

jest.mock('../../utils/textUtils', () => ({
  normalizeText: jest.fn(text => text),
}));

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
    expect(screen.getByRole('form', { name: 'Category Form' })).toBeInTheDocument();
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

  describe('Create Category', () => {
    const createCategory = async (name) => {
      const input = screen.getByPlaceholderText('Enter new category');
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: name } });

      await act(async () => {
        fireEvent.click(submitButton);
      });
    };

    it('creates a new category successfully', async () => {
      const name = 'Electronics';

      axios.get.mockResolvedValue({ data: { category: [] } });
      axios.post.mockResolvedValue();

      render(<CreateCategory />);

      await createCategory(name);

      expect(axios.post).toHaveBeenCalledWith('/api/v1/category/create-category', { name });
      expect(toast.success).toHaveBeenCalledWith(`${name} created successfully`);
    });

    it('clears the input field after successfully creating a new category', async () => {
      axios.get.mockResolvedValue({ data: { category: [] } });
      axios.post.mockResolvedValue();

      render(<CreateCategory />);

      const input = screen.getByPlaceholderText('Enter new category');
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'Electronics' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('displays the new category in the table after it is created', async () => {
      const name = 'Electronics';

      axios.get
        .mockResolvedValueOnce({ data: { category: [] } })
        .mockResolvedValueOnce({ data: { category: [{ _id: '1', name }] } });

      axios.post.mockResolvedValue();

      render(<CreateCategory />);

      await createCategory(name);

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

      // Wait for the category to load first
      expect(await screen.findByRole('cell', { name })).toBeInTheDocument();

      await createCategory(name);

      expect(toast.error).toHaveBeenCalledWith('Category already exists');

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

      await createCategory('Electronics');

      expect(toast.error).toHaveBeenCalledWith('Failed to create category');

      spy.mockRestore();
    });
  });

  describe('Update Category', () => {
    const openEditModal = async (name) => {
      const cell = await screen.findByRole('cell', { name });
      const row = cell.closest('tr');
      const editButton = within(row).getByRole('button', { name: /edit/i });

      fireEvent.click(editButton);
    };

    const updateCategory = async (updatedName) => {
      const modal = await screen.findByRole('dialog');
      const input = within(modal).getByRole('textbox');
      const submitButton = within(modal).getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: updatedName } });

      await act(async () => {
        fireEvent.click(submitButton);
      });
    };

    it('opens the modal when clicking the edit button', async () => {
      const name = 'Electronics';

      axios.get.mockResolvedValue({ data: { category: [{ _id: '1', name }] } });

      render(<CreateCategory />);

      await openEditModal(name);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('displays the selected category name in the edit form', async () => {
      const name = 'Electronics';

      axios.get.mockResolvedValue({ data: { category: [{ _id: '1', name }] } });

      render(<CreateCategory />);

      await openEditModal(name);

      const modal = await screen.findByRole('dialog');
      const input = within(modal).getByRole('textbox');

      expect(input).toHaveValue(name);
    });

    it('updates a category successfully', async () => {
      const name = 'Electronics';
      const updatedName = 'Electronics & Gadgets';

      axios.get.mockResolvedValue({ data: { category: [{ _id: '1', name }] } });
      axios.put.mockResolvedValue();

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/category/update-category/1',
        { name: updatedName },
      );
      expect(toast.success).toHaveBeenCalledWith(`${updatedName} updated successfully`);
    });

    it('closes the modal after successfully updating a category', async () => {
      const name = 'Electronics';
      const updatedName = 'Electronics & Gadgets';

      axios.get.mockResolvedValue({ data: { category: [{ _id: '1', name }] } });
      axios.put.mockResolvedValue();

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('displays the updated category in the table after it is edited', async () => {
      const name = 'Electronics';
      const updatedName = 'Electronics & Gadgets';

      axios.get
        .mockResolvedValueOnce({ data: { category: [{ _id: '1', name }] } })
        .mockResolvedValueOnce({ data: { category: [{ _id: '1', name: updatedName }] } });

      axios.put.mockResolvedValue();

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      expect(await screen.findByRole('cell', { name: updatedName })).toBeInTheDocument();
    });

    it('shows an error message when updating to the same name', async () => {
      const name = 'Electronics';

      axios.get.mockResolvedValue({ data: { category: [{ _id: '1', name }] } });

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(name);

      expect(toast.error).toHaveBeenCalledWith('Please enter a new name');
    });

    it('shows an error message when updating to an existing name', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const name = 'Electronics';
      const updatedName = 'Books';

      axios.get.mockResolvedValue({
        data: {
          category: [
            { _id: '1', name },
            { _id: '2', name: updatedName },
          ],
        },
      });

      axios.put.mockRejectedValue({
        response: { status: 409 },
        message: 'Category already exists',
      });

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      expect(toast.error).toHaveBeenCalledWith('Category already exists');

      spy.mockRestore();
    });

    it('shows an error message when updating a category fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const name = 'Electronics';
      const updatedName = 'Electronics & Gadgets';

      axios.get.mockResolvedValue({ data: { category: [{ _id: '1', name }] } });
      axios.put.mockRejectedValue({
        response: { status: 500 },
        message: 'Internal server error',
      });

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      expect(toast.error).toHaveBeenCalledWith('Failed to update category');

      spy.mockRestore();
    });
  });
});
