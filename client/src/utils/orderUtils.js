export const groupProductsById = (products) => {
  const grouped = {};

  products?.forEach((product) => {
    if (grouped[product._id]) {
      grouped[product._id].quantity++;
    } else {
      grouped[product._id] = { ...product, quantity: 1 };
    }
  });

  return Object.values(grouped);
};
