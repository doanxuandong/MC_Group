document.addEventListener("DOMContentLoaded", () => {
    const includes = document.querySelectorAll('[data-include]');
  
    includes.forEach(async el => {
      const file = el.getAttribute("data-include");
      const res = await fetch(file);
      const content = await res.text();
      el.innerHTML = content;
    });
  });
  