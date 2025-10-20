import { renderHook, waitFor } from "@testing-library/react";
import useCategory from "./useCategory";
import axios from "axios";

jest.mock("axios");

const mockCategories = [
  { _id: "1", name: "Electronics", slug: "electronics" },
  { _id: "2", name: "Clothing", slug: "clothing" },
];

describe('useCategory hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it returns an empty array initially", async () => {
    axios.get.mockResolvedValue({ data: { category: [] } });
    const { result } = renderHook(() => useCategory());
    expect(result.current).toEqual([]);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("it calls axios.get on mount", async () => {
    axios.get.mockResolvedValue({ data: { category: [] } });
    renderHook(() => useCategory());
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("it calls the correct API endpoint", async () => {
    axios.get.mockResolvedValue({ data: { category: [] } });
    renderHook(() => useCategory());
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
  });

  test("it calls axios.get only once on mount", async () => {
    axios.get.mockResolvedValue({ data: { category: [] } });
    renderHook(() => useCategory());
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  test("it updates categories state with fetched data", async () => {
    axios.get.mockResolvedValue({ data: { category: mockCategories } });
    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });
  });

  test("it returns the categories array from API response", async () => {
    axios.get.mockResolvedValue({ data: { category: mockCategories } });
    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });
  });

  test("it handles successful API response with multiple categories", async () => {
    axios.get.mockResolvedValue({ data: { category: mockCategories } });
    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current[0]).toEqual(mockCategories[0]);
      expect(result.current[1]).toEqual(mockCategories[1]);
    });
  });

  test("it handles empty category array from API", async () => {
    axios.get.mockResolvedValue({ data: { category: [] } });
    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  test("it handles undefined category data from API", async () => {
    axios.get.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  test("it logs error to console on API failure", async () => {
    const error = new Error("Network error");
    axios.get.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    renderHook(() => useCategory());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(error);
    });

    consoleSpy.mockRestore();
  });

  test("it maintains empty array state on API failure", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));
    jest.spyOn(console, "log").mockImplementation();

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    console.log.mockRestore();
  });

  test("it does not call axios.get on rerender", async () => {
    axios.get.mockResolvedValue({ data: { category: mockCategories } });
    const { rerender } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    rerender();

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test("it handles null category data from API", async () => {
    axios.get.mockResolvedValue({ data: { category: null } });
    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

})