// Variables for eye tracking
let pupil = null;
let eyeContainer = null;
let isMobile = window.innerWidth < 768;

// Loading sequence
const loader = document.getElementById('loader');
const moodSelector = document.getElementById('mood-selector');
const mainContent = document.querySelector('.main-content');
const header = document.querySelector('.header');
const navCircle = document.querySelector('.nav-circle');

// First show loader
setTimeout(() => {
    loader.classList.add('hide');
    // Then show mood selector after loader fades out
    setTimeout(() => {
        moodSelector.classList.add('show');
        loader.style.display = 'none'; // Completely remove loader
    }, 500);
}, 2500);

document.addEventListener('DOMContentLoaded', function() {
    // ...existing DOMContentLoaded content...
});
