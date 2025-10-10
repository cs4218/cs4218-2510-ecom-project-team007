import { PLACEHOLDER_IMAGE, getProductImageProps } from './productImage';

describe('getProductImageProps', () => {
  const mockProduct = {
    _id: '1',
    name: 'Laptop',
    photo: {
      contentType: 'image/jpeg',
    },
  };

  it('returns actual image props when product has a photo', () => {
    expect(getProductImageProps(mockProduct)).toEqual({
      src: `/api/v1/product/product-photo/${mockProduct._id}`,
      alt: mockProduct.name,
    });
  });

  it.each([
    ['product has no photo', { ...mockProduct, photo: null }],
    ['product is null', null],
    ['product is undefined', undefined],
  ])('returns placeholder props when %s', (_, product) => {
    expect(getProductImageProps(product)).toEqual({
      src: PLACEHOLDER_IMAGE,
      alt: 'Product placeholder',
    });
  });
});
