import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import PrivateRoute from "./Private";

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Outlet: () => <div data-testid="outlet">MockOutlet</div>,
}));

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("axios");

describe("PrivateRoute", () => {
  let setAuthMock;

  beforeEach(() => {
    setAuthMock = jest.fn();
    jest.clearAllMocks();
  });

  it("renders Outlet when token is valid and API responds ok", async () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([{ token: "validtoken", user: {} }, setAuthMock]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("clears auth and redirects when API responds not ok", async () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([{ token: "invalidtoken", user: {} }, setAuthMock]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(setAuthMock).toHaveBeenCalledWith({ user: null, token: "" });
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("clears auth and redirects when API call throws error", async () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([{ token: "expiredtoken", user: {} }, setAuthMock]);
    axios.get.mockRejectedValue(new Error("Token expired"));

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(setAuthMock).toHaveBeenCalledWith({ user: null, token: "" });
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("shows Spinner when no token", () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([{ token: "", user: null }, setAuthMock]);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
