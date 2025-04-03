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
            
            // Get position and angle of clicked option for clock-like behavior
            const optionRect = this.getBoundingClientRect();
            const circleRect = document.querySelector('.mood-circle').getBoundingClientRect();
            
            const circleCenterX = circleRect.left + circleRect.width / 2;
            const circleCenterY = circleRect.top + circleRect.height / 2;
            
            const optionCenterX = optionRect.left + optionRect.width / 2;
            const optionCenterY = optionRect.top + optionRect.height / 2;
            
            // Calculate angle using atan2
            const angle = Math.atan2(optionCenterY - circleCenterY, optionCenterX - circleCenterX);
            const angleDeg = angle * (180 / Math.PI);
            
            // Update indicator to point to option
            moodIndicator.style.transform = `rotate(${angleDeg}deg)`;
            
            // Update sidebar dots to match selected mood
            const theme = this.classList[1].split('-')[0];
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
    
    // Add work thumbnail click handler to open work view
    const workThumbnail = document.querySelector('.work-thumbnail');
    const workView = document.getElementById('work-view');
    
    if (workThumbnail) {
        workThumbnail.addEventListener('click', function() {
            workView.style.transform = 'translateX(0)';
        });
    }
    
    // Navigation circle handlers
    const navItems = document.querySelectorAll('.nav-item');
    const aboutPanel = document.querySelector('.about-panel');
    const contactPanel = document.querySelector('.contact-panel');
    const navIndicator = document.querySelector('.nav-indicator');
    
    navItems.forEach((item) => {
        item.addEventListener('mouseenter', function() {
            // Move indicator to hovered nav item
            const itemRect = this.getBoundingClientRect();
            const circleRect = navCircle.getBoundingClientRect();
            
            const circleCenterX = circleRect.left + circleRect.width / 2;
            const circleCenterY = circleRect.top + circleRect.height / 2;
            
            const itemCenterX = itemRect.left + itemRect.width / 2;
            const itemCenterY = itemRect.top + itemRect.height / 2;
            
            // Position indicator relative to circle center
            navIndicator.style.left = `${itemCenterX - circleCenterX + circleRect.width / 2}px`;
            navIndicator.style.top = `${itemCenterY - circleCenterY + circleRect.height / 2}px`;
        });
        
        item.addEventListener('click', function() {
            // Handle navigation item clicks
            if (this.classList.contains('nav-about')) {
                aboutPanel.classList.add('panel-active');
                contactPanel.classList.remove('panel-active');
            } else if (this.classList.contains('nav-contact')) {
                contactPanel.classList.add('panel-active');
                aboutPanel.classList.remove('panel-active');
            } else if (this.classList.contains('nav-work')) {
                workView.style.transform = 'translateX(0)';
                aboutPanel.classList.remove('panel-active');
                contactPanel.classList.remove('panel-active');
            } else if (this.classList.contains('nav-index')) {
                // Return to main view
                workView.style.transform = 'translateX(100%)';
                aboutPanel.classList.remove('panel-active');
                contactPanel.classList.remove('panel-active');
            }
        });
    });
    
    // Close panel buttons
    const closePanelBtns = document.querySelectorAll('.close-panel');
    closePanelBtns.forEach((btn) => {
        btn.addEventListener('click', function() {
            this.parentElement.classList.remove('panel-active');
        });
    });
    
    // Close work view
    const workClose = document.querySelector('.work-close');
    if (workClose) {
        workClose.addEventListener('click', function() {
            workView.style.transform = 'translateX(100%)';
        });
    }
    
    // Theme dots in sidebar
    const sidebarDots = document.querySelectorAll('.sidebar-dots .dot');
    sidebarDots.forEach((dot) => {
        dot.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.body.className = `${theme}-theme`;
            updateSidebarDots(theme);
        });
    });
});

// Functions
function setupEyeTracking() {
    if (!pupil || !eyeContainer) return;
    
    // Calculate boundaries and limitations
    const eyeRect = document.querySelector('.eye').getBoundingClientRect();
    const eyeRadius = eyeRect.width / 2;
    const maxPupilTravel = eyeRadius * 0.5; // Limit pupil movement to 50% of eye radius
    
    // Add mouse move event listener for eye tracking
    document.addEventListener('mousemove', (e) => {
        if (isMobile) return; // Disable on mobile
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;
        
        // Calculate direction vector from eye center to mouse
        let deltaX = mouseX - eyeCenterX;
        let deltaY = mouseY - eyeCenterY;
        
        // Calculate distance and direction
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Normalize and scale
        if (distance > 0) {
            deltaX = (deltaX / distance) * Math.min(distance, maxPupilTravel);
            deltaY = (deltaY / distance) * Math.min(distance, maxPupilTravel);
        }
        
        // Apply transformation to pupil
        pupil.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });
    
    // Add device orientation for mobile
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

function handleOrientation(event) {
    if (!isMobile || !pupil) return;
    
    // Use beta (x-axis) and gamma (y-axis) for pupil movement
    const maxTilt = 15; // Maximum tilt angle to consider
    const beta = Math.min(Math.max(event.beta, -maxTilt), maxTilt);
    const gamma = Math.min(Math.max(event.gamma, -maxTilt), maxTilt);
    
    // Scale tilt to pupil movement (0-20px)
    const moveX = (gamma / maxTilt) * 20;
    const moveY = (beta / maxTilt) * 20;
    
    // Apply movement
    pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
}

function updateSidebarDots(theme) {
    const dots = document.querySelectorAll('.sidebar-dots .dot');
    dots.forEach((dot) => {
        if (dot.getAttribute('data-theme') === theme) {
            dot.classList.remove('dot-outline');
            dot.classList.add('dot-filled');
        } else {
            dot.classList.remove('dot-filled');
            dot.classList.add('dot-outline');
        }
    });
}

// Handle window resize for responsive behavior
window.addEventListener('resize', function() {
    isMobile = window.innerWidth < 768;
    // Reposition elements if needed
    if (navCircle && navCircle.classList.contains('show')) {
        // Reset indicator position
        const navIndex = document.querySelector('.nav-index');
        if (navIndex) {
            navIndex.dispatchEvent(new Event('mouseenter'));
        }
    }
});

// Add preloader animation effect
function animateLoader() {
    const loaderText = document.getElementById('loader-text');
    if (!loaderText) return;
    
    const originalText = loaderText.textContent;
    let dotCount = 0;
    
    setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        const dots = '.'.repeat(dotCount);
        loaderText.textContent = originalText.replace('...', dots);
    }, 500);
}

// Initialize loader animation
animateLoader();