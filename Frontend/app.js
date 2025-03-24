const darkModeToggle = document.getElementById("darkModeToggle");
const html = document.documentElement;

// Check for saved user preference
if (localStorage.getItem("darkMode") === "true") {
  html.classList.add("dark");
}

darkModeToggle.addEventListener("click", () => {
  html.classList.toggle("dark");
  localStorage.setItem("darkMode", html.classList.contains("dark"));
});

//Router
const router = {
  routes: {
    "/": "pages/home.html",

    "/register": "pages/register.html",
    "/login": "pages/login.html",
  },

  init() {
    window.addEventListener("popstate", () => this.handleRoute());
    this.handleRoute();
    this.initLinks();
  },

  initLinks() {
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-route]")) {
        e.preventDefault();
        this.navigateTo(e.target.getAttribute("href"));
      }
    });
  },

  async handleRoute() {
    const path = window.location.pathname || "/";
    const route = this.routes[path] || "pages/404.html";
    const content = await this.loadContent(route);
    document.getElementById("main-content").innerHTML = content;
  },

  async loadContent(route) {
    try {
      const response = await fetch(route);
      return await response.text();
    } catch (error) {
      return "<h1>Page not found</h1>";
    }
  },

  navigateTo(route) {
    window.history.pushState({}, "", route);
    this.handleRoute();
  },
};

document.addEventListener("DOMContentLoaded", () => router.init());
