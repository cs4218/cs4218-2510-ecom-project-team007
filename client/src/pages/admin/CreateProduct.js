import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AdminMenu from '../../components/AdminMenu';
import Layout from '../../components/Layout';
import { productSchema } from '../../schemas/productSchema';
import { validateProductPhoto } from '../../utils/photoValidation';

const CreateProduct = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [shipping, setShipping] = useState(null);

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    const error = validateProductPhoto(file);

    if (error) {
      toast.error(error);
      e.target.value = '';
      return;
    }

    setPhoto(file);
  };

  const validateProduct = async () => {
    try {
      await productSchema.validate(
        {
          category,
          name,
          description,
          price,
          quantity,
          shipping,
        },
        { abortEarly: false }
      );
      return true;
    } catch (error) {
      toast.error(error.errors[0]);
      return false;
    }
  };

  const createProduct = async () => {
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('photo', photo);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('quantity', quantity);
      formData.append('shipping', shipping);

      await axios.post('/api/v1/product/create-product', formData);

      navigate('/dashboard/admin/products', { state: { created: true } });
    } catch (error) {
      console.error('Error creating product:', error.message);

      if (error.response?.status === 409) {
        toast.error('Product name already exists');
      } else {
        toast.error('Failed to create product');
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const isValid = await validateProduct();
    if (!isValid) {
      return;
    }

    await createProduct();
  };

  return (
    <Layout title={"Dashboard - Create Product"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>

          <div className="col-md-9">
            <h1>Create Product</h1>

            <div className="m-1 w-75">
              <Select
                data-testid="category-select"
                placeholder="Select a category"
                variant="borderless"
                size="large"
                className="form-select mb-3"
                showSearch
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                onChange={(value) => setCategory(value)}
                options={categories?.map((category) => ({
                  label: category.name,
                  value: category._id,
                }))}
              />

              <div className="mb-3">
                <label className="btn btn-outline-secondary col-md-12">
                  {photo ? photo.name : 'Upload photo'}
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    hidden
                  />
                </label>
              </div>

              {/* Photo Preview */}
              <div className="mb-3">
                {photo instanceof File && (
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="Preview"
                      height="200px"
                      className="img img-responsive"
                    />
                  </div>
                )}
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  value={name}
                  placeholder="Enter product name"
                  className="form-control"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <textarea
                  value={description}
                  placeholder="Enter product description"
                  className="form-control"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <input
                  type="number"
                  value={price}
                  placeholder="Enter price"
                  className="form-control"
                  min="0"
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <input
                  type="number"
                  value={quantity}
                  placeholder="Enter quantity"
                  className="form-control"
                  min="0"
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <Select
                  data-testid="shipping-select"
                  placeholder="Select shipping"
                  variant="borderless"
                  size="large"
                  className="form-select mb-3"
                  onChange={(value) => setShipping(value)}
                  options={[
                    { label: 'Yes', value: 1 },
                    { label: 'No', value: 0 },
                  ]}
                />
              </div>

              <div className="mb-3">
                <button className="btn btn-primary" onClick={handleCreate}>
                  CREATE PRODUCT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProduct;
