(() => {
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const menuLinks = document.querySelectorAll("[data-menu-link]");
  const yearEl = document.querySelector("[data-year]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const setScrolled = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });

  const setMenuOpen = (open) => {
    if (!menuToggle || !mobileMenu) return;

    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  };

  menuToggle?.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    setMenuOpen(open);
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 900px)").matches) {
      setMenuOpen(false);
    }
  });

  const initStagger = () => {
    document.querySelectorAll("[data-stagger]").forEach((list) => {
      Array.from(list.children).forEach((child, index) => {
        child.style.setProperty("--stagger", String(index));
      });
    });
  };

  const animateCounters = (root) => {
    const counters = root.querySelectorAll("[data-count-to]");

    counters.forEach((el) => {
      const target = Number(el.getAttribute("data-count-to"));
      const decimals = Number(el.getAttribute("data-count-decimals") || 0);
      const suffix = el.getAttribute("data-count-suffix") || "";
      const duration = 1400;
      const start = performance.now();

      if (Number.isNaN(target)) return;

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = `${value.toFixed(decimals)}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    });
  };

  const cycleStreams = (root) => {
    const items = Array.from(root.querySelectorAll("[data-workspace-streams] li"));
    if (items.length < 2) return;

    let index = items.findIndex((item) => item.classList.contains("is-active"));
    if (index < 0) index = 0;

    window.setInterval(() => {
      items[index].classList.remove("is-active");
      index = (index + 1) % items.length;
      items[index].classList.add("is-active");
    }, 2400);
  };

  const initWorkspace = () => {
    const workspace = document.querySelector("[data-workspace]");
    if (!workspace) return;

    if (reduceMotion) {
      workspace.querySelectorAll("[data-count-to]").forEach((el) => {
        const target = el.getAttribute("data-count-to");
        const decimals = Number(el.getAttribute("data-count-decimals") || 0);
        const suffix = el.getAttribute("data-count-suffix") || "";
        const value = Number(target);
        el.textContent = `${Number.isNaN(value) ? target : value.toFixed(decimals)}${suffix}`;
      });
      return;
    }

    const start = () => {
      animateCounters(workspace);
      cycleStreams(workspace);
    };

    if (!("IntersectionObserver" in window)) {
      start();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          start();
          observer.disconnect();
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(workspace);
  };

  const initHeroTilt = () => {
    const root = document.querySelector("[data-tilt]");
    const tiltEl = root?.querySelector(".hero-panel-tilt");
    if (!root || !tiltEl || reduceMotion) return;

    const maxTilt = 5.5;
    const ease = 0.1;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let frame = 0;
    let rect = root.getBoundingClientRect();

    const setTilt = (x, y) => {
      tiltEl.style.setProperty("--tilt-x", `${x.toFixed(3)}deg`);
      tiltEl.style.setProperty("--tilt-y", `${y.toFixed(3)}deg`);
    };

    const lerp = (from, to, amount) => from + (to - from) * amount;

    const tick = () => {
      currentX = lerp(currentX, targetX, ease);
      currentY = lerp(currentY, targetY, ease);
      setTilt(currentX, currentY);

      const settled =
        Math.abs(currentX - targetX) < 0.02 && Math.abs(currentY - targetY) < 0.02;

      if (settled) {
        currentX = targetX;
        currentY = targetY;
        setTilt(currentX, currentY);
        frame = 0;
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    const requestTick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const refreshRect = () => {
      rect = root.getBoundingClientRect();
    };

    const onPointerEnter = () => {
      refreshRect();
      root.classList.add("is-hovering");
    };

    const onPointerMove = (event) => {
      const width = rect.width || 1;
      const height = rect.height || 1;
      const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / width));
      const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / height));

      targetY = (px - 0.5) * (maxTilt * 2);
      targetX = (0.5 - py) * (maxTilt * 2);
      requestTick();
    };

    const resetTilt = () => {
      root.classList.remove("is-hovering");
      targetX = 0;
      targetY = 0;
      requestTick();
    };

    root.addEventListener("pointerenter", onPointerEnter);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", resetTilt);
    root.addEventListener("pointercancel", resetTilt);
    window.addEventListener("resize", refreshRect, { passive: true });
    window.addEventListener("scroll", refreshRect, { passive: true });
  };

  const initActiveNav = () => {
    const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
    if (!navLinks.length) return;

    const sections = navLinks
      .map((link) => {
        const id = link.getAttribute("href")?.slice(1);
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);

    const uniqueSections = [...new Set(sections)];
    if (!uniqueSections.length) return;

    const setActive = (id) => {
      navLinks.forEach((link) => {
        const match = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", match);
      });
    };

    if (!("IntersectionObserver" in window)) {
      const onScroll = () => {
        const marker = window.scrollY + window.innerHeight * 0.35;
        let current = uniqueSections[0]?.id;
        uniqueSections.forEach((section) => {
          if (section.offsetTop <= marker) current = section.id;
        });
        if (current) setActive(current);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return;
    }

    const visibility = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestId = null;
        let bestRatio = 0;
        visibility.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId) setActive(bestId);
      },
      {
        rootMargin: "-25% 0px -45% 0px",
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      }
    );

    uniqueSections.forEach((section) => observer.observe(section));
  };

  const initReveals = () => {
    const reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const repeats = entry.target.hasAttribute("data-reveal-repeat");

          if (repeats) {
            entry.target.classList.toggle("is-visible", entry.isIntersecting);
            return;
          }

          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    reveals.forEach((el) => observer.observe(el));
  };

  initStagger();
  initWorkspace();
  initHeroTilt();
  initActiveNav();
  initReveals();
})();
