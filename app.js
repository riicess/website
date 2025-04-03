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
    const setMoodBtn = document.getElementById('set-mood-btn');
    
    moodOptions.forEach((option, index) => {
        option.addEventListener('click', function() {
            moodOptions.forEach(opt => opt.classList.remove('active-option'));
            this.classList.add('active-option');
            
            // Calculate angle based on option position
            const angles = {
                'dark-option': 0,
                'light-option': 90,
                'stark-option': -90
            };
            const optionClass = this.classList[1];
            moodIndicator.style.transform = `rotate(${angles[optionClass]}deg)`;
        });
    });
    
    setMoodBtn.addEventListener('click', function() {
        const activeOption = document.querySelector('.mood-option.active-option');
        if (activeOption) {
            const mood = activeOption.classList[1].split('-')[0];
            document.body.className = `${mood}-theme`;
            moodSelector.classList.remove('show');
            mainContent.classList.add('show');
            header.classList.add('show');
            navCircle.classList.add('show');
        }
    });
});
