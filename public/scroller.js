class MyComponent extends HTMLElement {
  unwatch = false;
  lastScroll = null;
  raf = null;

  onObserver = (entry) => {
    this.unwatch = !entry.isIntersecting;
    if (entry.isIntersecting) this.raf = requestAnimationFrame(this.scrollLoop);
  };
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<slot></slot>`;

    this.unwatch = false;
    this.raf = null;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => this.onObserver(entry));
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0,
      }
    );

    shadow.appendChild(wrapper);
  }

  scrollLoop = () => {
    const y = Math.floor(window.scrollY);

    if (y !== this.lastScroll) {
      this.scrollPos(this);
      this.lastScroll = y;
    }

    if (!this.unwatch) this.raf = requestAnimationFrame(this.scrollLoop);
  };

  scrollPos = (el) => {
    const rect = el.getBoundingClientRect();
    const height = window.innerHeight;
    const fullView = height + rect.height;
    const bottom = height - rect.top - rect.height;

    const scroll = height - rect.top;
    const center = fullView / 2 - scroll;

    this.style.setProperty("--scroll", `${scroll}px`);
    this.style.setProperty("--center", `${center}px`);
    this.style.setProperty("--view", `${fullView}px`);
    this.style.setProperty("--top", `${rect.top}px`);
    this.style.setProperty("--bottom", `${bottom}px`);
  };

  connectedCallback() {
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer.unobserve(this);
    this.raf && cancelAnimationFrame(this.raf);
  }
}

customElements.define("on-scroller", MyComponent);
