import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";
import toast from "react-hot-toast";
import Header from "./Header";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("./Form/SearchInput", () => () => <div data-testid="search-input" />);
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

const mockCategories = [
  { _id: "1", name: "Electronics", slug: "electronics" },
  { _id: "2", name: "Books", slug: "books" },
];

const renderComponent = () => {
  return render(<Header />, { wrapper: MemoryRouter });
};

describe("Header", () => {
  beforeEach(() => {
    useAuth.mockClear();
    useCart.mockClear();
    useCategory.mockClear();
    toast.success.mockClear();
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });
  // --- User is unauthenticated ---
  describe("when user is not authenticated", () => {
    beforeEach(() => {
      useAuth.mockReturnValue([{ user: null }, jest.fn()]);
      useCart.mockReturnValue([[]]);
      useCategory.mockReturnValue(mockCategories);
    });

    test("it renders the brand link", () => {
      renderComponent();
      const brandLink = screen.getByRole("link", { name: /virtual vault/i });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute("href", "/");
    });

    test("it renders the home link", () => {
      renderComponent();
      expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    });

    test("it renders the register link", () => {
      renderComponent();
      expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
    });

    test("it renders the login link", () => {
      renderComponent();
      expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    });

    test("it renders the search input component", () => {
      renderComponent();
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });

    test("it renders the categories dropdown toggle", async () => {
      renderComponent();
      const categoriesToggle = screen.getByRole("link", { name: "Categories" });
      expect(categoriesToggle).toBeInTheDocument();
    });

    test("it renders the categories dropdown item 'All Categories'", async () => {
      renderComponent();
      const categoriesToggle = screen.getByRole("link", { name: "Categories" });
      categoriesToggle.dispatchEvent(new MouseEvent('click'));
      await waitFor(() => {
        expect(screen.getByRole("link", { name: "All Categories" })).toBeInTheDocument();
      })
    });

    test("it renders the categories dropdown item 'Electronics'", async () => {
      renderComponent();
      const categoriesToggle = screen.getByRole("link", { name: "Categories" });
      categoriesToggle.dispatchEvent(new MouseEvent('click'));
      await waitFor(() => {
        expect(screen.getByRole("link", { name: "Electronics" })).toBeInTheDocument();
      })
    });

    test("it renders the categories dropdown item 'Books'", async () => {
      renderComponent();
      const categoriesToggle = screen.getByRole("link", { name: "Categories" });
      categoriesToggle.dispatchEvent(new MouseEvent('click'));
      await waitFor(() => {
        expect(screen.getByRole("link", { name: "Books" })).toBeInTheDocument()
      });
    });

    test("it does not render the user dropdown menu", () => {
      renderComponent();
      expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    });

    test("it displays zero in the cart badge when cart is empty", () => {
      renderComponent();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  // --- User is authenticated and is only a regular user ---
  describe("when a user is authenticated", () => {
    const mockSetAuth = jest.fn();
    const mockUser = { name: "Test User", role: 0 };

    beforeEach(() => {
      mockSetAuth.mockClear()
      useAuth.mockReturnValue([{ user: mockUser, token: "fake-token" }, mockSetAuth]);
      useCart.mockReturnValue([[]]);
      useCategory.mockReturnValue(mockCategories);
    });

    test("it displays the user's name", () => {
      renderComponent();
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    test("it does not display register link", () => {
      renderComponent();
      expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
    });

    test("it does not display login link", () => {
      renderComponent();
      expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();
    });

    test("it shows a dashboard menu link when dropdown is clicked", async () => {
      renderComponent();
      const userButton = screen.getByText(mockUser.name)
      userButton.dispatchEvent(new MouseEvent('click'));
      await waitFor(() => {
        const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboardLink).toBeInTheDocument();
      })
    });

    test("it routes to dashboard page when dashboard menu item is clicked", async () => {
      renderComponent();
      const userButton = screen.getByText(mockUser.name)
      userButton.dispatchEvent(new MouseEvent('click'));
      await waitFor(() => {
        const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
      })
    });

    test("it calls setAuth when logout is clicked", async () => {
      renderComponent();
      const userButton = screen.getByText(mockUser.name)
      userButton.dispatchEvent(new MouseEvent('click'));
      const logoutButton = screen.getByRole("link", { name: /logout/i });
      fireEvent.click(logoutButton);
      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith({
          user: null,
          token: "",
        });
      })
    });

    test("it removes localstorage user data when logout is clicked", async () => {
      renderComponent();
      const userButton = screen.getByText(mockUser.name)
      userButton.dispatchEvent(new MouseEvent('click'));
      const logoutButton = screen.getByRole("link", { name: /logout/i });
      fireEvent.click(logoutButton);
      await waitFor(() => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");
      })
    });

    test("it calls toast on successful logout", async () => {
      renderComponent();
      const userButton = screen.getByText(mockUser.name)
      userButton.dispatchEvent(new MouseEvent('click'));
      const logoutButton = screen.getByRole("link", { name: /logout/i });
      fireEvent.click(logoutButton);
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
      })
    });
  });

  // --- When user is authenticated and is an admin ---
  describe("when an admin is authenticated", () => {
    const mockAdmin = { name: "Admin", role: 1 };

    beforeEach(() => {
      useAuth.mockReturnValue([{ user: mockAdmin }, jest.fn()]);
      useCart.mockReturnValue([[]]);
      useCategory.mockReturnValue([]);
    });

    test("it shows a dashboard link for an admin", async () => {
      renderComponent();
      const adminButton = screen.getByText(mockAdmin.name)
      adminButton.dispatchEvent(new MouseEvent('click'));
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      await waitFor(() => {
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
      })
    });
  });

  // --- Cart badge ---
  describe("cart badge display", () => {
    beforeEach(() => {
      useAuth.mockReturnValue([{ user: null }, jest.fn()]);
      useCategory.mockReturnValue(mockCategories);
    });

    test("it displays the correct number of items in the cart badge", () => {
      useCart.mockReturnValue([["item1", "item2"]]);
      renderComponent();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    test("it shows zero on the cart badge when the cart is empty", () => {
      useCart.mockReturnValue([[]]);
      renderComponent();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});