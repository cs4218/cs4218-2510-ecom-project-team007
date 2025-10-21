import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import slugify from 'slugify';

test.describe('Category Management', () => {
  const generateCategoryName = () => {
    return `${faker.commerce.department()}-${faker.string.alphanumeric(8)}`;
  };

  const createCategory = async (page, name) => {
    await page.getByPlaceholder('Enter new category').fill(name);
    await page.getByRole('button', { name: /submit/i }).click();

    await expect(page.getByRole('cell', { name })).toBeVisible();
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin/create-category');
    await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();
  });

  test.describe('Create Category', () => {
    test('creates a new category successfully', async ({ page }) => {
      const name = generateCategoryName();

      await page.getByPlaceholder('Enter new category').fill(name);
      await page.getByRole('button', { name: /submit/i }).click();

      await expect(page.getByText(`${name} created successfully`)).toBeVisible();
      await expect(page.getByRole('cell', { name })).toBeVisible();
    });

    test('clears the input field after creating a category', async ({ page }) => {
      const name = generateCategoryName();
      const input = page.getByPlaceholder('Enter new category');

      await input.fill(name);
      await page.getByRole('button', { name: /submit/i }).click();

      await expect(page.getByRole('cell', { name })).toBeVisible();
      await expect(input).toHaveValue('');
    });

    test('shows an error message when the category name already exists', async ({ page }) => {
      const name = generateCategoryName();
      const input = page.getByPlaceholder('Enter new category');
      const submitButton = page.getByRole('button', { name: /submit/i });

      await input.fill(name);
      await submitButton.click();

      await expect(page.getByRole('cell', { name })).toBeVisible();

      await input.fill(name.toUpperCase());
      await submitButton.click();

      await expect(page.getByText('Category already exists')).toBeVisible();
    });
  });

  test.describe('Update Category', () => {
    const updateCategory = async (page, oldName, newName) => {
      const row = page.getByRole('cell', { name: oldName }).locator('..');
      await row.getByRole('button', { name: /edit/i }).click();

      const modal = page.getByRole('dialog');
      await modal.getByRole('textbox').fill(newName);
      await modal.getByRole('button', { name: /submit/i }).click();
    };

    test('updates a category successfully', async ({ page }) => {
      const name = generateCategoryName();
      const updatedName = generateCategoryName();

      await createCategory(page, name);
      await updateCategory(page, name, updatedName);

      await expect(page.getByText(`${updatedName} updated successfully`)).toBeVisible();
      await expect(page.getByRole('cell', { name: updatedName })).toBeVisible();
      await expect(page.getByRole('cell', { name })).not.toBeVisible();
    });

    test('shows an error message when the updated category name already exists', async ({ page }) => {
      const name = generateCategoryName();
      const updatedName = generateCategoryName();

      await createCategory(page, name);
      await createCategory(page, updatedName);

      await updateCategory(page, name, updatedName);

      await expect(page.getByText('Category already exists')).toBeVisible();
    });
  });

  test.describe('Delete Category', () => {
    let name;

    const deleteCategory = async (page, name) => {
      const row = page.getByRole('cell', { name }).locator('..');
      await row.getByRole('button', { name: /delete/i }).click();

      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /delete/i }).click();
    };

    const fillProductForm = async (page) => {
      const categorySelect = page.getByTestId('category-select');
      await categorySelect.click();
      await categorySelect.getByRole('combobox').fill(name);
      await page.getByTitle(name).click();

      await page.getByPlaceholder('Enter product name').fill(faker.commerce.productName());
      await page.getByPlaceholder('Enter product description').fill('Test product description');
      await page.getByPlaceholder('Enter price').fill('99');
      await page.getByPlaceholder('Enter quantity').fill('10');

      await page.getByTestId('shipping-select').click();
      await page.getByTitle('Yes').click();
    };

    const createProduct = async (page) => {
      await page.goto('/dashboard/admin/create-product');

      await fillProductForm(page);
      await page.getByRole('button', { name: /create product/i }).click();

      await expect(page).toHaveURL('/dashboard/admin/products');
    };

    test.beforeEach(async ({ page }) => {
      name = generateCategoryName();
      await createCategory(page, name);
    });

    test('shows a confirmation dialog when deleting a category', async ({ page }) => {
      const row = page.getByRole('cell', { name }).locator('..');
      await row.getByRole('button', { name: /delete/i }).click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/delete category/i)).toBeVisible();
    });

    test('deletes a category successfully after confirmation', async ({ page }) => {
      await deleteCategory(page, name);

      await expect(page.getByRole('cell', { name })).not.toBeVisible();
    });

    test('does not delete a category when canceling the deletion', async ({ page }) => {
      const row = page.getByRole('cell', { name }).locator('..');
      await row.getByRole('button', { name: /delete/i }).click();

      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /cancel/i }).click();

      await expect(page.getByRole('cell', { name })).toBeVisible();
    });

    test('shows an error message when deleting a category with products', async ({ page }) => {
      await createProduct(page);
      await page.goto('/dashboard/admin/create-category');

      await deleteCategory(page, name);

      await expect(page.getByText('Category still has products')).toBeVisible();
      await expect(page.getByRole('cell', { name })).toBeVisible();
    });
  });
});
