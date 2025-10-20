import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useCategory from "../hooks/useCategory";
import Layout from "../components/Layout";
const Categories = () => {
  const categories = useCategory();
  return (
    <Layout title={"All Categories"}>
      <div className="container d-flex justify-content-center pt-5">
        <div className="w-100" style={{ maxWidth: "400px" }}>
          {categories.map((c) => (
            <div className="mb-3" key={c._id}>
              <Link to={`/category/${c.slug}`} className="btn btn-primary w-100">
                {c.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;