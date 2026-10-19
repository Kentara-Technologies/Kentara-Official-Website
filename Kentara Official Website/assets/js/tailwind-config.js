/* Keep the existing Tailwind CDN architecture aligned with the shared CSS tokens.
   Custom components also work when the CDN is unavailable. */
if (window.tailwind) {
  window.tailwind.config = {
    theme: {
      extend: {
        colors: {
          "bg-primary": "var(--bg-primary)",
          "bg-secondary": "var(--bg-secondary)",
          "bg-tertiary": "var(--bg-tertiary)",
          "text-primary": "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          "accent-cyan": "var(--accent-cyan)",
          "cyan-mist": "var(--cyan-mist)",
          "border-color": "var(--border-color)",
        },
        fontFamily: {
          heading: ["Manrope", "sans-serif"],
          body: ["Inter", "sans-serif"],
        },
      },
    },
  };
}
