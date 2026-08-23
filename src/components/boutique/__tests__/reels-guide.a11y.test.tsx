import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

// The reels guide is pure presentation — router + data access are mocked so the
// test never touches the API layer.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, params, children, ...rest }: any) => (
    <a href={typeof to === "string" ? to.replace("$id", params?.id ?? "") : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const reels = [
  {
    id: "r1",
    title: "Bridal blouse reel",
    video_url: "https://example.com/1.mp4",
    poster_url: "https://example.com/1.jpg",
    products: [{ id: "p1", name: "Maroon Bridal Blouse", price: 4999, image: "https://x/1.jpg" }],
  },
  {
    id: "r2",
    title: "Half saree reel",
    video_url: "https://example.com/2.mp4",
    poster_url: "https://example.com/2.jpg",
    products: [{ id: "p2", name: "Gold Half Saree", price: 8999, image: "https://x/2.jpg" }],
  },
];

vi.mock("@/lib/useStorefront", () => ({ useReels: () => reels }));

import { ReelsCarousel } from "../ReelsCarousel";

const settle = async () => {
  await act(async () => {
    vi.advanceTimersByTime(800);
  });
};

describe("Reels guide overlay accessibility", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("has no axe violations", async () => {
    const { container } = render(<ReelsCarousel />);
    await settle();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("announces the active reel through a polite live region", async () => {
    render(<ReelsCarousel />);
    await settle();
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
    expect(live?.textContent).toMatch(/Reel 1 of 2/);
  });

  it("labels the shop link and describes what it opens", async () => {
    render(<ReelsCarousel />);
    await settle();
    const link = screen.getByTestId("reel-shop-link");
    expect(link).toHaveAttribute("aria-label", expect.stringContaining("Maroon Bridal Blouse"));
    const describedBy = link.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toMatch(/Opens the product page/i);
  });

  it("hides the decorative coach-mark from screen readers", async () => {
    render(<ReelsCarousel />);
    await settle();
    expect(screen.getByTestId("reel-guide")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the shop link keyboard reachable and activatable", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ReelsCarousel />);
    await settle();
    const link = screen.getByTestId("reel-shop-link");
    link.focus();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(link).toHaveAttribute("href", "/product/p1");
  });

  it("moves slides with the arrow keys from the carousel stage", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ReelsCarousel />);
    await settle();
    const stage = screen.getByRole("region", { name: /arrow keys/i });
    stage.focus();
    await user.keyboard("{ArrowRight}");
    await settle();
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toMatch(/Reel 2 of 2/);
    await user.keyboard("{ArrowLeft}");
    await settle();
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toMatch(/Reel 1 of 2/);
  });

  it("exposes previous/next controls with accessible names", async () => {
    render(<ReelsCarousel />);
    await settle();
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next slide/i })).toBeInTheDocument();
  });
});
