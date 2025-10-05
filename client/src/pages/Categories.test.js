import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Categories from "./Categories";
import { beforeEach, describe } from "node:test";

jest.mock("../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  );
});

jest.mock("../hooks/useCategory");

const mockUseCategory = require("../hooks/useCategory").default;

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Categories Page", () => {
  // --- Available categories ---
  describe("when categories are available", () => {
    const mockCategories = [
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Clothing", slug: "clothing" },
      { _id: "3", name: "Books", slug: "books" },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockUseCategory.mockReturnValue(mockCategories);
    })

    test("it renders the Layout component with correct title", () => {
      mockUseCategory.mockReturnValue([]);
      renderWithRouter(<Categories />);
      const layout = screen.getByTestId("layout");
      expect(layout).toHaveAttribute("data-title", "All Categories");
    });

    test("it calls useCategory hook", () => {
      mockUseCategory.mockReturnValue([]);
      renderWithRouter(<Categories />);
      expect(mockUseCategory).toHaveBeenCalled();
    });

    test("it renders the hook category 'Electronics'", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });
    });

    test("it renders the hook category 'Clothing'", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        expect(screen.getByText("Clothing")).toBeInTheDocument();
      });
    });

    test("it renders the hook category 'Books'", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        expect(screen.getByText("Books")).toBeInTheDocument();
      });
    });

    test("it renders each category as a link", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        const electronicsLink = screen.getByRole("link", { name: "Electronics" });
        expect(electronicsLink).toBeInTheDocument();
      });
    });

    test("it renders category links with correct href", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        const electronicsLink = screen.getByRole("link", { name: "Electronics" });
        expect(electronicsLink).toHaveAttribute("href", "/category/electronics");
      });
    });

    test("it renders category links with button styling", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        const electronicsLink = screen.getByRole("link", { name: "Electronics" });
        expect(electronicsLink).toHaveClass("btn", "btn-primary");
      });
    });

    test("it renders correct number of category items", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        const categoryLinks = screen.getAllByRole("link");
        expect(categoryLinks).toHaveLength(3);
      });
    });

    test("it renders each category with unique key", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      const { container } = renderWithRouter(<Categories />);
      await waitFor(() => {
        const categoryDivs = container.querySelectorAll(".col-md-6");
        expect(categoryDivs).toHaveLength(3);
      });
    });

    test("it renders nothing when categories array is empty", () => {
      mockUseCategory.mockReturnValue([]);
      renderWithRouter(<Categories />);
      const categoryLinks = screen.queryAllByRole("link");
      expect(categoryLinks).toHaveLength(0);
    });

    test("it generates correct slug-based URL for each category", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        const clothingLink = screen.getByRole("link", { name: "Clothing" });
        expect(clothingLink).toHaveAttribute("href", "/category/clothing");
      });
    });

    test("it renders multiple categories with different slugs", async () => {
      mockUseCategory.mockReturnValue(mockCategories);
      renderWithRouter(<Categories />);
      await waitFor(() => {
        const booksLink = screen.getByRole("link", { name: "Books" });
        expect(booksLink).toHaveAttribute("href", "/category/books");
      });
    })
  });

  // --- No available categories ---
  describe("when no categories are available", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUseCategory.mockReturnValue([]);
    });

    test("it renders without any category links", () => {
      mockUseCategory.mockReturnValue([]);
      renderWithRouter(<Categories />);
      const links = screen.queryAllByRole("link");
      expect(links).toHaveLength(0);
    });
  });
})