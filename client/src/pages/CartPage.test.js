import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CartPage from "./CartPage";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../context/cart");
jest.mock("../context/auth");

jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../components/Header", () => () => <div>Header</div>);
jest.mock("../components/Form/SearchInput", () => () => <input />);
jest.mock("axios");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("braintree-web-drop-in-react", () => jest.fn(() => <div>DropIn</div>));

describe("CartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(jest.fn());
    axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });
  });

  it("renders cart item and total price", async () => {
    // Mock cart with 1 item
    const setCart = jest.fn();
    
    useCart.mockReturnValue([[{ _id: "1", name: "Test Item", price: 10, description: "Test Description" }], setCart]);
    useAuth.mockReturnValue([{ user: { name: "John", address: "Addr" }, token: "token" }]);

    render(
        <MemoryRouter>
        <CartPage />
        </MemoryRouter>
    );

    // Assert cart item is displayed
    const itemName = await screen.findByText("Test Item");
    expect(itemName).toBeInTheDocument();

    // Assert total price is displayed
    const total = await screen.findByText("Total : $10.00");
    expect(total).toBeInTheDocument();
  });

  it("renders empty cart message", async () => {
    const setCart = jest.fn();

    useCart.mockReturnValue([[], setCart]);
    useAuth.mockReturnValue([{ user: { name: "John", address: "Addr" }, token: "token" }]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    const emptyMsg = await screen.findByText(/your cart is empty/i);
    expect(emptyMsg).toBeInTheDocument();
  });

  it("handles client token fetch error gracefully", async () => {
    const setCart = jest.fn();

    useCart.mockReturnValue([[{ _id: "1", name: "Test Item", price: 10, description: "Test Description" }], setCart]);
    useAuth.mockReturnValue([{ user: { name: "John", address: "Addr" }, token: "token" }]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const itemName = await screen.findByText("Test Item");
    expect(itemName).toBeInTheDocument();
  });

  it("renders multiple items and total price correctly", async () => {
    const setCart = jest.fn();

    useCart.mockReturnValue([
        [
        { _id: "1", name: "Item 1", price: 10, description: "Desc1" },
        { _id: "2", name: "Item 2", price: 20, description: "Desc2" }
        ],
        setCart
    ]);
    useAuth.mockReturnValue([{ user: { name: "John", address: "Addr" }, token: "token" }]);

    render(
        <MemoryRouter>
            <CartPage />
        </MemoryRouter>
    );

    expect(await screen.findByText("Item 1")).toBeInTheDocument();
    expect(await screen.findByText("Item 2")).toBeInTheDocument();
    expect(await screen.findByText("Total : $30.00")).toBeInTheDocument();
  });

  it("handles bad data for price in cart", async () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([[{ _id: "1", name: "Test Item", price: null, description: "Test Description" }], setCart]);
    useAuth.mockReturnValue([{ user: { name: "John", address: "Addr" }, token: "token" }]);

    render(<MemoryRouter><CartPage /></MemoryRouter>);
    
    await waitFor(() => expect(console.log).toHaveBeenCalled());
  });

  it("removes item from cart when removeCartItem is called", async () => {
    const setCart = jest.fn();
    
    const cartItems = [
      { _id: "1", name: "Item 1", price: 10, description: "Desc1" },
      { _id: "2", name: "Item 2", price: 20, description: "Desc2" }
    ];
    useCart.mockReturnValue([cartItems, setCart]);

    render(<MemoryRouter><CartPage /></MemoryRouter>);

    const removeButtons = await screen.findAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    expect(setCart).toHaveBeenCalledWith([cartItems[1]]); // first item removed
  });
});

describe("CartPage address & payment UI", () => {
  let setCart;
  let navigate;

  beforeEach(() => {
    jest.clearAllMocks();
    setCart = jest.fn();
    localStorage.clear();
    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
  });

  it("shows Update Address for logged-in user", async () => {
    useAuth.mockReturnValue([{ user: { name: "John", address: "Addr" }, token: "token" }]);
    useCart.mockReturnValue([[{ _id: "1", name: "Item", price: 10, description: "Test Description" }], setCart]);
    render(<MemoryRouter><CartPage /></MemoryRouter>);

    const updateButton = screen.getByText("Update Address");
    fireEvent.click(updateButton);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/dashboard/user/profile"));
  });

  it("shows Login button for logged-out user", async () => {
    useAuth.mockReturnValue([{}]); // no token
    useCart.mockReturnValue([[{ _id: "1", name: "Item", price: 10, description: "Test Description" }], setCart]);
    render(<MemoryRouter><CartPage /></MemoryRouter>);

    const loginButton = screen.getByText("Plase Login to checkout");
    fireEvent.click(loginButton);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login", { state: "/cart" }));
  });

  it("renders DropIn when logged in with clientToken and items", async () => {
    useAuth.mockReturnValue([{ user: { name: "John", address: "Addr" }, token: "token" }]);
    useCart.mockReturnValue([[{ _id: "1", name: "Item", price: 10, description: "Test Description" }], setCart]);
    axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });

    render(<MemoryRouter><CartPage /></MemoryRouter>);

    expect(await screen.findByText("DropIn")).toBeInTheDocument();
  });
});
