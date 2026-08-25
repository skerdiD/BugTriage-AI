import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import {
  getCompactRelativeDate,
  TicketTable,
} from "@/components/dashboard/ticket-table";
import type { UiTicketListItem } from "@/lib/dashboard/types";

const ticket: UiTicketListItem = {
  id: "BUG-4242",
  title: "A long ticket title that needs to truncate without widening the table",
  severity: "High",
  status: "In Progress",
  category: "Performance",
  assignee: "Priya Shah",
  assigneeInitials: "PS",
  assigneeRole: "Team Member",
  createdAt: "3 months ago",
  confidence: 91,
};

describe("TicketTable", () => {
  it("renders separate fixed desktop and stacked mobile layouts", () => {
    const markup = renderToStaticMarkup(<TicketTable tickets={[ticket]} />);

    expect(markup).toContain("table-fixed");
    expect(markup).toContain("md:block");
    expect(markup).toContain("md:hidden");
    expect(markup).toContain("min-[1400px]:table-cell");
    expect(markup).toContain("xl:table-cell");
    expect(markup).toContain(`title="${ticket.title}"`);
    expect(markup).toContain("3 mo ago");
    expect(markup).toContain(`href="/tickets/${ticket.id}"`);
  });

  it("compacts relative dates without changing their meaning", () => {
    expect(getCompactRelativeDate("less than a minute ago")).toBe("Just now");
    expect(getCompactRelativeDate("about 2 hours ago")).toBe("2 hr ago");
    expect(getCompactRelativeDate("3 months ago")).toBe("3 mo ago");
    expect(getCompactRelativeDate("over 1 year ago")).toBe(">1 yr ago");
  });
});
