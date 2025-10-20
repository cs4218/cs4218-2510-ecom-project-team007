import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div>
    <h1 data-testid="title">{title}</h1>
    {children}
  </div>
));


describe("Contact Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(<Contact />);
  });

  it("Should render correct title", () => {
    const title = screen.getByTestId("title");

    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("Contact Us");
  });

  it("Should render page heading", () => {
    const heading = screen.getByText("CONTACT US");
    expect(heading).toBeInTheDocument();
  });

  it("Should render image with correct src and alt text", () => {
    const image = screen.getByAltText("Contact Us");

    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  it("Should render page descriptive text", () => {
    const description = screen.getByText(
      /For any query or info about our products, feel free to call anytime. We are available 24[/]7./i
    );

    expect(description).toBeInTheDocument();
  });

  it("Should render email with its icon", () => {
    const email = screen.getByText(/: www.help@ecommerceapp.com/i);
    const icon = screen.getByTestId("bimailsend");

    expect(email).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  it("Should render phone number with its icon", () => {
    const phone = screen.getByText(/: 012-3456789/i);
    const icon = screen.getByTestId("biphonecall");

    expect(phone).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  it("Should render support number with its icon", () => {
    const support = screen.getByText(/: 1800-0000-0000 \(Toll Free\)/i);
    const icon = screen.getByTestId("bisupport");

    expect(support).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });
});
