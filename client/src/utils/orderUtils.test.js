import { groupProductsById } from './orderUtils';

describe('groupProductsById', () => {
  const product1 = {
    _id: 'product1',
    name: 'Laptop',
    description: 'High-performance laptop',
    price: 999.99,
  };

  const product2 = {
    _id: 'product2',
    name: 'Mouse',
    description: 'Wireless mouse',
    price: 29.99,
  };

  it('groups unique and duplicate products', () => {
    const result = groupProductsById([product1, product2, product2]);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ ...product1, quantity: 1 });
    expect(result).toContainEqual({ ...product2, quantity: 2 });
  });

  it.each([
    ['empty', []],
    ['null', null],
    ['undefined', undefined],
  ])('returns an empty array when products is %s', (_, products) => {
    expect(groupProductsById(products)).toEqual([]);
  });
});
