import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminMenu from './AdminMenu';

describe('AdminMenu Component', () => {
  const links = [
    { name: 'Create Category', path: '/dashboard/admin/create-category' },
    { name: 'Create Product', path: '/dashboard/admin/create-product' },
    { name: 'Products', path: '/dashboard/admin/products' },
    { name: 'Orders', path: '/dashboard/admin/orders' },
    { name: 'Users', path: '/dashboard/admin/users' },
  ];

  const renderWithRouter = (component) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with heading and links', () => {
    renderWithRouter(<AdminMenu />);

    expect(screen.getByRole('heading', { name: 'Admin Panel' })).toBeInTheDocument();

    links.forEach(({ name }) => {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    });
  });

  it('renders navigation links with correct paths', () => {
    renderWithRouter(<AdminMenu />);

    links.forEach(({ name, path }) => {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', path);
    });
  });
});
