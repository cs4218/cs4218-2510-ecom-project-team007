import React, { useState, useEffect } from 'react';
import { Modal, Select } from 'antd';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import AdminMenu from '../../components/AdminMenu';
import Layout from '../../components/Layout';
import { productSchema } from '../../schemas/productSchema';
import { validateProductPhoto } from '../../utils/photoValidation';
import { PLACEHOLDER_IMAGE } from '../../utils/productImage';

const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [categories, setCategories] = useState([]);

  const [id, setId] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [shipping, setShipping] = useState(null);

  const getProduct = async () => {
    try {
      const { data } = await axios.get(`/api/v1/product/get-product/${params.slug}`);
      const product = data.product;

      setId(product._id);
      setCategory(product.category._id);
      setHasPhoto(!!product.photo);
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price);
      setQuantity(product.quantity);
      setShipping(product.shipping ? 1 : 0);
    } catch (error) {
      console.error('Error fetching product:', error.message);
      toast.error('Failed to load product');
    }
  };

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
    void getProduct();
    // eslint-disable-next-line
  }, []);

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

  const updateProduct = async () => {
    try {
      const formData = new FormData();
      formData.append('category', category);
      photo && formData.append('photo', photo);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('quantity', quantity);
      formData.append('shipping', shipping);

      await axios.put(`/api/v1/product/update-product/${id}`, formData);

      navigate('/dashboard/admin/products', { state: { updated: true } });
    } catch (error) {
      console.error('Error updating product:', error.message);

      if (error.response?.status === 409) {
        toast.error('Product name already exists');
      } else {
        toast.error('Failed to update product');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const isValid = await validateProduct();
    if (!isValid) {
      return;
    }

    await updateProduct();
  };

  const showDeleteConfirmation = () => {
    Modal.confirm({
      title: 'Delete product?',
      content: `${name} will be permanently deleted. This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleDelete(),
    });
  };

  // Delete product
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/v1/product/delete-product/${id}`);
      navigate('/dashboard/admin/products', { state: { deleted: true } });
    } catch (error) {
      console.error('Error deleting product:', error.message);
      toast.error('Failed to delete product');
    }
  };

  return (
    <Layout title={"Dashboard - Update Product"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>

          <div className="col-md-9">
            <h1>Update Product</h1>

            <div className="m-1 w-75">
              <Select
                variant="borderless"
                placeholder="Select a category"
                size="large"
                showSearch
                className="form-select mb-3"
                value={category}
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
                <div className="text-center">
                  {photo instanceof File ? (
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="Product preview"
                      height="200px"
                      className="img img-responsive"
                    />
                  ) : (
                    <img
                      src={hasPhoto ? `/api/v1/product/product-photo/${id}` : PLACEHOLDER_IMAGE}
                      alt={hasPhoto ? name : 'Product placeholder'}
                      height="200px"
                      className="img img-responsive"
                    />
                  )}
                </div>
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
                  variant="borderless"
                  placeholder="Select shipping"
                  size="large"
                  showSearch
                  className="form-select mb-3"
                  value={shipping}
                  onChange={(value) => setShipping(value)}
                  options={[
                    { label: 'Yes', value: 1 },
                    { label: 'No', value: 0 },
                  ]}
                />
              </div>

              <div className="mb-3">
                <button className="btn btn-primary" onClick={handleUpdate}>
                  UPDATE PRODUCT
                </button>
              </div>

              <div className="mb-3">
                <button
                  className="btn btn-danger"
                  onClick={showDeleteConfirmation}
                >
                  DELETE PRODUCT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UpdateProduct;
