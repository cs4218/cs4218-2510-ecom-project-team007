import React from "react";
import { render, screen } from "@testing-library/react";
import Orders from "./Orders";
import { useAuth } from "../../context/auth";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("axios");

jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/UserMenu", () => () => <div>UserMenu</div>);


describe("Orders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([
      {
        token: "test-token",
        user: { name: "John Doe", email: "john@example.com" },
      },
      jest.fn(), // setAuth
    ]);
  });

  it("renders orders correctly", async () => {
    // Mock orders data
    const mockOrders = [
      {
        _id: "order1",
        status: "Delivered",
        buyer: { name: "John Doe" },
        createAt: "2025-10-16T10:00:00Z",
        payment: { success: true },
        products: [
          { _id: "prod1", name: "Product 1", description: "Desc 1", price: 100 },
        ],
      },
    ];

    axios.get.mockResolvedValue({ data: mockOrders });

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    // Use findByText to wait for elements
    const orderStatus = await screen.findByText("Delivered");
    const buyerName = await screen.findByText("John Doe");
    const productName = await screen.findByText("Product 1");
    const productPrice = await screen.findByText("Price : 100");

    // Assertions
    expect(orderStatus).toBeInTheDocument();
    expect(buyerName).toBeInTheDocument();
    expect(productName).toBeInTheDocument();
    expect(productPrice).toBeInTheDocument();
    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  
    axios.get.mockRejectedValue(new Error("API error"));

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    await new Promise(process.nextTick);

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleSpy.mockRestore();
  });

  it("does not fetch orders if auth.token is missing", async () => {
    useAuth.mockReturnValue([null, jest.fn()]);
    axios.get.mockResolvedValue({ data: [] }); // should not even be called

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("renders 'Failed' when payment is unsuccessful", async () => {
    const mockOrders = [
        {
        _id: "order2",
        status: "Pending",
        buyer: { name: "Jane Doe" },
        createAt: "2025-10-16T10:00:00Z",
        payment: { success: false },
        products: [
            { _id: "prod2", name: "Product 2", description: "Desc 2", price: 200 },
        ],
        },
    ];

    axios.get.mockResolvedValue({ data: mockOrders });

    render(
        <MemoryRouter>
        <Orders />
        </MemoryRouter>
    );

    const paymentStatus = await screen.findByText("Failed");
    expect(paymentStatus).toBeInTheDocument();
  });
});
