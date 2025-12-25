import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { Counter } from "../Counter";

describe("Counter", () => {
  it("renders correctly", () => {
    render(
      <Provider>
        <Counter />
      </Provider>
    );

    expect(screen.getByText("Jotai 状态管理示例")).toBeInTheDocument();
  });
});

