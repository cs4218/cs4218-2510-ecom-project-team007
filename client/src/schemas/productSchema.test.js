import { productSchema } from './productSchema';

describe('productSchema', () => {
  const product = {
    category: 'Electronics',
    name: 'Laptop',
    description: 'High-performance laptop',
    price: 999.99,
    quantity: 10,
    shipping: true,
  };

  describe('Category Validation', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['empty', ''],
    ])('rejects when category is %s', async (_, category) => {
      await expect(productSchema.validate({ ...product, category }))
        .rejects.toThrow('Category is required');
    });
  });

  describe('Name Validation', () => {
    it.each([
      ['is undefined', undefined],
      ['is null', null],
      ['is empty', ''],
      ['contains only whitespace', '   '],
    ])('rejects when name %s', async (_, name) => {
      await expect(productSchema.validate({ ...product, name }))
        .rejects.toThrow('Product name is required');
    });
  });

  describe('Description Validation', () => {
    it.each([
      ['is undefined', undefined],
      ['is null', null],
      ['is empty', ''],
      ['contains only whitespace', '   '],
    ])('rejects when description %s', async (_, description) => {
      await expect(productSchema.validate({ ...product, description }))
        .rejects.toThrow('Product description is required');
    });
  });

  describe('Price Validation', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['empty', ''],
    ])('rejects when price is %s', async (_, price) => {
      await expect(productSchema.validate({ ...product, price }))
        .rejects.toThrow('Price is required');
    });

    it('rejects when price is not a number', async () => {
      await expect(productSchema.validate({ ...product, price: 'abc' }))
        .rejects.toThrow('Price must be a number');
    });

    it.each([
      ['zero', 0],
      ['negative', -10],
    ])('rejects when price is %s', async (_, price) => {
      await expect(productSchema.validate({ ...product, price }))
        .rejects.toThrow('Price must be greater than 0');
    });

    it('accepts price as a numeric string', async () => {
      const result = await productSchema.validate({ ...product, price: '999.99' });

      expect(result.price).toBe(999.99);
    });
  });

  describe('Quantity Validation', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['empty', ''],
    ])('rejects when quantity is %s', async (_, quantity) => {
      await expect(productSchema.validate({ ...product, quantity }))
        .rejects.toThrow('Quantity is required');
    });

    it('rejects when quantity is not a number', async () => {
      await expect(productSchema.validate({ ...product, quantity: 'abc' }))
        .rejects.toThrow('Quantity must be a valid number');
    });

    it('rejects when quantity is a decimal', async () => {
      await expect(productSchema.validate({ ...product, quantity: 10.5 }))
        .rejects.toThrow('Quantity must be a whole number');
    });

    it('rejects when quantity is negative', async () => {
      await expect(productSchema.validate({ ...product, quantity: -10 }))
        .rejects.toThrow('Quantity cannot be negative');
    });

    it('accepts quantity as a numeric string', async () => {
      const result = await productSchema.validate({ ...product, quantity: '10' });

      expect(result.quantity).toBe(10);
    });
  });

  describe('Shipping Validation', () => {
    it.each([
      ['is undefined', undefined],
      ['is null', null],
    ])('rejects when shipping %s', async (_, shipping) => {
      await expect(productSchema.validate({ ...product, shipping }))
        .rejects.toThrow('Shipping option is required');
    });

    it('accepts the number 1 and converts it to true', async () => {
      const result = await productSchema.validate({ ...product, shipping: 1 });

      expect(result.shipping).toBe(true);
    });

    it('accepts the number 0 and converts it to false', async () => {
      const result = await productSchema.validate({ ...product, shipping: 0 });

      expect(result.shipping).toBe(false);
    });
  });
});
