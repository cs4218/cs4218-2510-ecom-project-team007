import React from "react";
import { render, screen } from "@testing-library/react";
import Users from "./Users";

jest.mock("../../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  );
});

jest.mock("../../components/AdminMenu", () => {
  return () => <div data-testid="admin-menu">Admin Menu</div>;
});

describe('Admin view users', () => {
  test("it renders the Layout component with correct title", () => {
    render(<Users />);
    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "Dashboard - All Users");
  });

  test("it renders the AdminMenu component", () => {
    render(<Users />);
    const adminMenu = screen.getByTestId("admin-menu");
    expect(adminMenu).toBeInTheDocument();
  });

  test("it renders the All Users heading", () => {
    render(<Users />);
    const heading = screen.getByRole("heading", { name: "All Users", level: 1 });
    expect(heading).toBeInTheDocument();
  });

  test("it renders the container with correct classes", () => {
    render(<Users />);
    const container = screen.getByText("All Users").closest(".container-fluid");
    expect(container).toHaveClass("m-3", "p-3");
  });

  test("it renders the row container", () => {
    render(<Users />);
    const row = screen.getByText("All Users").closest(".row");
    expect(row).toBeInTheDocument();
  });

})