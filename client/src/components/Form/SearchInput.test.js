import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSearch } from "../../context/search";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import SearchInput from "./SearchInput";
import { useNavigate } from "react-router-dom";


jest.mock("axios");
jest.mock("../../context/search");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));


describe("SearchInput - typing updates keyword", () => {
  let navigate;

  beforeEach(() => {
    jest.clearAllMocks();
    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
  });

  it("updates keyword in context when typing", () => {
    const setValuesMock = jest.fn();
    useSearch.mockReturnValue([{ keyword: "", results: [] }, setValuesMock]);

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "laptop" } });

    expect(setValuesMock).toHaveBeenCalledWith({ keyword: "laptop", results: [] });
  });

  it("submits form and updates results, navigates", async () => {
    const setValuesMock = jest.fn();
    useSearch.mockReturnValue([{ keyword: "laptop", results: [] }, setValuesMock]);

    axios.get.mockResolvedValue({ data: [{ id: 1, name: "Laptop 1" }] });

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() =>
      expect(setValuesMock).toHaveBeenCalledWith({
        keyword: "laptop",
        results: [{ id: 1, name: "Laptop 1" }],
      })
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/search"));
  });
});
