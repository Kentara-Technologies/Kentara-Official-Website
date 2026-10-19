// Existing Kentara contact configuration; enquiry and contact destinations are unchanged.
const KENTARA_CONFIG = {
  whatsappDisplay: "+234 9162797282",
  whatsappNumber: "2349162797282",
  email: "info@kentaratech.com",
};

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".header-nav");
  const menuButton = document.getElementById("mobile-menu-toggle");
  const closeButton = document.getElementById("mobile-menu-close");
  const menu = document.getElementById("mobile-nav-overlay");
  const desktop = window.matchMedia("(min-width: 960px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // A native dialog provides modal semantics, background inertness and focus containment.
  if (menuButton && closeButton && menu) {
    menuButton.addEventListener("click", () => {
      if (menu.open) return;
      menu.showModal();
      document.body.classList.add("menu-open");
      menuButton.setAttribute("aria-expanded", "true");
      closeButton.focus();
    });
    closeButton.addEventListener("click", () => menu.close());
    // Keep Tab navigation within the menu, including at the browser chrome boundary.
    menu.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = [
        ...menu.querySelectorAll("a[href], button:not([disabled])"),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    menu.addEventListener("close", () => {
      menuButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      if (!desktop.matches) menuButton.focus();
    });
    // Escape is handled by the native dialog's cancel behavior.
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => menu.close());
    });
    desktop.addEventListener("change", (event) => {
      if (event.matches && menu.open) menu.close();
    });
  }

  const updateHeader = () =>
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Open a service when arriving through a deep link to a closed disclosure.
  const openHashTarget = () => {
    const id = location.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (target?.matches("details")) target.open = true;
  };
  openHashTarget();
  window.addEventListener("hashchange", openHashTarget);

  const revealElements = [...document.querySelectorAll(".reveal")];
  let revealObserver;
  const showElement = (element) => {
    element.classList.remove("is-pending");
    element.classList.add("is-visible");
    revealObserver?.unobserve(element);
  };
  const showAll = () => {
    revealObserver?.disconnect();
    revealElements.forEach(showElement);
  };
  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) showElement(entry.target);
        });
      },
      { threshold: 0.05 },
    );
    revealElements.forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add("is-pending");
        revealObserver.observe(element);
      }
    });
    document.addEventListener("focusin", (event) => {
      const pending = event.target.closest(".reveal.is-pending");
      if (pending) showElement(pending);
    });
  }
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) showAll();
  });

  // Native summaries retain their keyboard/expanded state. Motion is only an enhancement.
  document.querySelectorAll("details").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open || reducedMotion.matches) return;
      const content = details.querySelector(
        ".service-content, .support-content",
      );
      content?.animate?.(
        [
          { opacity: 0.6, transform: "translateY(-4px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 220, easing: "ease-out" },
      );
    });
  });
});
