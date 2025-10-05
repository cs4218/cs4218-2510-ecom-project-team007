const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const validateProductPhoto = (file) => {
  if (!file) {
    return 'No file selected';
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, or WebP images are allowed';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Photo size must not exceed 1MB';
  }

  return null;
};
