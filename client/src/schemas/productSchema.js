import * as Yup from 'yup';

export const productSchema = Yup.object({
  category: Yup.string().required('Category is required'),
  name: Yup.string().trim().required('Product name is required'),
  description: Yup.string().trim().required('Product description is required'),
  price: Yup.number()
    .transform((value, originalValue) => {
      // Convert empty strings to null to trigger required() validation
      return originalValue === '' ? null : value;
    })
    .required('Price is required')
    .typeError('Price must be a number')
    .positive('Price must be greater than 0'),
  quantity: Yup.number()
    .transform((value, originalValue) => {
      // Convert empty strings to null to trigger required() validation
      return originalValue === '' ? null : value;
    })
    .required('Quantity is required')
    .typeError('Quantity must be a valid number')
    .integer('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative'),
  shipping: Yup.boolean().required('Shipping option is required'),
});
