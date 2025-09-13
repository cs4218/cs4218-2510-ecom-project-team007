import React from 'react';

const CategoryForm = ({ handleSubmit, value, setValue }) => {
  return (
    <>
      <form onSubmit={handleSubmit} aria-label="Category Form">
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter new category"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!value.trim()} // Disable button when input is empty or contains only whitespace
        >
          Submit
        </button>
      </form>
    </>
  );
};

export default CategoryForm;
