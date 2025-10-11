import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { Modal } from 'antd';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';

jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

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

jest.mock('../../components/Layout', () =>
  jest.fn(({ children, title }) => <div title={title}>{children}</div>)
);

jest.mock('../../utils/textUtils', () => ({
  normalizeText: jest.fn(text => text),
}));

describe('CreateCategory Component', () => {
  const id = '1';
  const name = 'Electronics';
  const mockCategory = { _id: id, name };

  const mockCategories = [
    mockCategory,
    { _id: '2', name: 'Books' },
    { _id: '3', name: 'Clothing' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the component with a category form and table', async () => {
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

    await screen.findByRole('cell', { name: mockCategory.name });

    mockCategories.forEach(({ name }) => {
      expect(screen.getByRole('cell', { name })).toBeInTheDocument();
    });
  });

  it('renders edit and delete buttons for each category', async () => {
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    render(<CreateCategory />);

    const editButtons = await screen.findAllByRole('button', { name: /edit/i });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    expect(editButtons).toHaveLength(mockCategories.length);
    expect(deleteButtons).toHaveLength(mockCategories.length);
  });

  it('shows an error message when fetching categories fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    axios.get.mockRejectedValue(new Error('Request failed'));

    render(<CreateCategory />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load categories');
    });
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

    beforeEach(() => {
      axios.get.mockResolvedValue({ data: { category: [] } });
      axios.post.mockResolvedValue();
    });

    it('creates a new category successfully', async () => {
      render(<CreateCategory />);

      await createCategory(name);

      expect(axios.post).toHaveBeenCalledWith('/api/v1/category/create-category', { name });
      expect(toast.success).toHaveBeenCalledWith(`${name} created successfully`);
    });

    it('clears the input field after successfully creating a new category', async () => {
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
      axios.get
        .mockResolvedValueOnce({ data: { category: [] } })
        .mockResolvedValueOnce({ data: { category: [mockCategory] } });

      render(<CreateCategory />);

      await createCategory(name);

      expect(await screen.findByRole('cell', { name })).toBeInTheDocument();
    });

    it('shows an error message when creating a duplicate category', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockResolvedValue({ data: { category: [mockCategory] } });
      axios.post.mockRejectedValue({
        response: { status: 409 },
        message: 'Category already exists',
      });

      render(<CreateCategory />);

      // Wait for the category to load first
      expect(await screen.findByRole('cell', { name })).toBeInTheDocument();

      await createCategory(name);

      expect(toast.error).toHaveBeenCalledWith('Category already exists');
    });

    it('shows an error message when creating a new category fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.post.mockRejectedValue({
        response: { status: 500 },
        message: 'Internal server error',
      });

      render(<CreateCategory />);

      await createCategory(name);

      expect(toast.error).toHaveBeenCalledWith('Failed to create category');
    });
  });

  describe('Update Category', () => {
    const updatedName = 'Electronics & Gadgets';

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

    beforeEach(() => {
      axios.get.mockResolvedValue({ data: { category: [mockCategory] } });
      axios.put.mockResolvedValue();
    });

    it('opens the edit modal when clicking the edit button', async () => {
      render(<CreateCategory />);

      await openEditModal(name);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('displays the selected category name in the edit form', async () => {
      render(<CreateCategory />);

      await openEditModal(name);

      const modal = await screen.findByRole('dialog');
      const input = within(modal).getByRole('textbox');

      expect(input).toHaveValue(name);
    });

    it('closes the edit modal when clicking the close button', async () => {
      render(<CreateCategory />);

      await openEditModal(name);

      const modal = await screen.findByRole('dialog');
      const closeButton = within(modal).getByRole('button', { name: /close/i });

      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('updates a category successfully', async () => {
      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      expect(axios.put).toHaveBeenCalledWith(
        `/api/v1/category/update-category/${id}`,
        { name: updatedName },
      );
      expect(toast.success).toHaveBeenCalledWith(`${updatedName} updated successfully`);
    });

    it('closes the edit modal after successfully updating a category', async () => {
      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('displays the updated category in the table after it is edited', async () => {
      const mockUpdatedCategory = { _id: '1', name: updatedName };

      axios.get
        .mockResolvedValueOnce({ data: { category: [mockCategory] } })
        .mockResolvedValueOnce({ data: { category: [mockUpdatedCategory] } });

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      expect(await screen.findByRole('cell', { name: updatedName })).toBeInTheDocument();
    });

    it('shows an error message when the category name is unchanged', async () => {
      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(name);

      expect(toast.error).toHaveBeenCalledWith('Please enter a new name');
    });

    it('shows an error message when the category name already exists', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const existingName = 'Books';

      axios.get.mockResolvedValue({
        data: {
          category: [mockCategory, { _id: '2', name: existingName }],
        },
      });

      axios.put.mockRejectedValue({
        response: { status: 409 },
        message: 'Category already exists',
      });

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(existingName);

      expect(toast.error).toHaveBeenCalledWith('Category already exists');
    });

    it('shows an error message when updating a category fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      axios.put.mockRejectedValue({
        response: { status: 500 },
        message: 'Internal server error',
      });

      render(<CreateCategory />);

      await openEditModal(name);
      await updateCategory(updatedName);

      expect(toast.error).toHaveBeenCalledWith('Failed to update category');
    });
  });

  describe('Delete Category', () => {
    const clickDeleteButton = async (name) => {
      const cell = await screen.findByRole('cell', { name });
      const row = cell.closest('tr');
      const deleteButton = within(row).getByRole('button', { name: /delete/i });

      fireEvent.click(deleteButton);
    };

    beforeEach(() => {
      axios.get.mockResolvedValue({ data: { category: [mockCategory] } });
      axios.delete.mockResolvedValue();
    });

    it('calls Modal.confirm when clicking the delete button', async () => {
      const spy = jest.spyOn(Modal, 'confirm').mockImplementation(() => {});

      render(<CreateCategory />);

      await clickDeleteButton(name);

      expect(spy).toHaveBeenCalledWith({
        title: 'Delete category?',
        content: `${name} will be permanently deleted. This action cannot be undone.`,
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: expect.any(Function),
      });
    });

    it('deletes a category successfully after confirmation', async () => {
      jest.spyOn(Modal, 'confirm').mockImplementation(({ onOk }) => onOk());

      render(<CreateCategory />);

      await clickDeleteButton(name);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(`/api/v1/category/delete-category/${id}`);
      });

      expect(toast.success).toHaveBeenCalledWith(`${name} deleted successfully`);
    });

    it('removes the category from the table after it is deleted', async () => {
      jest.spyOn(Modal, 'confirm').mockImplementation(({ onOk }) => onOk());

      axios.get
        .mockResolvedValueOnce({ data: { category: [mockCategory] } })
        .mockResolvedValueOnce({ data: { category: [] } });

      render(<CreateCategory />);

      await clickDeleteButton(name);

      await waitFor(() => {
        expect(screen.queryByRole('cell', { name })).not.toBeInTheDocument();
      });
    });

    it('shows an error message when deleting a category with products', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(Modal, 'confirm').mockImplementation(({ onOk }) => onOk());

      axios.delete.mockRejectedValue({
        response: { status: 409 },
        message: 'Category still has products',
      });

      render(<CreateCategory />);

      await clickDeleteButton(name);

      expect(toast.error).toHaveBeenCalledWith('Category still has products');
    });

    it('shows an error message when deleting a category fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(Modal, 'confirm').mockImplementation(({ onOk }) => onOk());

      axios.delete.mockRejectedValue({
        response: { status: 500 },
        message: 'Internal server error',
      });

      render(<CreateCategory />);

      await clickDeleteButton(name);

      expect(toast.error).toHaveBeenCalledWith('Failed to delete category');
    });
  });
});
