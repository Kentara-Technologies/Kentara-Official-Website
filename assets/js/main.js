document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const mobileMenuCloseBtn = document.getElementById('mobile-menu-close');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

  if (mobileMenuBtn && mobileNavOverlay) {
    const openMenu = () => {
      mobileNavOverlay.classList.add('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      mobileNavOverlay.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    mobileMenuBtn.addEventListener('click', openMenu);
    if (mobileMenuCloseBtn) {
      mobileMenuCloseBtn.addEventListener('click', closeMenu);
    }

    // Close menu on pressing Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNavOverlay.classList.contains('open')) {
        closeMenu();
      }
    });

    // Close menu on clicking nav link inside drawer
    const mobileLinks = mobileNavOverlay.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Client Intake Form Handler (Start a Project Page)
  const intakeForm = document.getElementById('project-intake-form');
  const formSuccessMessage = document.getElementById('form-success-message');

  if (intakeForm) {
    intakeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = intakeForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      setTimeout(() => {
        intakeForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Complete the Project Intake Form';
        }
        if (formSuccessMessage) {
          formSuccessMessage.style.display = 'block';
          formSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 700);
    });
  }
});
