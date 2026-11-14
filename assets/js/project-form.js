/* Progressive enhancement for the existing Formspree enquiry form. */
(() => {
  const form = document.querySelector(".project-form");
  const card = form?.closest(".intake-card");
  const content = card?.querySelector(".intake-content");
  const success = card?.querySelector(".form-success");
  const status = form?.querySelector(".form-status");
  const button = form?.querySelector(".form-submit");
  const idle = button?.querySelector(".submit-idle");
  const loading = button?.querySelector(".submit-loading");
  const announcement = card?.querySelector(".form-announcement");
  if (!form || !content || !success || !status || !button || !idle || !loading) return;
  if (form.dataset.enquiryReady) return;
  form.dataset.enquiryReady = "true";

  const fields = [...form.querySelectorAll(".form-field input, .form-field select, .form-field textarea")];
  const requiredMessages = {
    full_name: "Please enter your full name.",
    email: "Please enter your email address.",
    phone: "Please enter your phone or WhatsApp number.",
    service_needed: "Please choose a service, or select ‘Not sure yet’.",
    project_challenge: "Please tell us a little about your idea or challenge.",
  };
  let submitting = false;
  let completed = false;

  const clearFieldError = (field) => {
    const errorId = `${field.id}-error`;
    document.getElementById(errorId)?.remove();
    field.removeAttribute("aria-invalid");
    const description = (field.getAttribute("aria-describedby") || "")
      .split(/\s+/).filter((id) => id && id !== errorId).join(" ");
    if (description) field.setAttribute("aria-describedby", description);
    else field.removeAttribute("aria-describedby");
  };

  const showFieldError = (field, message) => {
    clearFieldError(field);
    const error = document.createElement("p");
    error.id = `${field.id}-error`;
    error.className = "field-error";
    error.textContent = message;
    field.after(error);
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", [field.getAttribute("aria-describedby"), error.id].filter(Boolean).join(" "));
  };

  const validateField = (field) => {
    clearFieldError(field);
    let message = "";
    if (field.required && !field.value.trim()) {
      message = requiredMessages[field.name] || "Please complete this field.";
    } else if (field.validity.typeMismatch && field.type === "email") {
      message = "Please enter a valid email address, such as you@example.com.";
    } else if (!field.validity.valid) {
      message = field.validationMessage;
    }
    if (message) showFieldError(field, message);
    return !message;
  };

  const clearStatus = () => {
    status.hidden = true;
    status.replaceChildren();
  };

  const showStatus = (message, includeContact = false) => {
    status.replaceChildren(document.createTextNode(message));
    if (includeContact) {
      const email = document.createElement("a");
      email.href = "mailto:info@kentaratech.com";
      email.textContent = "info@kentaratech.com";
      status.append(document.createTextNode(" If this keeps happening, email "), email, document.createTextNode("."));
    }
    status.hidden = false;
  };

  const setLoading = (active) => {
    button.disabled = active;
    button.classList.toggle("is-loading", active);
    idle.setAttribute("aria-hidden", String(active));
    loading.hidden = !active;
    if (active) form.setAttribute("aria-busy", "true");
    else form.removeAttribute("aria-busy");
    if (announcement) announcement.textContent = active ? "Sending enquiry..." : "";
  };

  // Native validation remains available if JavaScript does not load.
  form.noValidate = true;
  fields.forEach((field) => {
    const updateError = () => {
      if (field.hasAttribute("aria-invalid")) validateField(field);
    };
    field.addEventListener("input", updateError);
    field.addEventListener("change", updateError);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting || completed) return;
    clearStatus();
    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      showStatus("Please check the highlighted fields before sending your enquiry.");
      invalid[0].focus();
      return;
    }

    submitting = true;
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: controller.signal,
        redirect: "error",
      });
      const result = await response.json().catch(() => null);
      const errors = Array.isArray(result?.errors) ? result.errors : [];
      const accepted = result?.ok === true || typeof result?.next === "string";
      if (!response.ok || response.redirected || !accepted || result?.ok === false || result?.error || errors.length) {
        errors.forEach((error) => {
          const field = fields.find((item) => item.name === error.field);
          if (field && typeof error.message === "string") showFieldError(field, error.message);
        });
        throw new Error("Enquiry not accepted");
      }

      completed = true;
      setLoading(false);
      content.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
      card.scrollIntoView({ block: "start", behavior: "instant" });
    } catch (error) {
      setLoading(false);
      showStatus("We couldn't submit your enquiry. Please try again.", true);
      status.focus();
    } finally {
      window.clearTimeout(timeout);
      submitting = false;
    }
  });
})();
