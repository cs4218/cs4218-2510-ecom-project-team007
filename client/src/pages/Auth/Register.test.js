import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock('../../hooks/useCategory', () => jest.fn(()=> []));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
  };
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  })

  it('should register the user successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: '123 Street' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: '2000-01-01' },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
  });

  it.skip('should display error message on failed registration', async () => {
    axios.post.mockRejectedValueOnce({ message: 'User already exists' });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: '123 Street' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: '2000-01-01' },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  }); // skip test case as the failure of this is due to same email instead of actual error in try catch (wrong unit test for use case)

  it('should display fail if email already registered', async () => {
  axios.post.mockResolvedValueOnce({
    data: { success: false, message: 'Already Register please login' }
  });

  const { getByText, getByPlaceholderText } = render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Doe' } });
  fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
  fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
  fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '9876543210' } });
  fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '456 Avenue' } });
  fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '1999-12-31' } });
  fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Basketball' } });

  fireEvent.click(getByText('REGISTER'));

  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith('Already Register please login'); 
  });

  it('should display generic error message when a network/server error occurs', async () => {
  axios.post.mockRejectedValueOnce(new Error('Network Error'));

  const { getByText, getByPlaceholderText } = render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Error User' } });
  fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'error@example.com' } });
  fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
  fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
  fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
  fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
  fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

  fireEvent.click(getByText('REGISTER'));
  
  await waitFor(() => expect(axios.post).toHaveBeenCalled());

  expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should fail if phone contains letters', async () => {
  const { getByText, getByPlaceholderText } = render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
  fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'john@example.com' } });
  fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
  fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: 'abc123' } }); //  invalid phone number
  fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
  fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
  fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

  fireEvent.click(getByText('REGISTER'));

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Phone must contain only numbers'));
  expect(axios.post).not.toHaveBeenCalled();
});

it('should show error if DOB is in the future', async () => {
  const { getByText, getByPlaceholderText } = render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  );

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Future User' } });
  fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'future@example.com' } });
  fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
  fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
  fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
  const dobInput = getByPlaceholderText('Enter Your DOB');
  dobInput.removeAttribute('max');
  fireEvent.change(dobInput, { target: { value: futureDateStr } });
  fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

  fireEvent.click(getByText('REGISTER'));

  await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('DOB cannot be in the future')});
  expect(axios.post).not.toHaveBeenCalled();

});
});
