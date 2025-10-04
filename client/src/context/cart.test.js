import React from "react";
import { render, screen, act } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

// Helper component to test the hook
const TestComponent = () => {
  const [cart, setCart] = useCart();

  return (
    <div>
      <button onClick={() => setCart([{ id: 1, name: "Test Product" }])}>
        Add Item
      </button>
      <ul>
        {cart.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

describe("test cart.js", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with empty cart if localStorage is empty", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("adds an item to the cart", () => {
    render(
      <CartProvider>
      <TestComponent />
      </CartProvider>
    );

    const button = screen.getByText("Add Item");

    act(() => {
        button.click();
    });

    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

    it("initializes cart from localStorage if data exists", () => {
    const storedCart = [{ id: 42, name: "Stored Product" }];
    localStorage.setItem("cart", JSON.stringify(storedCart));

    render(
        <CartProvider>
        <TestComponent />
        </CartProvider>
    );

    expect(screen.getByText("Stored Product")).toBeInTheDocument();
    });
});