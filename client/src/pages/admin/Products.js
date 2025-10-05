import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import AdminMenu from '../../components/AdminMenu';
import Layout from '../../components/Layout';

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

          <div className="d-flex">
            {products?.map((product) => (
              <Link
                key={product._id}
                to={`/dashboard/admin/product/${product.slug}`}
                className="product-link"
              >
                <div className="card m-2" style={{ width: "18rem" }}>
                  <img
                    src={`/api/v1/product/product-photo/${product._id}`}
                    className="card-img-top"
                    alt={product.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="card-text">{product.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
