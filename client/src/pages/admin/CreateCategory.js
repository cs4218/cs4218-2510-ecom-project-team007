import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminMenu from '../../components/AdminMenu';
import CategoryForm from '../../components/Form/CategoryForm';
import Layout from '../../components/Layout';
import { normalizeText } from '../../utils/textUtils';

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState('');

  const getAllCategories = async () => {
    try {
      const { data } = await axios.get('/api/v1/category/get-category');
      setCategories(data.category);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
      toast.error('Failed to load categories');
    }
  };

  useEffect(() => {
    void getAllCategories();
  }, []);

  // Create new category
  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedName = normalizeText(name);

    try {
      await axios.post('/api/v1/category/create-category', { name: normalizedName });
      toast.success(`${normalizedName} created successfully`);
      setName('');
      await getAllCategories();
    } catch (error) {
      console.error('Error creating category:', error.message);

      if (error.response?.status === 409) {
        toast.error('Category already exists');
      } else {
        toast.error('Failed to create category');
      }
    }
  };

  // Update category
  const handleUpdate = async (e) => {
    e.preventDefault();

    const normalizedUpdatedName = normalizeText(updatedName);

    if (normalizedUpdatedName.toLowerCase() === selected.name.toLowerCase()) {
      toast.error('Please enter a new name');
      return;
    }

    try {
      await axios.put(
        `/api/v1/category/update-category/${selected._id}`,
        { name: normalizedUpdatedName },
      );

      toast.success(`${normalizedUpdatedName} updated successfully`);

      setSelected(null);
      setUpdatedName('');
      setIsModalOpen(false);

      await getAllCategories();
    } catch (error) {
      console.error('Error updating category:', error.message);

      if (error.response?.status === 409) {
        toast.error('Category already exists');
      } else {
        toast.error('Failed to update category');
      }
    }
  };

  const showDeleteConfirmation = (category) => {
    Modal.confirm({
      title: 'Delete category?',
      content: `${category.name} will be permanently deleted. This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleDelete(category),
    });
  };

  // Delete category
  const handleDelete = async (category) => {
    try {
      await axios.delete(`/api/v1/category/delete-category/${category._id}`);
      toast.success(`${category.name} deleted successfully`);
      await getAllCategories();
    } catch (error) {
      console.error('Error deleting category:', error.message);

      if (error.response?.status === 409) {
        toast.error('Category still has products');
      } else {
        toast.error('Failed to delete category');
      }
    }
  };

  return (
    <Layout title={'Dashboard - Create Category'}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>

          <div className="col-md-9">
            <h1>Manage Category</h1>

            <div className="p-3 w-50">
              <CategoryForm
                handleSubmit={handleSubmit}
                value={name}
                setValue={setName}
              />
            </div>

            <div className="w-75">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories?.map((category) => (
                    <tr key={category._id}>
                      <td>{category.name}</td>
                      <td>
                        <button
                          className="btn btn-primary ms-2"
                          onClick={() => {
                            setIsModalOpen(true);
                            setUpdatedName(category.name);
                            setSelected(category);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger ms-2"
                          onClick={() => showDeleteConfirmation(category)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit Modal */}
            <Modal
              onCancel={() => setIsModalOpen(false)}
              footer={null}
              open={isModalOpen}
            >
              <CategoryForm
                value={updatedName}
                setValue={setUpdatedName}
                handleSubmit={handleUpdate}
              />
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateCategory;
