class Router {
  constructor() {
    this.routes = {
      "/": "/pages/home.html",
      "/register": "/pages/register.html",
      "/login": "/pages/login.html",
      "/dashboard": "/pages/dashboard.html",
      "/profile": "/pages/profile.html", // Will need to create these pages later
      "/history": "/pages/dashboard.html", // Will need to create these pages later
    };
    this.components = {
      header: "/components/header.html",
      footer: "/components/footer.html",
      userheader: "/components/userheader.html",
      userfooter: "/components/userfooter.html",
    };
    this.pagesWithoutFooter = ["/login", "/register"];
    this.authenticatedRoutes = ["/dashboard", "/profile", "/history"];
    this.init();
  }

  async init() {
    // Load components first
    await this.loadComponents();

    // Handle navigation
    document.querySelectorAll("nav a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const path = e.target.getAttribute("href");
        this.navigate(path);
        history.pushState({}, "", path);
      });
    });

    // Handle back/forward browser buttons
    window.addEventListener("popstate", () => {
      this.navigate(window.location.pathname);
    });

    // Load initial page
    await this.navigate(window.location.pathname);
  }

  async loadComponents() {
    try {
      const path = window.location.pathname;

      // Load appropriate header based on route
      const headerComponent = this.authenticatedRoutes.includes(path)
        ? this.components.userheader
        : this.components.header;
      const headerResponse = await fetch(headerComponent);
      const headerHtml = await headerResponse.text();
      document.getElementById("header").innerHTML = headerHtml;

      // Load appropriate footer based on route
      if (this.authenticatedRoutes.includes(path)) {
        const footerResponse = await fetch(this.components.userfooter);
        const footerHtml = await footerResponse.text();
        document.getElementById("footer").innerHTML = footerHtml;
      } else if (!this.pagesWithoutFooter.includes(path)) {
        const footerResponse = await fetch(this.components.footer);
        const footerHtml = await footerResponse.text();
        document.getElementById("footer").innerHTML = footerHtml;
      } else {
        document.getElementById("footer").innerHTML = "";
      }

      this.initializeHeaderLinks();
    } catch (error) {
      console.error("Error loading components:", error);
    }
  }

  async navigate(path) {
    const route = this.routes[path] || this.routes["/"];
    try {
      const response = await fetch(route);
      const html = await response.text();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Get the page content
      const pageContent = tempDiv.querySelector(".page");
      if (pageContent) {
        pageContent.classList.add("active");
        document.getElementById("app").innerHTML = pageContent.outerHTML;
      }

      // Handle footer visibility and type
      if (this.authenticatedRoutes.includes(path)) {
        // Load user footer for authenticated routes
        const footerResponse = await fetch(this.components.userfooter);
        const footerHtml = await footerResponse.text();
        document.getElementById("footer").innerHTML = footerHtml;
      } else if (this.pagesWithoutFooter.includes(path)) {
        // Remove footer for login/register pages
        document.getElementById("footer").innerHTML = "";
      } else {
        // Load regular footer for public pages
        const footerResponse = await fetch(this.components.footer);
        const footerHtml = await footerResponse.text();
        document.getElementById("footer").innerHTML = footerHtml;
      }
    } catch (error) {
      console.error("Error loading page:", error);
    }
  }
}

// Initialize the router when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Application initialized");
  new Router();
});
