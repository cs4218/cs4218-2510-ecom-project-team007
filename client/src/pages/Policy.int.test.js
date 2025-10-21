import React from "react";
import { render, screen } from "@testing-library/react";
import { Helmet } from "react-helmet";
import Policy from "./Policy";

// mock Header and Footer components inside Layout
// to remove dependencies from authentication/cart modules
jest.mock("../components/Header", () => () => <div data-testid="header">Header</div>);
jest.mock("../components/Footer", () => () => <div data-testid="footer">Footer</div>);

describe("Policy Page with Layout integrated", () => {
  beforeEach(() => render(<Policy />));

  it("renders policy title", () => {
    const helmet = Helmet.peek();
    expect(helmet.title).toBe("Privacy Policy");
});

  it("renders policy content along with header and footer", () => {
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    // check existence of a sub-component within contact
    // the rest should also exist since it passes the unit test render
    expect(screen.getByText("PRIVACY POLICY")).toBeInTheDocument();
  });

  it("renders policy strictly between header and footer", () => {
    const header = screen.getByTestId("header");
    const footer = screen.getByTestId("footer");
    const contactText = screen.getByText("PRIVACY POLICY");

    expect(header.compareDocumentPosition(contactText)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(footer.compareDocumentPosition(contactText)).toBe(Node.DOCUMENT_POSITION_PRECEDING);
  });
});
