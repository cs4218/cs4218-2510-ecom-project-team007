import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";

describe("UserMenu Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the dashboard heading", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders the Profile link with correct href", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByText("Profile");
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.getAttribute("href")).toBe("/dashboard/user/profile");
  });

  it("renders the Orders link with correct href", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const ordersLink = screen.getByText("Orders");
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink.getAttribute("href")).toBe("/dashboard/user/orders");
  });

  it("renders both links inside a list-group container", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const container = screen.getByText("Dashboard").closest(".list-group");
    expect(container).toBeInTheDocument();
    expect(container).toContainElement(screen.getByText("Profile"));
    expect(container).toContainElement(screen.getByText("Orders"));
  });
});
