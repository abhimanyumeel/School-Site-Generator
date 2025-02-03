document.addEventListener("DOMContentLoaded", function () {
  // Initialize Masonry
  const grid = document.querySelector(".gallery-masonry");
  const masonry = new Masonry(grid, {
    itemSelector: ".gallery-item",
    percentPosition: true,
    transitionDuration: "0.3s",
  });

  // Initialize ImagesLoaded
  imagesLoaded(grid).on("progress", function () {
    masonry.layout();
  });

  // Filter functionality
  const categoryFilter = document.getElementById("categoryFilter");
  const yearFilter = document.getElementById("yearFilter");
  const searchInput = document.getElementById("gallerySearch");

  function filterItems() {
    const selectedCategory = categoryFilter.value;
    const selectedYear = yearFilter.value;
    const searchTerm = searchInput.value.toLowerCase();

    document.querySelectorAll(".gallery-item").forEach((item) => {
      const category = item.dataset.category;
      const year = item.dataset.year;
      const title = item.querySelector("h3").textContent.toLowerCase();
      const description = item
        .querySelector(".gallery-description")
        .textContent.toLowerCase();

      const matchesCategory =
        !selectedCategory || category === selectedCategory;
      const matchesYear = !selectedYear || year === selectedYear;
      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        description.includes(searchTerm);

      if (matchesCategory && matchesYear && matchesSearch) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });

    masonry.layout();
  }

  // Add event listeners
  categoryFilter.addEventListener("change", filterItems);
  yearFilter.addEventListener("change", filterItems);
  searchInput.addEventListener("input", debounce(filterItems, 300));

  // Debounce function for search input
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Smooth scroll to sections
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Add animation on scroll
  const animateOnScroll = () => {
    const items = document.querySelectorAll(".gallery-item, .event-card");
    items.forEach((item) => {
      const itemTop = item.getBoundingClientRect().top;
      const itemBottom = item.getBoundingClientRect().bottom;

      if (itemTop < window.innerHeight && itemBottom > 0) {
        item.classList.add("fade-in");
      }
    });
  };

  window.addEventListener("scroll", debounce(animateOnScroll, 100));
  animateOnScroll(); // Initial check

  // Handle tab switching
  const tabButtons = document.querySelectorAll('[data-bs-toggle="pill"]');
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const target = document.querySelector(this.dataset.bsTarget);

      // Remove active class from all tabs and content
      document.querySelectorAll(".tab-pane").forEach((pane) => {
        pane.classList.remove("show", "active");
      });
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active");
      });

      // Add active class to clicked tab and its content
      this.classList.add("active");
      target.classList.add("show", "active");

      // Relayout masonry if gallery tab
      if (target.id === "gallery") {
        setTimeout(() => {
          masonry.layout();
        }, 300);
      }
    });
  });
});
