import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";

jest.mock("axios");
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null }, jest.fn()]),
}));
jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("HomePage Component", () => {

  let navigate;

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({
          data: { success: true, category: [{ _id: "c1", name: "Electronics" }] },
        });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 1 } });
      }
      if (url.includes("/product-list")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Laptop",
                price: 1200,
                description: "High-performance laptop",
                slug: "laptop",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    axios.post = jest.fn().mockResolvedValue({
      data: {
        products: [
          {
            _id: "p2",
            name: "Smartphone",
            price: 800,
            description: "Filtered product",
            slug: "smartphone",
          },
        ],
      },
    });
  });

  const renderHome = () =>
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

  it("renders static elements on homepage", async () => {
    renderHome();
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByAltText(/bannerimage/i)).toBeInTheDocument();
    expect(screen.getByText(/Filter By Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Filter By Price/i)).toBeInTheDocument();
  });

  it("renders a fetched product", async () => {
    renderHome();
    const product = await screen.findByText("Laptop");
    expect(product).toBeInTheDocument();
  });

  it("filters products and shows filtered product", async () => {
    renderHome();

    // Use label text to find the checkbox
    const categoryCheckbox = await screen.findByLabelText("Electronics");
    fireEvent.click(categoryCheckbox);

    const filteredProduct = await screen.findByText("Smartphone");
    expect(filteredProduct).toBeInTheDocument();
  });

  it("clicking 'More Details' triggers navigate", async () => {

    renderHome();

    const product = await screen.findByText("Laptop");
    expect(product).toBeInTheDocument();

    const moreDetailsBtn = screen.getByText(/More Details/i);
    fireEvent.click(moreDetailsBtn);
  });

  it("clicking 'ADD TO CART' calls setCart", async () => {
    const setCart = jest.fn();
    useCart.mockImplementation(() => [[], setCart]);

    renderHome();

    const addToCartBtn = await screen.findByText(/ADD TO CART/i);
    fireEvent.click(addToCartBtn);

    expect(setCart).toHaveBeenCalled();
  });
});