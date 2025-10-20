import { validateProductPhoto } from './photoValidation';

describe('validateProductPhoto', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('returns an error when file is %s', (_, file) => {
    expect(validateProductPhoto(file)).toBe('No file selected');
  });

  it.each([
    ['PDF', 'document.pdf', 'application/pdf'],
    ['GIF', 'image.gif', 'image/gif'],
    ['text', 'document.txt', 'text/plain'],
  ])('returns an error for %s files', (_, filename, mimeType) => {
    const file = new File([''], filename, { type: mimeType });

    expect(validateProductPhoto(file)).toBe('Only JPEG, PNG, or WebP images are allowed');
  });

  it('returns an error when file size exceeds 1MB', () => {
    const file = new File([''], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 + 1 });

    expect(validateProductPhoto(file)).toBe('Photo size must not exceed 1MB');
  });

  it('accepts file exactly 1MB in size', () => {
    const file = new File([''], 'exact.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });

    expect(validateProductPhoto(file)).toBeNull();
  });

  it.each([
    ['JPEG', 'photo.jpeg', 'image/jpeg'],
    ['JPG', 'photo.jpg', 'image/jpg'],
    ['PNG', 'photo.png', 'image/png'],
    ['WebP', 'photo.webp', 'image/webp'],
  ])('accepts %s images', (_, filename, mimeType) => {
    const file = new File([''], filename, { type: mimeType });

    expect(validateProductPhoto(file)).toBeNull();
  });
});
