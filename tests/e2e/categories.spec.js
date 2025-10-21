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
    await expect(page.locator('h1')).toContainText('Manage Category');
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

    test('shows an error message when the category already exists', async ({ page }) => {
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
      const input = modal.getByRole('textbox');

      await input.clear();
      await input.fill(newName);
      await modal.getByRole('button', { name: /submit/i }).click();
    };

    test('updates a category successfully', async ({ page }) => {
      const oldName = generateCategoryName();
      const newName = generateCategoryName();

      await createCategory(page, oldName);
      await updateCategory(page, oldName, newName);

      await expect(page.getByText(`${newName} updated successfully`)).toBeVisible();
      await expect(page.getByRole('cell', { name: newName })).toBeVisible();
      await expect(page.getByRole('cell', { name: oldName })).not.toBeVisible();
    });

    test('shows an error message when the new category already exists', async ({ page }) => {
      const name1 = generateCategoryName();
      const name2 = generateCategoryName();

      await createCategory(page, name1);
      await createCategory(page, name2);

      await updateCategory(page, name1, name2);

      await expect(page.getByText('Category already exists')).toBeVisible();
    });
  });

  test.describe('Delete Category', () => {
    const deleteCategory = async (page, name) => {
      const row = page.getByRole('cell', { name }).locator('..');
      await row.getByRole('button', { name: /delete/i }).click();

      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /delete/i }).click();
    };

    const getCategory = async (page, name) => {
      const response = await page.request.get(
        `/api/v1/category/single-category/${slugify(name)}`
      );
      const { category } = await response.json();
      return category;
    };

    const getAuthToken = async (page) => {
      const data = await page.evaluate(() => localStorage.getItem('auth'));
      return JSON.parse(data).token;
    };

    const createProduct = async (page, categoryId) => {
      const token = await getAuthToken(page);
      
      await page.request.post('/api/v1/product/create-product', {
        headers: {
          Authorization: token,
        },
        multipart: {
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: '99.99',
          category: categoryId,
          quantity: '10',
          shipping: 'false',
        },
      });
    };

    test('shows a confirmation dialog when deleting a category', async ({ page }) => {
      const name = generateCategoryName();

      await createCategory(page, name);

      const row = page.getByRole('cell', { name }).locator('..');
      await row.getByRole('button', { name: /delete/i }).click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/delete category/i)).toBeVisible();
    });

    test('deletes a category successfully after confirmation', async ({ page }) => {
      const name = generateCategoryName();

      await createCategory(page, name);

      await deleteCategory(page, name);

      await expect(page.getByRole('cell', { name })).not.toBeVisible();
    });

    test('does not delete a category when canceling the deletion', async ({ page }) => {
      const name = generateCategoryName();

      await createCategory(page, name);

      const row = page.getByRole('cell', { name }).locator('..');
      await row.getByRole('button', { name: /delete/i }).click();

      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /cancel/i }).click();

      await expect(page.getByRole('cell', { name })).toBeVisible();
    });

    test('shows an error message when deleting a category with products', async ({ page }) => {
      const name = generateCategoryName();

      await createCategory(page, name);

      const category = await getCategory(page, name);
      await createProduct(page, category._id);

      await deleteCategory(page, name);

      await expect(page.getByText('Category still has products')).toBeVisible();
      await expect(page.getByRole('cell', { name })).toBeVisible();
    });
  });
});
