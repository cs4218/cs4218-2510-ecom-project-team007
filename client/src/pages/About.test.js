import React from "react";
import { render, screen } from "@testing-library/react";
import About from "./About";

jest.mock("./../components/Layout", () => {
    return ({ children, title }) => (
        <div data-testid="layout" data-title={title}>
            {children}
        </div>
    );
});

describe('About page', () => {
    test("it renders the Layout component with correct title", () => {
        render(<About />);
        const layout = screen.getByTestId("layout");
        expect(layout).toHaveAttribute("data-title", "About us - Ecommerce app");
    });

    test("it renders the about image", () => {
        render(<About />);
        const image = screen.getByAltText("contactus");
        expect(image).toBeInTheDocument();
    });

    test("it renders the about image with correct src", () => {
        render(<About />);
        const image = screen.getByAltText("contactus");
        expect(image).toHaveAttribute("src", "/images/about.jpeg");
    });

    test("it renders the about text content", () => {
        render(<About />);
        const textContent = screen.getByText("Add text");
        expect(textContent).toBeInTheDocument();
    });
})