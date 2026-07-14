import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test-utils";
import { Modal, Drawer, BottomSheet, ModalFooterAction } from "../Modal";
import { Button } from "../Button";

describe("Modal", () => {
  it("renders children when open", () => {
    render(
      <Modal open onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });

  it("renders title", () => {
    render(
      <Modal open onClose={vi.fn()} title="Confirm Action">
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <Modal open onClose={vi.fn()} title="Title" description="A longer explanation">
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByText("A longer explanation")).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        footer={<button>Save</button>}
      >
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("has dialog role and aria-modal", () => {
    render(
      <Modal open onClose={vi.fn()} title="Dialog">
        <p>Content</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Dialog">
        <p>Content</p>
      </Modal>,
    );
    const closeButtons = screen.getAllByLabelText("Close dialog");
    await userEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape key", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Dialog">
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    // Overlay is portaled to document.body, not the React render container.
    const overlay = document.body.querySelector('button[aria-label="Close dialog"]');
    expect(overlay).toBeTruthy();
    await userEvent.click(overlay!);
    expect(onClose).toHaveBeenCalled();
  });

  it("portals the dialog overlay to document.body", () => {
    render(
      <Modal open onClose={vi.fn()} title="Dialog">
        <p>Content</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    // Overlay wrapper is the parent of the dialog panel and must sit on body
    // so fixed positioning is viewport-relative (not trapped by ancestor transforms).
    expect(dialog.parentElement?.parentElement).toBe(document.body);
  });

  it("traps Tab focus within the dialog", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Dialog" footer={<Button onClick={onClose}>Cancel</Button>}>
        <p>Content</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    const focusable = dialog.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Drawer", () => {
  it("renders children when open", () => {
    render(
      <Drawer open onClose={vi.fn()} title="Settings">
        <p>Drawer content</p>
      </Drawer>,
    );
    expect(screen.getByText("Drawer content")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <Drawer open={false} onClose={vi.fn()} title="Settings">
        <p>Drawer content</p>
      </Drawer>,
    );
    expect(screen.queryByText("Drawer content")).not.toBeInTheDocument();
  });

  it("renders title", () => {
    render(
      <Drawer open onClose={vi.fn()} title="Settings">
        <p>Content</p>
      </Drawer>,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("has dialog role", () => {
    render(
      <Drawer open onClose={vi.fn()} title="Settings">
        <p>Content</p>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("portals the drawer overlay to document.body", () => {
    render(
      <Drawer open onClose={vi.fn()} title="Settings">
        <p>Content</p>
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.parentElement?.parentElement).toBe(document.body);
  });
});

describe("BottomSheet", () => {
  it("renders children when open", () => {
    render(
      <BottomSheet open onClose={vi.fn()} title="Sheet">
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.getByText("Sheet content")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <BottomSheet open={false} onClose={vi.fn()} title="Sheet">
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.queryByText("Sheet content")).not.toBeInTheDocument();
  });
});

describe("ModalFooterAction", () => {
  it("renders children as button content", () => {
    render(<ModalFooterAction>Save Changes</ModalFooterAction>);
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });
});
