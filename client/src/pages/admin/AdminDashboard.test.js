import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../context/auth';
import AdminDashboard from './AdminDashboard';

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('../../components/Layout', () =>
  jest.fn(({ children }) => <div>{children}</div>)
);

jest.mock('../../components/AdminMenu', () =>
  jest.fn(() => <div>Admin Menu</div>)
);

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the admin dashboard when all user data is present', () => {
    useAuth.mockReturnValue([
      {
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '81234567',
        },
      },
      jest.fn(),
    ]);

    render(<AdminDashboard />);

    expect(screen.getByRole('heading', { name: 'Admin Name: John Doe' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Email: john.doe@example.com' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Contact: 81234567' })).toBeInTheDocument();
  });

  it('should render the admin dashboard when user is null', () => {
    useAuth.mockReturnValue([{ user: null }, jest.fn()]);

    render(<AdminDashboard />);

    expect(screen.getByRole('heading', { name: 'Admin Name:' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Email:' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Contact:' })).toBeInTheDocument();
  });

  it('should render the admin dashboard when auth is null', () => {
    useAuth.mockReturnValue([null, jest.fn()]);

    render(<AdminDashboard />);

    expect(screen.getByRole('heading', { name: 'Admin Name:' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Email:' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Contact:' })).toBeInTheDocument();
  });
});
