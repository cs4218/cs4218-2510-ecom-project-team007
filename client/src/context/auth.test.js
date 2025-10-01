import React from "react";
import { render, waitFor } from "react";
import axios from "axios";
import { AuthProvider, useAuth } from "./auth";

// Fake consumer to check AuthContext state
const TestConsumer = () => {
  const [auth] = useAuth();
  return (
    <div data-testid="auth-state">
      {auth.user ? auth.user.name : "no-user"} | {auth.token || "no-token"}
    </div>
  );
};

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.defaults.headers.common["Authorization"] = "";
  });

  it("initializes with default state when no localStorage data", () => {
    window.localStorage.getItem.mockReturnValueOnce(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(getByTestId("auth-state").textContent).toBe("no-user | no-token");
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  it("initializes with valid localStorage data (user + token)", async () => {
    const stored = { user: { name: "Alice" }, token: "abc123" };
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(stored));

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(getByTestId("auth-state").textContent).toBe("Alice | abc123")
    );
    expect(axios.defaults.headers.common["Authorization"]).toBe("abc123");
  });

  it("falls back to default state when JSON is malformed", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    window.localStorage.getItem.mockReturnValueOnce("{bad-json}");

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(getByTestId("auth-state").textContent).toBe("no-user | no-token");
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
    consoleSpy.mockRestore();
  });

  it("sets axios header even if token exists without user", async () => {
    const stored = { user: null, token: "jwt-token" };
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(stored));

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(getByTestId("auth-state").textContent).toBe("no-user | jwt-token")
    );
    expect(axios.defaults.headers.common["Authorization"]).toBe("jwt-token");
  });
});
