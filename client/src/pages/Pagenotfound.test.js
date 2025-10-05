import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Pagenotfound from "./Pagenotfound";
import { describe } from "node:test";

jest.mock("../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  );
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Page not found', () => {
  test("it renders the Layout component with correct title", () => {
    renderWithRouter(<Pagenotfound />);
    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "go back- page not found");
  });

  test("it renders the 404 error code", () => {
    renderWithRouter(<Pagenotfound />);
    const errorCode = screen.getByText("404");
    expect(errorCode).toBeInTheDocument();
  });

  test("it renders the error message", () => {
    renderWithRouter(<Pagenotfound />);
    const errorMessage = screen.getByText("Oops ! Page Not Found");
    expect(errorMessage).toBeInTheDocument();
  });

  test("it renders the Go Back link", () => {
    renderWithRouter(<Pagenotfound />);
    const link = screen.getByRole("link", { name: "Go Back" });
    expect(link).toBeInTheDocument();
  });

  test("it renders the Go Back link with correct href", () => {
    renderWithRouter(<Pagenotfound />);
    const link = screen.getByRole("link", { name: "Go Back" });
    expect(link).toHaveAttribute("href", "/");
  });
})