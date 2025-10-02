import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../context/auth';
import Dashboard from './Dashboard';

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('../../components/Layout', () =>
  jest.fn(({ children }) => <div>{children}</div>)
);

jest.mock('../../components/UserMenu', () =>
  jest.fn(() => <div>User Menu</div>)
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders UserMenu inside Dashboard', () => {
    render(<Dashboard />);

    expect(screen.getByText('User Menu')).toBeInTheDocument();
  });

  it('displays user details when auth user exists', () => {
    const mockUser = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      address: '123 Main St',
    };

    useAuth.mockReturnValue([{ user: mockUser }, jest.fn()]);

    render(<Dashboard />);

    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.address)).toBeInTheDocument();
  });

  it.each([
    ['user is null', [{ user: null }, jest.fn()]],
    ['auth is null', [null, jest.fn()]],
  ])('displays empty fields when %s', (description, mockAuth) => {
    useAuth.mockReturnValue(mockAuth);

    render(<Dashboard />);

    expect(screen.queryByText(/@/)).not.toBeInTheDocument(); // email
    expect(screen.queryByText(/Main St/)).not.toBeInTheDocument(); // address
    expect(screen.queryByText(/Doe/)).not.toBeInTheDocument(); // name
  });
});
