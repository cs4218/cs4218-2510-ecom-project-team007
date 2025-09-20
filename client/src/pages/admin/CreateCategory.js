import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from './../../components/Layout';
import AdminMenu from './../../components/AdminMenu';
import CategoryForm from '../../components/Form/CategoryForm';

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState('');

  useEffect(() => {
    void getAllCategories();
  }, []);

  const getAllCategories = async () => {
    try {
      const { data } = await axios.get('/api/v1/category/get-category');
      setCategories(data.category);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
      toast.error('Failed to load categories');
    }
  };

  // Create new category
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/v1/category/create-category', { name });
      toast.success(`${name} created successfully`);
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
    try {
      const { data } = await axios.put(
        `/api/v1/category/update-category/${selected._id}`,
        { name: updatedName }
      );
      if (data.success) {
        toast.success(`${updatedName} is updated`);
        setSelected(null);
        setUpdatedName('');
        setIsModalOpen(false);
        getAllCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Somtihing went wrong');
    }
  };

  // Delete category
  const handleDelete = async (pId) => {
    try {
      const { data } = await axios.delete(
        `/api/v1/category/delete-category/${pId}`
      );
      if (data.success) {
        toast.success(`category is deleted`);

        getAllCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Somtihing went wrong');
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

            {/* Category Form */}
            <div className="p-3 w-50">
              <CategoryForm
                handleSubmit={handleSubmit}
                value={name}
                setValue={setName}
              />
            </div>

            {/* Categories Table */}
            <div className="w-75">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories?.map(category => (
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
                          onClick={() => handleDelete(category._id)}
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
