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
    const moodOptions = document.querySelectorAll('.mood-option');
    const moodIndicator = document.querySelector('.mood-indicator');
    let currentRotation = 0;

    moodOptions.forEach((option, index) => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            moodOptions.forEach(opt => opt.classList.remove('active-option'));
            
            // Add active class to clicked option
            this.classList.add('active-option');
            
            // Calculate rotation - add 45 degrees each time
            currentRotation += 45;
            
            // Apply rotation - this creates a circular movement effect
            moodIndicator.style.transform = `translateX(-50%) rotate(${currentRotation}deg)`;
        });
    });
});
