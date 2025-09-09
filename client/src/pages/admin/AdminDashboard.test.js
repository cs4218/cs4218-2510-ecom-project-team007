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

  it('should render AdminMenu inside AdminDashboard', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('Admin Menu')).toBeInTheDocument();
  });

  it('should render AdminDashboard when all user data is present', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '81234567',
    };

    useAuth.mockReturnValue([{ user: mockUser }, jest.fn()]);

    render(<AdminDashboard />);

    expect(screen.getByRole('heading', { name: `Admin Name: ${mockUser.name}` })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: `Admin Email: ${mockUser.email}` })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: `Admin Contact: ${mockUser.phone}` })).toBeInTheDocument();
  });

  it.each([
    ['user is null', [{ user: null }, jest.fn()]],
    ['auth is null', [null, jest.fn()]],
  ])('should render AdminDashboard when %s', (description, mockAuth) => {
    useAuth.mockReturnValue(mockAuth);

    render(<AdminDashboard />);

    expect(screen.getByRole('heading', { name: 'Admin Name:' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Email:' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Contact:' })).toBeInTheDocument();
  });
});
