import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import axios from 'axios';
import moment from 'moment';
import toast from 'react-hot-toast';
import AdminMenu from '../../components/AdminMenu';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/auth';
import { groupProductsById } from '../../utils/orderUtils';
import { getProductImageProps } from '../../utils/productImage';

const statuses = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Canceled',
];

const AdminOrders = () => {
  const [auth] = useAuth();
  const [orders, setOrders] = useState([]);

  const getAllOrders = async () => {
    try {
      const { data } = await axios.get('/api/v1/auth/all-orders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      toast.error('Failed to load orders');
    }
  };

  useEffect(() => {
    if (auth?.token) {
      void getAllOrders();
    }
  }, [auth?.token]);

  // Update order status
  const handleChange = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/v1/auth/order-status/${orderId}`, {
        status: newStatus,
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error.message);
      toast.error('Failed to update order status');
    }
  };

  return (
    <Layout title={'All Orders Data'}>
      <div className="row dashboard">
        <div className="col-md-3">
          <AdminMenu />
        </div>

        <div className="col-md-9">
          <h1 className="text-center">All Orders</h1>

          {orders.map((order, index) => {
            return (
              <div key={order._id} className="border shadow">
                {/* Order Summary Table */}
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Status</th>
                      <th scope="col">Buyer</th>
                      <th scope="col">Order Date</th>
                      <th scope="col">Payment</th>
                      <th scope="col">Products</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{index + 1}</td>
                      <td>
                        <Select
                          variant="borderless"
                          value={order.status}
                          onChange={(newStatus) => handleChange(order._id, newStatus)}
                          options={statuses.map((status) => ({ label: status, value: status }))}
                        />
                      </td>
                      <td>{order.buyer.name}</td>
                      <td>{moment(order.createdAt).format('MMM D, YYYY')}</td>
                      <td>{order.payment.success ? 'Success' : 'Failed'}</td>
                      <td>{order.products.length}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="container">
                  {groupProductsById(order.products).map((product) => (
                    <div key={`${order._id}-${product._id}`} className="row mb-2 p-3 card flex-row">
                      <div className="col-md-4">
                        <img
                          {...getProductImageProps(product)}
                          className="card-img-top"
                          width="100px"
                          style={{ maxHeight: '150px', objectFit: 'contain' }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="col-md-8">
                        <p>{product.name}</p>
                        <p>{product.description}</p>
                        <p>Price: ${product.price.toFixed(2)}</p>
                        <p>Quantity: {product.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrders;
