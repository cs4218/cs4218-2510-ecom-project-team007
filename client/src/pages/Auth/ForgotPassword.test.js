import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import ForgotPassword from "./ForgotPassword";
import { MemoryRouter } from "react-router-dom";

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock('../../hooks/useCategory', () => jest.fn(()=> []));
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
  };
};

describe("ForgotPassword Component", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      console.log.mockRestore();
    });

  it("renders all input fields and reset button", () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/Enter Your Registered Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Security Answer/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter New Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /RESET PASSWORD/i })).toBeInTheDocument();
  });

  it("updates state when typing in input fields", () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    const emailInput = screen.getByPlaceholderText(/Enter Your Registered Email/i);
    const answerInput = screen.getByPlaceholderText(/Enter Security Answer/i);
    const passwordInput = screen.getByPlaceholderText(/Enter New Password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(answerInput, { target: { value: "blue" } });
    fireEvent.change(passwordInput, { target: { value: "newPass123" } });

    expect(emailInput.value).toBe("test@example.com");
    expect(answerInput.value).toBe("blue");
    expect(passwordInput.value).toBe("newPass123");
  });

  it("shows success toast and navigates when email & answer correct", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, message: "Password Reset Successfully" } });

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Registered Email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Security Answer/i), { target: { value: "correctAnswer" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter New Password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /RESET PASSWORD/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Password Reset Successfully"));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("shows error toast when email does not exist", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: "Email not registered" } });

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Registered Email/i), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Security Answer/i), { target: { value: "anyAnswer" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter New Password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /RESET PASSWORD/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Email not registered"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows error toast when security answer is incorrect", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: "Wrong security answer" } });

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Registered Email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Security Answer/i), { target: { value: "wrongAnswer" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter New Password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /RESET PASSWORD/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Wrong security answer"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows generic error toast when API fails without message", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false } });

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Registered Email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Security Answer/i), { target: { value: "answer" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter New Password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /RESET PASSWORD/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to reset password"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows generic error toast on network failure", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Registered Email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Security Answer/i), { target: { value: "answer" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter New Password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /RESET PASSWORD/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
