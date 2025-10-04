import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("./../../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  );
});

jest.mock("../../components/UserMenu", () => {
  return () => <div data-testid="user-menu">User Menu</div>;
});

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");
jest.mock("react-hot-toast");

const mockUseAuth = require("../../context/auth").useAuth;

const mockAuthData = {
  user: {
    name: "Test User",
    email: "testuser@test.com",
    phone: "912345678",
    address: "Test Address 123",
  },
  token: "test-token",
};

describe('Update profile page', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue([mockAuthData, jest.fn()]);
    localStorage.setItem("auth", JSON.stringify(mockAuthData));
    jest.clearAllMocks();
  });

  test("it renders the Layout component with correct title", () => {
    render(<Profile />);
    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "Your Profile");
  });

  test("it renders the UserMenu component", () => {
    render(<Profile />);
    const userMenu = screen.getByTestId("user-menu");
    expect(userMenu).toBeInTheDocument();
  });

  test("it renders the profile form heading", () => {
    render(<Profile />);
    const heading = screen.getByText("USER PROFILE");
    expect(heading).toBeInTheDocument();
  });

  test("it populates name field with user data from auth context", async () => {
    render(<Profile />);
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText("Enter Your Name");
      expect(nameInput).toHaveValue(mockAuthData.user.name);
    });
  });

  test("it populates email field with user data from auth context", async () => {
    render(<Profile />);
    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText("Enter Your Email");
      expect(emailInput).toHaveValue(mockAuthData.user.email);
    });
  });

  test("it populates phone field with user data from auth context", async () => {
    render(<Profile />);
    await waitFor(() => {
      const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
      expect(phoneInput).toHaveValue(mockAuthData.user.phone);
    });
  });

  test("it populates address field with user data from auth context", async () => {
    render(<Profile />);
    await waitFor(() => {
      const addressInput = screen.getByPlaceholderText("Enter Your Address");
      expect(addressInput).toHaveValue(mockAuthData.user.address);
    });
  });

  test("it renders email input as disabled", () => {
    render(<Profile />);
    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    expect(emailInput).toBeDisabled();
  });

  test("it updates name field on user input", async () => {
    render(<Profile />);
    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    const newNameInput = "Lily Rose"
    fireEvent.change(nameInput, { target: { value: newNameInput } });
    await waitFor(() => {
      expect(nameInput).toHaveValue(newNameInput);
    });
  });

  test("it updates password field on user input", async () => {
    render(<Profile />);
    const passwordInput = screen.getByPlaceholderText("Enter Your Password");
    const newPasswordInput = "NewPassword123!"
    fireEvent.change(passwordInput, { target: { value: newPasswordInput } });
    await waitFor(() => {
      expect(passwordInput).toHaveValue(newPasswordInput);
    });
  });

  test("it updates phone field on user input", async () => {
    render(<Profile />);
    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    const newPhoneInput = "81234567"
    fireEvent.change(phoneInput, { target: { value: newPhoneInput } });
    await waitFor(() => {
      expect(phoneInput).toHaveValue(newPhoneInput);
    });
  });

  test("it updates address field on user input", async () => {
    render(<Profile />);
    const addressInput = screen.getByPlaceholderText("Enter Your Address");
    const newAddressInput = "Test Address 456"
    fireEvent.change(addressInput, { target: { value: newAddressInput } });
    await waitFor(() => {
      expect(addressInput).toHaveValue(newAddressInput);
    });
  });

  test("it renders the submit button with correct text", () => {
    render(<Profile />);
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    expect(submitButton).toBeInTheDocument();
  });

  test("it calls handleSubmit when form is submitted", async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: mockAuthData.user } });
    render(<Profile />);
    const form = screen.getByRole("button", { name: "UPDATE" }).closest("form");
    fireEvent.submit(form);
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
  });

  test("it prevents default form submission behavior", async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: mockAuthData.user } });
    render(<Profile />);
    const form = screen.getByRole("button", { name: "UPDATE" }).closest("form");
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(submitEvent, "preventDefault");
    form.dispatchEvent(submitEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test("it sends PUT request to correct API endpoint on form submit", async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: mockAuthData.user } });
    render(<Profile />);
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile",
        expect.any(Object)
      );
    });
  });

  test("it sends current form data in PUT request", async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: mockAuthData.user } });
    render(<Profile />);
    // await waitFor(() => {
    //   const nameInput = screen.getByPlaceholderText("Enter Your Name");
    //   expect(nameInput).toHaveValue(mockAuthData.user.name);
    // });
    const updateFormData = {
      ...mockAuthData.user,
      password: ""
    }
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", updateFormData);
    });
  });

  test("it updates auth context on successful profile update", async () => {
    const mockSetAuth = jest.fn();
    mockUseAuth.mockReturnValue([mockAuthData, mockSetAuth]);
    const updatedUser = { ...mockAuthData.user, name: "Lily Rose" };
    axios.put.mockResolvedValue({ data: { updatedUser } });
    render(<Profile />);
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith({
        ...mockAuthData,
        user: updatedUser,
      });
    });
  });

  test("it updates localstorage on successful profile update", async () => {
    const updatedUser = { ...mockAuthData.user, name: "Lily Rose" };
    axios.put.mockResolvedValue({ data: { updatedUser } });
    render(<Profile />);
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    fireEvent.click(submitButton);
    await waitFor(() => {
      const storedAuth = JSON.parse(localStorage.getItem("auth"));
      expect(storedAuth.user).toEqual(updatedUser);
    });
  });

  test("it displays success toast on successful profile update", async () => {
    const updatedUser = { ...mockAuthData.user, name: "Lily Rose" };
    axios.put.mockResolvedValue({ data: { updatedUser } });
    render(<Profile />);
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
    });
  });

  test("it displays error toast when API returns error", async () => {
    axios.put.mockResolvedValue({ data: { errro: true, error: "Update failed" } });
    render(<Profile />);
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  test("it displays generic error toast on network error", async () => {
    axios.put.mockRejectedValue(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    render(<Profile />);
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
    consoleSpy.mockRestore();
  });

  test("it logs error to console on network error", async () => {
    const error = new Error("Network error");
    axios.put.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    render(<Profile />);
    const submitButton = screen.getByRole("button", { name: "UPDATE" });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(error);
    });
    consoleSpy.mockRestore();
  });

  test("it renders password input with correct type", () => {
    render(<Profile />);
    const passwordInput = screen.getByPlaceholderText("Enter Your Password");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("it renders name input with correct type", () => {
    render(<Profile />);
    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    expect(nameInput).toHaveAttribute("type", "text");
  });

  test("it renders email input with correct type", () => {
    render(<Profile />);
    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    expect(emailInput).toHaveAttribute("type", "email");
  });
})