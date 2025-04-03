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
    
    // Navigation circle handlers
    const navItems = document.querySelectorAll('.nav-item');
    const aboutPanel = document.querySelector('.about-panel');
    const contactPanel = document.querySelector('.contact-panel');
    const workView = document.getElementById('work-view');
    const navCircleElement = document.querySelector('.nav-circle');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const navType = this.classList[1];
            
            // Get position of click for clock-like behavior
            const navRect = navCircleElement.getBoundingClientRect();
            const navCenterX = navRect.left + navRect.width / 2;
            const navCenterY = navRect.top + navRect.height / 2;
            
            const clickX = e.clientX;
            const clickY = e.clientY;
            
            // Calculate angle using atan2
            const angle = Math.atan2(clickY - navCenterY, clickX - navCenterX);
            const angleDeg = angle * (180 / Math.PI);
            
            // Calculate position based on angle (along the circular edge)
            const radius = navRect.width / 2 - 20; // 20px inside edge
            const posX = Math.cos(angle) * radius;
            const posY = Math.sin(angle) * radius;
            
            // Update nav indicator position based on angle
            const navIndicator = document.querySelector('.nav-indicator');
            navIndicator.style.transform = 'translate(-50%, -50%)';
            navIndicator.style.left = `calc(50% + ${posX}px)`;
            navIndicator.style.top = `calc(50% + ${posY}px)`;
            
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
    
    // Make nav circle clickable for clock-like behavior
    navCircleElement.addEventListener('click', function(e) {
        if (e.target === this) {
            // Only respond to clicks on the circle itself, not its children
            const navRect = this.getBoundingClientRect();
            const navCenterX = navRect.left + navRect.width / 2;
            const navCenterY = navRect.top + navRect.height / 2;
            
            const clickX = e.clientX;
            const clickY = e.clientY;
            
            // Calculate angle using atan2
            const angle = Math.atan2(clickY - navCenterY, clickX - navCenterX);
            const angleDeg = angle * (180 / Math.PI);
            
            // Calculate position based on angle (along the circular edge)
            const radius = navRect.width / 2 - 20; // 20px inside edge
            const posX = Math.cos(angle) * radius;
            const posY = Math.sin(angle) * radius;
            
            // Update nav indicator position based on angle
            const navIndicator = document.querySelector('.nav-indicator');
            navIndicator.style.transform = 'translate(-50%, -50%)';
            navIndicator.style.left = `calc(50% + ${posX}px)`;
            navIndicator.style.top = `calc(50% + ${posY}px)`;
        }
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

// Setup eye tracking functionality with improved smoothness
function setupEyeTracking() {
    if (!pupil || !eyeContainer) {
        pupil = document.querySelector('.pupil');
        eyeContainer = document.querySelector('.eye-container');
    }
    
    if (pupil && eyeContainer) {
        // Create a buffer for smoother animation
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        const easing = 0.1; // Adjust for smoother or faster movement
        
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
            
            // Set target pupil position
            targetX = Math.cos(angle) * distance;
            targetY = Math.sin(angle) * distance;
        });
        
        // Use requestAnimationFrame for smoother animation
        function animateEye() {
            // Interpolate current position towards target position
            currentX += (targetX - currentX) * easing;
            currentY += (targetY - currentY) * easing;
            
            // Update pupil position
            pupil.style.transform = `translate(${currentX}px, ${currentY}px)`;
            
            // Continue animation loop
            requestAnimationFrame(animateEye);
        }
        
        // Start animation loop
        animateEye();
    }
}

// Handle window resize
window.addEventListener('resize', function() {
    isMobile = window.innerWidth < 768;
});