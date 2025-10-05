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

  test("it renders the 404 error code with correct heading level", () => {
    renderWithRouter(<Pagenotfound />);
    const errorCode = screen.getByRole("heading", { name: "404", level: 1 });
    expect(errorCode).toBeInTheDocument();
  });

  test("it renders the 404 error code with correct class", () => {
    renderWithRouter(<Pagenotfound />);
    const errorCode = screen.getByText("404");
    expect(errorCode).toHaveClass("pnf-title");
  });

  test("it renders the error message", () => {
    renderWithRouter(<Pagenotfound />);
    const errorMessage = screen.getByText("Oops ! Page Not Found");
    expect(errorMessage).toBeInTheDocument();
  });

  test("it renders the error message with correct heading level", () => {
    renderWithRouter(<Pagenotfound />);
    const errorMessage = screen.getByRole("heading", { name: "Oops ! Page Not Found", level: 2 });
    expect(errorMessage).toBeInTheDocument();
  });

  test("it renders the error message with correct class", () => {
    renderWithRouter(<Pagenotfound />);
    const errorMessage = screen.getByText("Oops ! Page Not Found");
    expect(errorMessage).toHaveClass("pnf-heading");
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

  test("it renders the Go Back link with correct class", () => {
    renderWithRouter(<Pagenotfound />);
    const link = screen.getByRole("link", { name: "Go Back" });
    expect(link).toHaveClass("pnf-btn");
  });
})