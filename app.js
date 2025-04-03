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
    // Initialize pupil and eye container for eye tracking
    pupil = document.querySelector('.pupil');
    eyeContainer = document.querySelector('.eye-container');
    
    // Initialize mood selector elements
    const moodOptions = document.querySelectorAll('.mood-option');
    const moodIndicator = document.querySelector('.mood-indicator');
    const setMoodBtn = document.getElementById('set-mood-btn');
    
    // Setup mood options click handlers
    moodOptions.forEach((option) => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            moodOptions.forEach(opt => opt.classList.remove('active-option'));
            // Add active class to clicked option
            this.classList.add('active-option');
            
            // Calculate angle based on option position and update indicator
            const optionClass = this.classList[1];
            const angles = {
                'dark-option': 0,
                'light-option': 90,
                'stark-option': -90
            };
            
            moodIndicator.style.transform = `rotate(${angles[optionClass]}deg)`;
            
            // Update sidebar dots to match selected mood
            const theme = optionClass.split('-')[0];
            updateSidebarDots(theme);
        });
    });
    
    // Setup set mood button handler
    setMoodBtn.addEventListener('click', function() {
        const activeOption = document.querySelector('.mood-option.active-option');
        if (activeOption) {
            const mood = activeOption.classList[1].split('-')[0];
            document.body.className = `${mood}-theme`;
            moodSelector.classList.remove('show');
            mainContent.classList.add('show');
            header.classList.add('show');
            navCircle.classList.add('show');
            
            // Initialize eye tracking after main content is shown
            setupEyeTracking();
        }
    });
    
    // Navigation circle handlers
    const navItems = document.querySelectorAll('.nav-item');
    const aboutPanel = document.querySelector('.about-panel');
    const contactPanel = document.querySelector('.contact-panel');
    const workView = document.getElementById('work-view');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const navType = this.classList[1];
            
            // Update nav indicator position based on clicked item
            updateNavIndicator(navType);
            
            // Handle different navigation actions
            if (navType === 'nav-about') {
                aboutPanel.classList.add('panel-active');
                contactPanel.classList.remove('panel-active');
                workView.style.transform = 'translateX(100%)';
            } else if (navType === 'nav-contact') {
                contactPanel.classList.add('panel-active');
                aboutPanel.classList.remove('panel-active');
                workView.style.transform = 'translateX(100%)';
            } else if (navType === 'nav-work') {
                workView.style.transform = 'translateX(0)';
                aboutPanel.classList.remove('panel-active');
                contactPanel.classList.remove('panel-active');
            } else if (navType === 'nav-index') {
                workView.style.transform = 'translateX(100%)';
                aboutPanel.classList.remove('panel-active');
                contactPanel.classList.remove('panel-active');
            }
        });
    });
    
    // Close panel buttons
    const closePanelBtns = document.querySelectorAll('.close-panel');
    closePanelBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const panel = this.closest('.about-panel, .contact-panel');
            if (panel) {
                panel.classList.remove('panel-active');
            }
        });
    });
    
    // Work view close button
    const workCloseBtn = document.querySelector('.work-close');
    if (workCloseBtn) {
        workCloseBtn.addEventListener('click', function() {
            workView.style.transform = 'translateX(100%)';
        });
    }
    
    // Sidebar dots theme switcher
    const sidebarDots = document.querySelectorAll('.sidebar-dots .dot');
    sidebarDots.forEach(dot => {
        dot.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.body.className = `${theme}-theme`;
            updateSidebarDots(theme);
        });
    });
    
    // Initialize eye tracking on page load
    setupEyeTracking();
});

// Function to update nav indicator position
function updateNavIndicator(navType) {
    const navIndicator = document.querySelector('.nav-indicator');
    
    switch(navType) {
        case 'nav-index':
            navIndicator.style.top = '25px';
            navIndicator.style.left = '50%';
            navIndicator.style.transform = 'translate(-50%, 0)';
            break;
        case 'nav-work':
            navIndicator.style.left = '25px';
            navIndicator.style.top = '50%';
            navIndicator.style.transform = 'translate(0, -50%)';
            break;
        case 'nav-about':
            navIndicator.style.right = '25px';
            navIndicator.style.left = 'auto';
            navIndicator.style.top = '50%';
            navIndicator.style.transform = 'translate(0, -50%)';
            break;
        case 'nav-contact':
            navIndicator.style.bottom = '25px';
            navIndicator.style.top = 'auto';
            navIndicator.style.left = '50%';
            navIndicator.style.transform = 'translate(-50%, 0)';
            break;
    }
}

// Function to update sidebar dots to match selected theme
function updateSidebarDots(theme) {
    const dots = document.querySelectorAll('.sidebar-dots .dot');
    dots.forEach(dot => {
        const dotTheme = dot.getAttribute('data-theme');
        if (dotTheme === theme) {
            dot.classList.remove('dot-outline');
            dot.classList.add('dot-filled');
        } else {
            dot.classList.remove('dot-filled');
            dot.classList.add('dot-outline');
        }
    });
}

// Setup eye tracking functionality
function setupEyeTracking() {
    if (!pupil || !eyeContainer) {
        pupil = document.querySelector('.pupil');
        eyeContainer = document.querySelector('.eye-container');
    }
    
    if (pupil && eyeContainer) {
        document.addEventListener('mousemove', function(e) {
            if (isMobile) return;
            
            const eyeRect = eyeContainer.getBoundingClientRect();
            const eyeCenterX = eyeRect.left + eyeRect.width / 2;
            const eyeCenterY = eyeRect.top + eyeRect.height / 2;
            
            // Calculate angle between mouse and eye center
            const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
            
            // Calculate distance (limited to keep pupil inside eye)
            const distance = Math.min(
                Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 10,
                40
            );
            
            // Set pupil position
            const pupilX = Math.cos(angle) * distance;
            const pupilY = Math.sin(angle) * distance;
            
            pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
        });
    }
}

// Handle window resize
window.addEventListener('resize', function() {
    isMobile = window.innerWidth < 768;
});