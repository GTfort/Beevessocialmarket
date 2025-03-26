class Router {
  constructor() {
    this.routes = {
      "/": "/pages/home.html",
      "/register": "/pages/register.html",
      "/login": "/pages/login.html",
      "/dashboard": "/pages/dashboard.html",
      "/profile": "/pages/profile.html",
      "/history": "/pages/history.html",
      "/404": "/pages/404.html",
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
    await this.loadComponents();
    this.setupEventListeners();
    await this.navigate(window.location.pathname);
  }

  async setupEventListeners() {
    // Navigation links
    document.addEventListener("click", (e) => {
      if (e.target.matches("nav a, a[href^='/']")) {
        e.preventDefault();
        const path = e.target.getAttribute("href");
        this.navigate(path);
        history.pushState({}, "", path);
      }
    });

    // Browser back/forward
    window.addEventListener("popstate", () => {
      this.navigate(window.location.pathname);
    });
  }

  async loadComponents() {
    try {
      const path = window.location.pathname;
      await this.loadHeader(path);
      await this.loadFooter(path);
      this.initializeHeaderLinks();
    } catch (error) {
      console.error("Error loading components:", error);
    }
  }

  async loadHeader(path) {
    const headerComponent = this.authenticatedRoutes.includes(path)
      ? this.components.userheader
      : this.components.header;

    const headerResponse = await fetch(headerComponent);
    const headerHtml = await headerResponse.text();
    document.getElementById("header").innerHTML = headerHtml;
  }

  async loadFooter(path) {
    if (this.pagesWithoutFooter.includes(path)) {
      document.getElementById("footer").innerHTML = "";
      return;
    }

    const footerComponent = this.authenticatedRoutes.includes(path)
      ? this.components.userfooter
      : this.components.footer;

    const footerResponse = await fetch(footerComponent);
    const footerHtml = await footerResponse.text();
    document.getElementById("footer").innerHTML = footerHtml;
  }

  async validateToken() {
    try {
      const response = await fetch("/api/validate-token", {
        credentials: "include", // Include cookies
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }

  async navigate(path) {
    // Check if route exists
    if (!this.routes[path]) {
      path = "/404";
    }

    // Check authentication for protected routes
    if (this.authenticatedRoutes.includes(path)) {
      const isValid = await this.validateToken();
      if (!isValid) {
        window.location.href = "/login";
        return;
      }
    }

    try {
      // Load page content
      // Load page content
      const route = this.routes[path];
      const response = await fetch(route);

      if (!response.ok) {
        throw new Error(`Failed to load page: ${route}`);
      }

      const html = await response.text();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Get the page content
      const pageContent = tempDiv.querySelector(".page");
      if (!pageContent) {
        throw new Error("Page content not found");
      }

      // Apply active class and update DOM
      document
        .querySelectorAll(".page")
        .forEach((p) => p.classList.remove("active"));
      pageContent.classList.add("active");
      document.getElementById("app").innerHTML = pageContent.outerHTML;

      // Reload components for the new page
      await this.loadComponents();

      // Initialize any page-specific scripts
      this.initPageScripts(path);
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to 404 if page fails to load
      if (path !== "/404") {
        await this.navigate("/404");
      }
    }
  }

  initPageScripts(path) {
    // Initialize scripts specific to certain pages
    switch (path) {
      case "/login":
        this.initLoginForm();
        break;
      case "/register":
        this.initRegisterForm();
        break;
      case "/dashboard":
        this.initDashboard();
        break;
    }
  }

  initLoginForm() {
    const form = document.getElementById("login-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = form.querySelector("#email").value;
        const password = form.querySelector("#password").value;

        try {
          const response = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Login failed");
          }

          const data = await response.json();
          if (data.success) {
            window.location.href = "/dashboard";
          }
        } catch (error) {
          this.showError(error.message);
        }
      });
    }
  }

  initRegisterForm() {
    const form = document.getElementById("register-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        // Similar to login, but for registration
        // Add your registration logic here
      });
    }
  }

  initDashboard() {
    // Dashboard-specific initialization
    console.log("Dashboard initialized");
    // Example: Load user data
    this.loadUserData();
  }

  async loadUserData() {
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load user data");
      }

      const userData = await response.json();
      // Update dashboard with user data
      console.log("User data loaded:", userData);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  showError(message) {
    const errorElement =
      document.getElementById("error-message") || document.createElement("div");

    errorElement.id = "error-message";
    errorElement.className = "error";
    errorElement.textContent = message;

    if (!document.getElementById("error-message")) {
      document.body.prepend(errorElement);
    }

    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }

  initializeHeaderLinks() {
    // Add event listeners to header links
    document.querySelectorAll("#header a").forEach((link) => {
      link.addEventListener("click", (e) => {
        if (e.target.getAttribute("href").startsWith("/")) {
          e.preventDefault();
          const path = e.target.getAttribute("href");
          this.navigate(path);
          history.pushState({}, "", path);
        }
      });
    });

    // Add logout functionality
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        localStorage.removeItem("token");
        window.location.href = "/login";
      });
    }
  }
}

// Initialize the router when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new Router();
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: e.target.email.value,
      password: e.target.password.value,
    }),
    credentials: "include",
  });

  const data = await response.json();

  if (data.success) {
    window.location.href = data.redirect; // Redirects to dashboard
  } else {
    alert(data.error || "Login failed");
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In";
  }
});
