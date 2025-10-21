import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../context/auth';
import AdminDashboard from './AdminDashboard';

jest.mock('../../components/AdminMenu', () =>
  jest.fn(() => <div>Admin Menu</div>)
);

jest.mock('../../components/Layout', () =>
  jest.fn(({ children }) => <div>{children}</div>)
);

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays admin details when user exists', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '81234567',
    };

    useAuth.mockReturnValue([{ user: mockUser }]);

    render(<AdminDashboard />);

    expect(screen.getByRole('heading', { name: `Admin Name: ${mockUser.name}` })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: `Admin Email: ${mockUser.email}` })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: `Admin Contact: ${mockUser.phone}` })).toBeInTheDocument();
  });

  it.each([
    ['user is null', [{ user: null }]],
    ['auth is null', [null]],
  ])('displays empty admin fields when %s', (_, mockAuth) => {
    useAuth.mockReturnValue(mockAuth);

    render(<AdminDashboard />);

    expect(screen.getByRole('heading', { name: 'Admin Name:' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Email:' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Contact:' })).toBeInTheDocument();
  });
});
