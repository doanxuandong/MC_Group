function attachPanelEvents() {
    const panels = document.querySelectorAll('.panel');
    let currentIndex = 0;
    let intervalId = startAutoSlide();

    function startAutoSlide() {
        return setInterval(() => {
            removeActiveClasses();
            panels[currentIndex].classList.add('active');
            currentIndex = (currentIndex + 1) % panels.length;
        }, 1000);
    }

    function removeActiveClasses() {
        panels.forEach(panel => panel.classList.remove('active'));
    }

    panels.forEach(panel => {
        panel.addEventListener('click', () => {
            removeActiveClasses();
            panel.classList.add('active');
            currentIndex = Array.from(panels).indexOf(panel);
        });
        panel.addEventListener('mouseenter', () => {
            clearInterval(intervalId);
        });
        panel.addEventListener('mouseleave', () => {
            intervalId = startAutoSlide();
        });
    });
}
window.attachPanelEvents = attachPanelEvents;