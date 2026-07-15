import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement <dialog>'s imperative showModal()/close() methods
// (see src/components/ui/Modal.tsx, which relies on them for its native
// dialog-based Modal/Drawer/BottomSheet). Polyfill just enough for tests:
// toggle the `open` attribute and fire the events real dialogs dispatch.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
