const panels = document.querySelectorAll('.panel')

let currentIndex = 0;

setInterval(() => {
    removeActiveClasses();
    panels[currentIndex].classList.add('active');
    currentIndex = (currentIndex + 1) % panels.length;
}, 3000);

panels.forEach(panel => {
    panel.addEventListener('click', () => {
        removeActiveClasses();
        panel.classList.add('active');
        currentIndex = Array.from(panels).indexOf(panel);
    });
});

function removeActiveClasses() {
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
}