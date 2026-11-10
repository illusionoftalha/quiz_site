"use strict";
document.querySelectorAll("[data-password]").forEach((button) =>
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.password),
      show = input.type === "password";
    input.type = show ? "text" : "password";
    button.textContent = show ? "Hide" : "Show";
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
  }),
);
async function signOut() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok && response.status !== 401)
      throw Error("Sign-out failed. Please retry.");
    sessionStorage.clear();
    location.href = "/";
  } catch (error) {
    await window.alert(error.message);
  }
}
// Keep keyboard focus inside visible dialogs and restore it when dismissed.
document
  .querySelectorAll(".cyber-modal-overlay,.modal-overlay")
  .forEach((overlay) => {
    let previousFocus = null;
    const sync = () => {
      const open = overlay.classList.contains("active");
      overlay.setAttribute("aria-hidden", String(!open));
      overlay.inert = !open;
      if (open) {
        previousFocus = document.activeElement;
        overlay.querySelector("button")?.focus();
      } else if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }
    };
    new MutationObserver(sync).observe(overlay, {
      attributes: true,
      attributeFilter: ["class"],
    });
    sync();
    overlay.addEventListener("keydown", (event) => {
      const buttons = [
        ...overlay.querySelectorAll(
          "button:not(:disabled),a[href],input,textarea",
        ),
      ];
      if (event.key === "Escape") {
        const cancel = buttons.find((b) =>
          /cancel|close/i.test(
            b.textContent + " " + b.getAttribute("aria-label"),
          ),
        );
        if (cancel) cancel.click();
      }
      if (event.key !== "Tab" || !buttons.length) return;
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });
