const panels = document.querySelectorAll('.panel')

let currentIndex = 0;
let intervalId = startAutoSlide();

function startAutoSlide() {
    return setInterval(() => {
        removeActiveClasses();
        panels[currentIndex].classList.add('active');
        currentIndex = (currentIndex + 1) % panels.length;
    }, 1000);
}

panels.forEach(panel => {
    panel.addEventListener('click', () => {
        removeActiveClasses();
        panel.classList.add('active');
        currentIndex = Array.from(panels).indexOf(panel);
    });

    // Dừng chuyển ảnh khi hover vào panel
    panel.addEventListener('mouseenter', () => {
        clearInterval(intervalId);
    });

    // Tiếp tục chuyển ảnh khi rời chuột khỏi panel
    panel.addEventListener('mouseleave', () => {
        intervalId = startAutoSlide();
    });
});

function removeActiveClasses() {
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
}