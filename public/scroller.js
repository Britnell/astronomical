class MyComponent extends HTMLElement {
  name = "name";
  unwatch = false;
  lastScroll = null;
  raf = null;

  onObserver = (entry) => {
    this.unwatch = !entry.isIntersecting;
    console.log(this.name, entry.isIntersecting);
    if (entry.isIntersecting) this.raf = requestAnimationFrame(this.scrollLoop);
  };
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<slot></slot>`;

    this.unwatch = false;
    this.name = this.getAttribute("name") ?? "name";
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

  digits = (x) => {
    if (x < 0) return 0;
    if (x > 1) return 1 * 100;
    const f = 1000;
    return (100 * Math.floor(x * f)) / f;
  };

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
    const h = window.innerHeight;
    const scrollMax = h + rect.height;
    const top = (h - rect.top) / h;
    const bottom = (h - rect.top - rect.height) / h;
    const view = (h - rect.top) / scrollMax;

    this.style.setProperty("--view", this.digits(view));
    this.style.setProperty("--top", this.digits(top));
    this.style.setProperty("--bottom", this.digits(bottom));
  };

  connectedCallback() {
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer.unobserve(this);
    this.raf && cancelAnimationFrame(this.raf);
  }

  callback(ev) {
    console.log(ev);
  }
}

customElements.define("on-scroller", MyComponent);
