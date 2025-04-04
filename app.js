// Variables for eye tracking
let innerPupil = null; // Updated selector
let eyeOutline = null; // Use outline for bounds calculation
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
    }, 500); // Wait for loader fade out
}, 2000); // Reduced loader time slightly

document.addEventListener('DOMContentLoaded', function() {
    // Initialize pupil and eye container for eye tracking
    innerPupil = document.querySelector('.inner-pupil');
    eyeOutline = document.querySelector('.eye-outline');
    eyeContainer = document.querySelector('.eye-container');

    // Initialize mood selector elements
    const moodCircle = document.querySelector('.mood-circle');
    const moodOptions = document.querySelectorAll('.mood-option');
    const moodIndicator = document.querySelector('.mood-indicator');
    const setMoodBtn = document.getElementById('set-mood-btn');

    // Setup mood options click handlers with arrow rotation
    moodOptions.forEach((option) => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            moodOptions.forEach(opt => opt.classList.remove('active-option'));
            // Add active class to clicked option
            this.classList.add('active-option');

            const optionRect = this.getBoundingClientRect();
            const circleRect = moodCircle.getBoundingClientRect();

            // Calculate center of the circle
            const circleCenterX = circleRect.left + circleRect.width / 2;
            const circleCenterY = circleRect.top + circleRect.height / 2;

            // Calculate center of the clicked option (relative to viewport)
            const optionCenterX = optionRect.left + optionRect.width / 2;
            const optionCenterY = optionRect.top + optionRect.height / 2;

            // Calculate angle from circle center to option center
            // Add 90 degrees because 0 degrees in atan2 is right, but our arrow starts pointing up
            const angleRad = Math.atan2(optionCenterY - circleCenterY, optionCenterX - circleCenterX);
            const angleDeg = angleRad * (180 / Math.PI) + 90; // Offset by 90deg

            // Update indicator arrow rotation
            moodIndicator.style.transform = `translateX(-50%) rotate(${angleDeg}deg)`;

            // Update sidebar dots to match selected mood
            const theme = this.classList.contains('dark-option') ? 'dark' :
                          this.classList.contains('light-option') ? 'light' :
                          this.classList.contains('spring-option') ? 'spring' : 'dark'; // Default to dark
            updateSidebarDots(theme);
        });
    });

     // Set initial mood arrow position based on default active option
    const initialActiveMood = document.querySelector('.mood-option.active-option');
    if (initialActiveMood) {
        initialActiveMood.click(); // Simulate click to set initial arrow position
    }


    // Setup set mood button handler
    setMoodBtn.addEventListener('click', function() {
        const activeOption = document.querySelector('.mood-option.active-option');
        if (activeOption) {
            const mood = activeOption.classList.contains('dark-option') ? 'dark' :
                         activeOption.classList.contains('light-option') ? 'light' :
                         activeOption.classList.contains('spring-option') ? 'spring' : 'dark'; // Default to dark

            document.body.className = `${mood}-theme`; // Apply theme class to body

            // Hide mood selector
            moodSelector.classList.remove('show');
            moodSelector.style.transform = 'scale(0.9)'; // Optional shrink effect


            setTimeout(() => {
                moodSelector.style.display = 'none'; // Hide completely after transition

                // Show main content with transitions
                mainContent.classList.add('show');
                header.classList.add('show');
                navCircle.classList.add('show'); // Nav circle appears with its own transition

                // Initialize eye tracking after main content is shown
                setupEyeTracking();
                // Set initial nav indicator position
                 const initialNavItem = document.querySelector('.nav-item.nav-index'); // Start at Index
                 if(initialNavItem) {
                    moveNavIndicator(initialNavItem);
                 }

            }, 500); // Wait for mood selector fade out
        }
    });

    // Add work thumbnail click handler
    const workThumbnail = document.querySelector('.work-thumbnail');
    const workView = document.getElementById('work-view');

    if (workThumbnail && workView) {
        workThumbnail.addEventListener('click', function() {
            workView.classList.add('show'); // Use class to trigger transition
            closeAllPanels(); // Close panels when opening work view
        });
    }

    // Navigation circle handlers
    const navItems = document.querySelectorAll('.nav-item');
    const aboutPanel = document.querySelector('.about-panel');
    const contactPanel = document.querySelector('.contact-panel');
    const panels = [aboutPanel, contactPanel]; // Array of panels

     // Function to move the indicator
    function moveNavIndicator(targetItem) {
        const navIndicator = document.querySelector('.nav-indicator');
        if (!navIndicator || !navCircle) return;

        const angle = parseFloat(targetItem.getAttribute('data-angle')) || 0;
        const radius = navCircle.offsetWidth / 2 - navIndicator.offsetWidth / 2 - 10; // Adjust radius (e.g., subtract padding/border)

        // Rotate the indicator around the circle's center and move it outwards
        navIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${-radius}px)`;
    }

    navItems.forEach((item) => {
        item.addEventListener('mouseenter', function() {
             moveNavIndicator(this);
        });

        // Optional: Reset indicator when mouse leaves the circle
        // navCircle.addEventListener('mouseleave', () => {
        //     const currentItem = document.querySelector('.nav-item.active-nav') || document.querySelector('.nav-item.nav-index');
        //     if(currentItem) moveNavIndicator(currentItem);
        // });

        item.addEventListener('click', function() {
            // Optional: Mark active nav item visually if needed
            // navItems.forEach(i => i.classList.remove('active-nav'));
            // this.classList.add('active-nav');

            // Handle navigation item clicks
            if (this.classList.contains('nav-about')) {
                togglePanel(aboutPanel, contactPanel);
            } else if (this.classList.contains('nav-contact')) {
                togglePanel(contactPanel, aboutPanel);
            } else if (this.classList.contains('nav-work')) {
                if (workView) workView.classList.add('show');
                closeAllPanels();
            } else if (this.classList.contains('nav-index')) {
                if (workView) workView.classList.remove('show');
                closeAllPanels();
            }
             // Move indicator to clicked item
             moveNavIndicator(this);
        });
    });

    function togglePanel(panelToShow, panelToHide) {
        if (panelToShow.classList.contains('panel-active')) {
            panelToShow.classList.remove('panel-active'); // Close if already open
        } else {
            if (panelToHide) panelToHide.classList.remove('panel-active'); // Close the other panel
            panelToShow.classList.add('panel-active'); // Open the target panel
        }
    }

    function closeAllPanels() {
         panels.forEach(panel => panel.classList.remove('panel-active'));
    }


    // Close panel buttons
    const closePanelBtns = document.querySelectorAll('.close-panel');
    closePanelBtns.forEach((btn) => {
        btn.addEventListener('click', function() {
            this.parentElement.classList.remove('panel-active');
        });
    });

    // Close work view
    const workClose = document.querySelector('.work-close');
    if (workClose && workView) {
        workClose.addEventListener('click', function() {
            workView.classList.remove('show'); // Use class for transition
        });
    }

    // Theme dots in sidebar
    const sidebarDots = document.querySelectorAll('.sidebar-dots .dot');
    sidebarDots.forEach((dot) => {
        dot.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.body.className = `${theme}-theme`; // Apply theme class
            updateSidebarDots(theme);

            // Add scale animation for dot click
            this.style.transform = 'scale(1.3)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });

    // Initial sidebar dot state based on default theme
    updateSidebarDots(document.body.classList[0]?.split('-')[0] || 'dark');

}); // End DOMContentLoaded

// --- FUNCTIONS ---

function setupEyeTracking() {
    // Ensure elements exist
    if (!innerPupil || !eyeOutline || !eyeContainer) {
        console.error("Eye elements not found for tracking.");
        return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const easing = 0.08; // Slightly slower easing
    let rafId = null;
    let isTracking = false;
    let lastMouseX = window.innerWidth / 2; // Start center
    let lastMouseY = window.innerHeight / 2;

    function updatePupilPosition() {
        if (!isTracking && (Math.abs(currentX - targetX) < 0.1 && Math.abs(currentY - targetY) < 0.1)) {
             // Stop RAF if not tracking and close to target (center)
            if(rafId) cancelAnimationFrame(rafId);
            rafId = null;
            return; // Exit if not tracking and centered
        }

        // Calculate movement constraints based on the eye-outline size
        const outlineRect = eyeOutline.getBoundingClientRect();
        const maxMoveX = outlineRect.width * 0.3; // Allow moving 30% of the outline width
        const maxMoveY = outlineRect.height * 0.3; // Allow moving 30% of the outline height

        // If not tracking, target is the center (0, 0)
        if (!isTracking) {
            targetX = 0;
            targetY = 0;
        } else {
            const eyeRect = eyeOutline.getBoundingClientRect(); // Use outline bounds
            const eyeCenterX = eyeRect.left + eyeRect.width / 2;
            const eyeCenterY = eyeRect.top + eyeRect.height / 2;

            // Calculate vector from eye center to mouse
            const deltaX = lastMouseX - eyeCenterX;
            const deltaY = lastMouseY - eyeCenterY;

            // Reduce the influence distance - makes movement less extreme
            const influenceFactor = 0.1;
            targetX = deltaX * influenceFactor;
            targetY = deltaY * influenceFactor;

             // Clamp movement within the calculated bounds
             targetX = Math.max(-maxMoveX, Math.min(maxMoveX, targetX));
             targetY = Math.max(-maxMoveY, Math.min(maxMoveY, targetY));
        }


        // Apply easing
        currentX += (targetX - currentX) * easing;
        currentY += (targetY - currentY) * easing;

        // Apply transform relative to the center of the pupil's parent (eye-outline)
        innerPupil.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;

        rafId = requestAnimationFrame(updatePupilPosition);
    }


    document.addEventListener('mousemove', (e) => {
        if (isMobile) return;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        if (!isTracking) {
            isTracking = true;
            if(!rafId) updatePupilPosition(); // Start RAF if not already running
        }
    }, { passive: true }); // Use passive listener

    document.addEventListener('mouseleave', () => {
        if (isMobile) return;
        isTracking = false; // Target becomes center (0,0), animation continues via RAF until centered
        // Don't cancel RAF here, let it return pupil to center smoothly
    });

     // Start animation loop initially to center the pupil if mouse never enters
     if (!rafId) updatePupilPosition();
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
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 768;

     // Re-initialize nav indicator position if needed
    const currentNavItem = document.querySelector('.nav-item.active-nav') || document.querySelector('.nav-item.nav-index');
    if (navCircle && navCircle.classList.contains('show') && currentNavItem) {
       setTimeout(() => { // Delay slightly to allow layout reflow
           moveNavIndicator(currentNavItem);
       }, 50);
    }

    // Re-run eye tracking setup if needed (e.g., bounds changed)
    if (innerPupil && !isMobile) {
        setupEyeTracking();
    } else if (wasMobile && !isMobile) { // If resizing from mobile to desktop
         setupEyeTracking();
    } else if (isMobile && innerPupil) { // Reset pupil on mobile
         innerPupil.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
    }

});

// Add preloader animation effect (dots)
function animateLoader() {
    const loaderTextElement = document.getElementById('loader-text');
    if (!loaderTextElement) return;

    const originalTextContent = loaderTextElement.textContent.replace(/\.\.\.$/, ''); // Remove existing dots
    let dotCount = 0;
    const intervalId = setInterval(() => {
        // Check if loader is still visible
        if (loader.style.display === 'none' || loader.classList.contains('hide')) {
            clearInterval(intervalId);
            return;
        }
        dotCount = (dotCount + 1) % 4;
        const dots = '.'.repeat(dotCount);
        loaderTextElement.textContent = originalTextContent + dots;
    }, 400); // Slower dot animation
}

// Initialize loader animation
animateLoader();

// Add basic device orientation handling for mobile eye (optional, can be intensive)
// function handleOrientation(event) {
//     if (!isMobile || !innerPupil || !eyeOutline) return;

//     const maxTilt = 25; // Max tilt degrees
//     const outlineRect = eyeOutline.getBoundingClientRect();
//     const maxMoveX = outlineRect.width * 0.2; // Limit movement range
//     const maxMoveY = outlineRect.height * 0.2;

//     // Beta: front-back tilt, Gamma: left-right tilt
//     // Clamp values to maxTilt
//     let tiltX = Math.min(Math.max(event.gamma, -maxTilt), maxTilt);
//     let tiltY = Math.min(Math.max(event.beta, -maxTilt), maxTilt);

//     // Normalize tilt values (-1 to 1) and scale by maxMove
//     const moveX = (tiltX / maxTilt) * maxMoveX;
//     const moveY = (tiltY / maxTilt) * maxMoveY;

//     innerPupil.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px)`;
// }

// if (window.DeviceOrientationEvent) {
//   window.addEventListener('deviceorientation', handleOrientation);
// }