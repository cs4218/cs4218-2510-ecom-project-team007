import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Users from "./Users";
import axios from "axios";

jest.mock("axios");

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it renders the Layout component with correct title", () => {
    axios.get.mockResolvedValue({ data: [] });
    render(<Users />);
    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "Dashboard - All Users");
  });

  test("it renders the AdminMenu component", () => {
    axios.get.mockResolvedValue({ data: [] });
    render(<Users />);
    const adminMenu = screen.getByTestId("admin-menu");
    expect(adminMenu).toBeInTheDocument();
  });

  test("it displays all users fetched from the database", async () => {
    const mockUsers = [
      { id: 1, name: "John Doe", email: "john@example.com", role: "user" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", role: "admin" },
      { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "user" },
    ];

    axios.get.mockResolvedValue({ data: mockUsers });
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });
  });

  test("it displays user emails for all users", async () => {
    const mockUsers = [
      { id: 1, name: "John Doe", email: "john@example.com", role: "user" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", role: "admin" },
    ];

    axios.get.mockResolvedValue({ data: mockUsers });
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    });
  });

  test("it displays a loading state while fetching users", () => {
    axios.get.mockReturnValue(new Promise(() => { })); // Never resolves
    render(<Users />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("it displays message when no users exist in database", async () => {
    axios.get.mockResolvedValue({ data: [] });
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });

  test("it displays error message when fetching users fails", async () => {
    axios.get.mockRejectedValue(new Error("Failed to fetch users"));
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test("it displays the correct number of users", async () => {
    const mockUsers = [
      { id: 1, name: "User 1", email: "user1@example.com", role: "user" },
      { id: 2, name: "User 2", email: "user2@example.com", role: "user" },
      { id: 3, name: "User 3", email: "user3@example.com", role: "admin" },
    ];

    axios.get.mockResolvedValue({ data: mockUsers });
    render(<Users />);

    await waitFor(() => {
      const userRows = screen.getAllByRole("row");
      expect(userRows.length - 1).toBe(mockUsers.length); // minus 1 if table has header row
    });
  });
});