export const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ENo image provided%3C/text%3E%3C/svg%3E';

export const getProductImageProps = (product) => {
  return product?.photo
    ? { src: `/api/v1/product/product-photo/${product._id}`, alt: product.name }
    : { src: PLACEHOLDER_IMAGE, alt: 'Product placeholder' };
};
