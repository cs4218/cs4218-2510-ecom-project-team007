import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import AdminMenu from '../../components/AdminMenu';
import Layout from '../../components/Layout';
import { getProductImageProps } from '../../utils/productImage';

const actions = ['created', 'updated', 'deleted'];

const Products = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);

  const getAllProducts = async () => {
    try {
      const { data } = await axios.get('/api/v1/product/get-product');
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error.message);
      toast.error('Failed to load products');
    }
  };

  useEffect(() => {
    void getAllProducts();
  }, []);

  useEffect(() => {
    const state = location.state;
    if (!state) {
      return;
    }

    for (const action of actions) {
      if (state[action]) {
        toast.success(`Product ${action} successfully`);
        window.history.replaceState({}, document.title);
        break;
      }
    }
  }, [location]);

  return (
    <Layout>
      <div className="row">
        <div className="col-md-3">
          <AdminMenu />
        </div>

        <div className="col-md-9 ">
          <h1 className="text-center">All Products List</h1>

          <div className="row">
            {products?.map((product) => (
              <div key={product._id} className="col-md-4 mb-4">
                <Link
                  to={`/dashboard/admin/product/${product.slug}`}
                  className="product-link text-decoration-none"
                >
                  <div className="card h-100">
                    <img
                      {...getProductImageProps(product)}
                      alt="Product"
                      className="card-img-top"
                      style={{ maxHeight: '240px', objectFit: 'contain' }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{product.name}</h5>
                      <p className="card-text">{product.description}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
