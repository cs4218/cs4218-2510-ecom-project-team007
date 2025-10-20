/**
 * Integration test for the order page.
 * 
 * As this test will be executed by github actions, we would need to use a testing double, specifically fake, to handle any DB interactions as Github Actions does not have access to the real database.
 * We are interested in testing the interactions between placing an order (CartPage), navigation to the order page, and rendering of the order page with the correct data.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CartPage from '../CartPage';
import Orders from './Orders';
import axios from 'axios';
import { useAuth, AuthProvider } from '../../context/auth';
import { useCart, CartProvider } from '../../context/cart';
import { useSearch, SearchProvider } from '../../context/search';
import { useNavigate } from 'react-router-dom';

// Suppress console errors for act warnings in this test
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock matchMedia for react-hot-toast
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Fake database
const fakeDb = {
  cart: [],
  orders: [],
  
  addToCart(item) {
    this.cart.push(item);
  },
  getCart() {
    return this.cart;
  },
  clearCart() {
    this.cart = [];
  },
  createOrder() {
    const order = {
      _id: Date.now().toString(),
      products: [...this.cart],
      totalPrice: this.cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
      status: "confirmed",
      buyer: { name: "Test User" },
      payment: { success: true },
      createAt: new Date(),
    };
    this.orders.push(order);
    this.clearCart();
    return order;
  },
  getOrders() {
    return this.orders;
  },
};

// Mock the DropIn component from braintree-web-drop-in-react
// Define the mock instance that will be shared
const createMockInstance = () => ({
  requestPaymentMethod: jest.fn(() => {
    return Promise.resolve({ nonce: 'fake-nonce' });
  }),
  teardown: jest.fn(),
});

let mockBraintreeInstance = createMockInstance();

jest.mock('braintree-web-drop-in-react', () => {
  const React = require('react');
  
  return function DropIn({ onInstance }) {
    // Call onInstance immediately to set the instance
    React.useEffect(() => {
      // Create a mock instance with the required methods
      const instance = {
        requestPaymentMethod: jest.fn(() => Promise.resolve({ nonce: 'fake-nonce' })),
        teardown: jest.fn(),
      };
      onInstance(instance);
    }, [onInstance]);
    
    // Return a simple div instead of the actual Braintree UI
    return React.createElement('div', { 'data-testid': 'braintree-dropin' }, 'Braintree Drop-in');
  };
});

jest.mock('axios', () => ({
  get: jest.fn((url) => {
    if (url === '/api/v1/product/braintree/token') {
      return Promise.resolve({ data: { clientToken: 'fake-token' } });
    }
    if (url === '/api/v1/auth/orders') {
      return Promise.resolve({ data: fakeDb.getOrders() });
    }
    return Promise.resolve({ data: {} });
  }),
  post: jest.fn((url, body) => {
    if (url === "/api/v1/product/braintree/payment") {
        // Create order in fake DB
        const order = fakeDb.createOrder();
        return Promise.resolve({ 
          data: { 
            ok: true, 
            success: true,
            order 
          } 
        });
    }
    return Promise.resolve({ data: { success: true } });
  }),
}));

axios.get.mockImplementation((url) => {
  if (url === "/api/v1/auth/user-auth") {
    return Promise.resolve({ data: { ok: true } });
  }
  if (url === '/api/v1/product/braintree/token') {
    return Promise.resolve({ data: { clientToken: 'fake-token' } });
  }
  if (url === '/api/v1/auth/orders') {
    return Promise.resolve({ data: fakeDb.getOrders() });
  }
  return Promise.resolve({ data: {} });
});

jest.mock('../../context/cart', () => {
  const React = require('react');

  const cartContext = React.createContext();

  const useCart = () => React.useContext(cartContext);

  const CartProvider = ({ children }) => {
    const [cart, setCart] = React.useState(fakeDb.getCart());

    const addToCart = (item) => {
      fakeDb.addToCart(item);
      setCart([...fakeDb.getCart()]);
    };

    const clearCart = () => {
      fakeDb.clearCart();
      setCart([]);
    };

    return (
      <cartContext.Provider value={[cart, setCart, { addToCart, clearCart }]}>
        {children}
      </cartContext.Provider>
    );
  };

  return { useCart, CartProvider };
});


jest.mock('../../context/auth', () => {
  const React = require('react');
  const authContext = React.createContext();
  const useAuth = () => React.useContext(authContext);
  const AuthProvider = ({ children }) => {
    const [auth, setAuth] = React.useState({
      token: 'fake-token',
      user: { name: 'Test User', address: '123 Test Street' },
    });
    return <authContext.Provider value={[auth, setAuth]}>{children}</authContext.Provider>;
  };
  return { useAuth, AuthProvider };
});

jest.mock('../../context/search', () => {
  const React = require('react');
  const searchContext = React.createContext();
  const useSearch = () => React.useContext(searchContext);
  const SearchProvider = ({ children }) => {
    const [values, setValues] = React.useState({ keyword: '', results: [] });
    return (
      <searchContext.Provider value={[values, setValues]}>
        {children}
      </searchContext.Provider>
    );
  };
  return { useSearch, SearchProvider };
});



const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

describe("Cart → Orders integration (with fake DB)", () => {
  beforeEach(() => {
    fakeDb.cart = [
      { _id: '1', name: 'Test Product', description: 'A great item', price: 50, quantity: 1 }
    ];
    fakeDb.orders = [];
    jest.clearAllMocks();
    mockBraintreeInstance = createMockInstance();
  });

  it("Cart items propagate to Orders page after payment", async () => {
    // Render CartPage
    render(
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <MemoryRouter>
              <CartPage />
            </MemoryRouter>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    );

    // Wait for cart to render
    expect(await screen.findByText(/Test Product/i)).toBeInTheDocument();

    // Wait for Braintree Drop-in to render
    expect(await screen.findByTestId('braintree-dropin')).toBeInTheDocument();

    // Wait for the payment button to appear and become enabled
    const payButton = await screen.findByRole('button', { name: /make payment/i });
    
    // Wait for the button to be enabled (instance should be set by now)
    await waitFor(() => {
      expect(payButton).not.toBeDisabled();
    }, { timeout: 3000 });

    // Click Make Payment
    await userEvent.click(payButton);

    // Wait for the payment API to be called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        expect.objectContaining({
          nonce: 'fake-nonce',
          cart: expect.any(Array)
        })
      );
    }, { timeout: 3000 });

    // Wait for navigation to be called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
    }, { timeout: 3000 });

    // Verify order was created in fake DB
    expect(fakeDb.getOrders()).toHaveLength(1);
    expect(fakeDb.getOrders()[0].products[0].name).toBe('Test Product');

    // Manually render Orders page after "navigation"
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      render(
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <MemoryRouter>
                <Orders />
              </MemoryRouter>
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      );
    });

    // Check Orders page title
    expect(await screen.findByText(/All Orders/i)).toBeInTheDocument();

    // Verify the order shows the correct product
    expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
    expect(screen.getByText(/Price : 50/i)).toBeInTheDocument();
  });
});