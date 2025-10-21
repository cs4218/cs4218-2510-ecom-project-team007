import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/CategoryProductStyles.css";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";
import {getProductImageProps} from "../utils/productImage";

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [showProducts, setShowProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const getProductsByCat = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/v1/product/product-category/${params.slug}`
      );
      setLoading(false);

      setProducts(data?.products);
      setCategory(data?.category);
      setTotal(data?.products.length || 0);
      setShowProducts((data?.products || []).slice(0, 6));

    } catch (error) {
      console.log(error);
    }
  };
  
  const loadMore = async () => {
    try {
      setLoading(true);
      const nextProducts = products.slice((page - 1) * 6, page * 6);
      setShowProducts([...showProducts, ...nextProducts]);
      setLoading(false);

    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (params?.slug) getProductsByCat();
  }, [params?.slug]);

  useEffect(() => {
    if (page === 1) return;
    loadMore();
  }, [page]);

  return (
    <Layout>
      <div className="container mt-3 category">
        <h4 className="text-center">Category - {category?.name}</h4>
        <h6 className="text-center">{products?.length} result found </h6>
        <div className="row">
          <div className="col-md-9 offset-1">
            <div className="d-flex flex-wrap">
              {showProducts?.map((p) => (
                <div className="card m-2" key={p._id}>
                  <img {...getProductImageProps(p)} className="card-img-top" />
                  <div className="card-body">
                    <div className="card-name-price">
                      <h5 className="card-title">{p.name}</h5>
                      <h5 className="card-title card-price">
                        {p.price.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </h5>
                    </div>
                    <p className="card-text ">
                      {p.description.substring(0, 60)}...
                    </p>
                    <div className="card-name-price">
                      <button
                        className="btn btn-info ms-1"
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        More Details
                      </button>
                      {<button
                    className="btn btn-dark ms-1"
                    onClick={() => {
                      setCart([...cart, p]);
                      localStorage.setItem(
                        "cart",
                        JSON.stringify([...cart, p])
                      );
                      toast.success("Item Added to cart");
                    }}
                  >
                    Add to cart
                  </button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="m-2 p-3">
            {showProducts && showProducts.length < total && (
              <button
                className="btn loadmore"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(page + 1);
                }}
              >
                {loading ? "Loading ..." : "Load more"}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;