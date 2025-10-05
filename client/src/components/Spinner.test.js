import React from 'react';
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Spinner from "./Spinner";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/protected-route" }),
}));

describe("Spinner", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockNavigate.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("it renders the initial countdown message", () => {
        render(<Spinner />, { wrapper: MemoryRouter });
        expect(
            screen.getByText(/redirecting to you in 3 second/i)
        ).toBeInTheDocument();
    });

    test("it renders the spinner element", () => {
        render(<Spinner />, { wrapper: MemoryRouter });
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    test("it decrements the countdown after one second", async () => {
        render(<Spinner />, { wrapper: MemoryRouter });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        await waitFor(() => {
            expect(
                screen.getByText(/redirecting to you in 2 second/i)
            ).toBeInTheDocument();
        });
    });

    test("it redirects to the default path when the countdown finishes", async () => {
        render(<Spinner />, { wrapper: MemoryRouter });

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/login", {
                state: "/protected-route",
            });
        });
    });

    test("it redirects to a custom path when the countdown finishes", async () => {
        render(<Spinner path="custom-page" />, { wrapper: MemoryRouter });

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/custom-page", {
                state: "/protected-route",
            });
        });
    });

    test("it cleans up the interval on unmount", () => {
        const clearIntervalSpy = jest.spyOn(window, "clearInterval");
        const { unmount } = render(<Spinner />, { wrapper: MemoryRouter });

        act(() => {
            unmount();
        });

        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        clearIntervalSpy.mockRestore();
    });
});