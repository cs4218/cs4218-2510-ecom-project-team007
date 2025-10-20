import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSearch, SearchProvider } from "./search";

const TestComponent = () => {
  const [auth, setAuth] = useSearch();

  return (
    <div>
      <div data-testid="keyword">{auth.keyword}</div>
      <div data-testid="results">{auth.results.join(",")}</div>
      <button
        onClick={() => setAuth({ keyword: "banana", results: ["banana", "band"] })}
      >
        Update
      </button>
    </div>
  );
};

describe("test search context", () => {
  it("SearchProvider provides and updates context values", async () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );

    // Default values
    expect(screen.getByTestId("keyword").textContent).toBe("");
    expect(screen.getByTestId("results").textContent).toBe("");

    // Simulate user click to update the context
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      await userEvent.click(screen.getByText("Update"));
    });

    // Updated values
    expect(screen.getByTestId("keyword").textContent).toBe("banana");
    expect(screen.getByTestId("results").textContent).toBe("banana,band");
  });
});
