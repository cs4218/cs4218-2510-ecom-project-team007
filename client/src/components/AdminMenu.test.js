import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminMenu from './AdminMenu';

describe('AdminMenu Component', () => {
  const links = [
    { name: 'Create Category', path: '/dashboard/admin/create-category', page: 'Create Category Page' },
    { name: 'Create Product', path: '/dashboard/admin/create-product', page: 'Create Product Page' },
    { name: 'Products', path: '/dashboard/admin/products', page: 'Products Page' },
    { name: 'Orders', path: '/dashboard/admin/orders', page: 'Orders Page' },
    { name: 'Users', path: '/dashboard/admin/users', page: 'Users Page' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  })

  it('renders admin menu with heading and links', () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Admin Panel' })).toBeInTheDocument();

    links.forEach(({ name }) => {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    });
  });

  it('renders navigation links with correct hrefs', () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    links.forEach(({ name, path }) => {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', path);
    });
  });

  it.each(links.map(link => [link.name, link.path, link.page]))(
    'navigates to the %s page when clicked',
    (name, path, page) => {
      render(
        <MemoryRouter initialEntries={['/dashboard/admin']}>
          <Routes>
            <Route path="/dashboard/admin" element={<AdminMenu />} />
            <Route path={path} element={<div>{page}</div>} />
          </Routes>
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name });
      fireEvent.click(link);

      expect(screen.getByText(page)).toBeInTheDocument();
    }
  );
});
