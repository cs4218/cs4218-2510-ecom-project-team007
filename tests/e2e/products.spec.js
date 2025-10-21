import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import slugify from 'slugify';

test.describe('Product Management', () => {
  const VALID_IMAGE_FILE = 'tests/fixtures/test-image.jpg';
  const UNSUPPORTED_IMAGE_TYPE = 'tests/fixtures/test-image.gif';

  let defaultCategory;

  const generateCategoryName = () => {
    return `${faker.commerce.department()}-${faker.string.alphanumeric(8)}`;
  };

  const generateProductName = () => {
    return `${faker.commerce.productName()}-${faker.string.alphanumeric(8)}`;
  };

  const fillProductForm = async (page, data = {}) => {
    const {
      category = defaultCategory,
      name = generateProductName(),
      description = 'Test product description',
      price = '99.99',
      quantity = '10',
      shipping = 'Yes',
    } = data;

    const categorySelect = page.getByTestId('category-select');
    await categorySelect.click();
    await categorySelect.getByRole('combobox').fill(category);
    await page.getByTitle(category).click();

    await page.getByPlaceholder('Enter product name').fill(name);
    await page.getByPlaceholder('Enter product description').fill(description);
    await page.getByPlaceholder('Enter price').fill(price);
    await page.getByPlaceholder('Enter quantity').fill(quantity);

    await page.getByTestId('shipping-select').click();
    await page.getByTitle(shipping).click();
  };

  const createProduct = async (page, name) => {
    await page.goto('/dashboard/admin/create-product');

    await fillProductForm(page, { name });
    await page.getByRole('button', { name: /create product/i }).click();

    await expect(page).toHaveURL('/dashboard/admin/products');
  };

  test.beforeEach(async ({ page }) => {
    if (!defaultCategory) {
      defaultCategory = generateCategoryName();

      await page.goto('/dashboard/admin/create-category');
      await page.getByPlaceholder('Enter new category').fill(defaultCategory);
      await page.getByRole('button', { name: /submit/i }).click();

      await expect(page.getByRole('cell', { name: defaultCategory })).toBeVisible();
    }
  });

  test.describe('Create Product', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/admin/create-product');
      await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
    });

    test('creates a new product with a photo successfully', async ({ page }) => {
      const name = generateProductName();

      await fillProductForm(page, { name });
      await page.getByLabel('Upload photo').setInputFiles(VALID_IMAGE_FILE);
      await page.getByRole('button', { name: /create product/i }).click();

      await expect(page).toHaveURL('/dashboard/admin/products');
      await expect(page.getByText('Product created successfully')).toBeVisible();
      await expect(page.getByRole('heading', { name })).toBeVisible();
    });

    test('creates a new product without a photo successfully', async ({ page }) => {
      const name = generateProductName();

      await fillProductForm(page, { name });
      await page.getByRole('button', { name: /create product/i }).click();

      await expect(page).toHaveURL('/dashboard/admin/products');
      await expect(page.getByText('Product created successfully')).toBeVisible();
      await expect(page.getByRole('heading', { name })).toBeVisible();
    });

    test('shows an error message when the product name already exists', async ({ page }) => {
      const name = generateProductName();

      await fillProductForm(page, { name });
      await page.getByRole('button', { name: /create product/i }).click();

      await expect(page).toHaveURL('/dashboard/admin/products');

      await page.goto('/dashboard/admin/create-product');
      await fillProductForm(page, { name: name.toUpperCase() });
      await page.getByRole('button', { name: /create product/i }).click();

      await expect(page.getByText('Product name already exists')).toBeVisible();
    });

    test('shows an error message for the first invalid field', async ({ page }) => {
      await page.getByRole('button', { name: /create product/i }).click();

      await expect(page.getByText('Category is required')).toBeVisible();
    });

    test('shows an error message when uploading an invalid photo', async ({ page }) => {
      await page.getByLabel('Upload photo').setInputFiles(UNSUPPORTED_IMAGE_TYPE);

      await expect(page.getByText(/jpeg|png|webp/i)).toBeVisible();
    });
  });

  test.describe('Update Product', () => {
    let name;
    let slug;

    test.beforeEach(async ({ page }) => {
      name = generateProductName();
      slug = slugify(name);
      await createProduct(page, name);

      await page.getByRole('heading', { name }).click();

      await expect(page).toHaveURL(`/dashboard/admin/product/${slug}`);
      await expect(page.getByPlaceholder('Enter product name')).toHaveValue(name);
    });

    test('updates a product with a photo successfully', async ({ page }) => {
      const updatedName = generateProductName();

      await page.getByPlaceholder('Enter product name').fill(updatedName);
      await page.getByLabel('Upload photo').setInputFiles(VALID_IMAGE_FILE);
      await page.getByRole('button', { name: /update product/i }).click();

      await expect(page).toHaveURL('/dashboard/admin/products');
      await expect(page.getByText('Product updated successfully')).toBeVisible();
      await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
      await expect(page.getByRole('heading', { name })).not.toBeVisible();
    });

    test('updates a product without a photo successfully', async ({ page }) => {
      const updatedName = generateProductName();

      await page.getByPlaceholder('Enter product name').fill(updatedName);
      await page.getByRole('button', { name: /update product/i }).click();

      await expect(page).toHaveURL('/dashboard/admin/products');
      await expect(page.getByText('Product updated successfully')).toBeVisible();
      await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
      await expect(page.getByRole('heading', { name })).not.toBeVisible();
    });

    test('shows an error message when the updated product name already exists', async ({ page }) => {
      const updatedName = generateProductName();
      await createProduct(page, updatedName);

      await page.getByRole('heading', { name }).click();
      await expect(page).toHaveURL(`/dashboard/admin/product/${slug}`);
      await expect(page.getByPlaceholder('Enter product name')).toHaveValue(name);

      await page.getByPlaceholder('Enter product name').fill(updatedName.toUpperCase());
      await page.getByRole('button', { name: /update product/i }).click();

      await expect(page.getByText('Product name already exists')).toBeVisible();
    });

    test('shows an error message for the first invalid field', async ({ page }) => {
      await page.getByPlaceholder('Enter product name').clear();
      await page.getByPlaceholder('Enter product description').clear();

      await page.getByRole('button', { name: /update product/i }).click();

      await expect(page.getByText('Name is required')).toBeVisible();
    });

    test('shows an error message when uploading an invalid photo', async ({ page }) => {
      await page.getByLabel('Upload photo').setInputFiles(UNSUPPORTED_IMAGE_TYPE);

      await expect(page.getByText(/jpeg|png|webp/i)).toBeVisible();
    });
  });

  test.describe('Delete Product', () => {
    let name;
    let slug;

    test.beforeEach(async ({ page }) => {
      name = generateProductName();
      slug = slugify(name);
      await createProduct(page, name);

      await page.getByRole('heading', { name }).click();

      await expect(page).toHaveURL(`/dashboard/admin/product/${slug}`);
      await expect(page.getByPlaceholder('Enter product name')).toHaveValue(name);
    });

    test('shows a confirmation dialog when deleting a product', async ({ page }) => {
      await page.getByRole('button', { name: /delete product/i }).click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('Delete product?')).toBeVisible();
    });

    test('deletes a product successfully after confirmation', async ({ page }) => {
      await page.getByRole('button', { name: /delete product/i }).click();
      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /delete/i }).click();

      await expect(page).toHaveURL('/dashboard/admin/products');
      await expect(page.getByText('Product deleted successfully')).toBeVisible();
      await expect(page.getByRole('heading', { name })).not.toBeVisible();
    });

    test('does not delete the product when canceling the deletion', async ({ page }) => {
      await page.getByRole('button', { name: /delete product/i }).click();
      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /cancel/i }).click();

      await page.reload();
      await expect(page).toHaveURL(`/dashboard/admin/product/${slug}`);
      await expect(page.getByPlaceholder('Enter product name')).toHaveValue(name);
    });
  });
});
