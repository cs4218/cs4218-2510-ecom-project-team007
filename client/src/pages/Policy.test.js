import React from "react";
import { render, screen } from "@testing-library/react";
import Policy from "./Policy";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div>
    <h1 data-testid="title">{title}</h1>
    {children}
  </div>
));

describe("Policy Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(<Policy />);
  });

  it("Should render correct title", () => {
    const title = screen.getByTestId("title");

    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("Privacy Policy");
  });

  it("Should render page heading", () => {
    const heading = screen.getByText("PRIVACY POLICY");
    expect(heading).toBeInTheDocument();
  });

  it("Should display the introductory paragraph", () => {
    const introText = screen.getByText(/Your privacy is important to us/i);
    expect(introText).toBeInTheDocument();
  });
});
