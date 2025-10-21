import React from "react";
import { render, screen } from "@testing-library/react";
import Search from "./Search";
import { useSearch } from "../context/search";
import { BrowserRouter } from "react-router-dom";
import { useCart } from "../context/cart";

// mock Layout since we only care about the content
jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);

// mock useSearch context hook
jest.mock("../context/search");
jest.mock("../context/cart"); 

const mockSetCart = jest.fn();

describe("Search Component", () => {

  beforeEach(() => {
    useCart.mockReturnValue([[], mockSetCart]);
  });

  it("renders correctly without search results", () => {

    useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    expect(screen.getByText("Search Results")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("renders correctly with search results", async () => {
    const mockResults = [
      {
        _id: "123",
        name: "Test Product",
        description: "This is a test description",
        price: 49.99,
      },
    ];

    useSearch.mockReturnValue([{ keyword: "test", results: mockResults }, jest.fn()]);
    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    
    const foundText = await screen.findByText("Found 1");
    const productName = await screen.findByText("Test Product");
    const productPrice = await screen.findByText("$ 49.99");
    const productDesc = await screen.findByText(/This is a test description/);

    expect(foundText).toBeInTheDocument();
    expect(productName).toBeInTheDocument();
    expect(productPrice).toBeInTheDocument();
    expect(productDesc).toBeInTheDocument();
  });
});
