// --- START OF FILE app.js ---

// ... (Keep existing variables: innerPupil, eyeOutline, etc.) ...
let isMobile = window.innerWidth < 768; // Keep this

// Loading sequence
// ... (Keep existing loader/mood selector logic) ...

document.addEventListener('DOMContentLoaded', function() {
    // ... (Keep existing initializations: pupil, eye, mood selector) ...

    // --- NEW: Cursor Follower Setup ---
    const cursorFollower = document.getElementById('cursor-follower-text');
    const hoverTriggers = document.querySelectorAll('.interactive-hover-trigger');
    let mouseX = 0, mouseY = 0;
    let followerActive = false; // Track if the follower should be visible

    // Single mousemove listener for performance
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (followerActive && cursorFollower && !isMobile) {
            // Update position using transform for smoother animation
            cursorFollower.style.transform = `translate(${mouseX + 15}px, ${mouseY + 15}px)`;
        }
    }, { passive: true });

    hoverTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', (e) => {
            if (isMobile || !cursorFollower) return; // Don't run on mobile

            const hoverText = trigger.getAttribute('data-hover-text');
            if (hoverText) {
                cursorFollower.textContent = hoverText;
                // Set initial position immediately
                cursorFollower.style.transform = `translate(${mouseX + 15}px, ${mouseY + 15}px)`;
                cursorFollower.classList.add('active');
                followerActive = true;
            }
        });

        trigger.addEventListener('mouseleave', () => {
            if (isMobile || !cursorFollower) return;
            cursorFollower.classList.remove('active');
            followerActive = false;
        });

         // Add click listener directly to triggers to hide follower
         trigger.addEventListener('click', () => {
             if (isMobile || !cursorFollower) return;
             cursorFollower.classList.remove('active'); // Hide immediately on click
             followerActive = false;
             // Note: The actual panel opening logic is handled below
             // by associating these triggers with nav items or direct actions.
         });
    });

    function hideCursorFollower() {
         if (cursorFollower) {
            cursorFollower.classList.remove('active');
            followerActive = false;
         }
    }
    // --- END NEW: Cursor Follower Setup ---


    // --- Existing Logic Modifications ---

    // Setup set mood button handler
    setMoodBtn.addEventListener('click', function() {
        // ... (keep existing mood setting logic) ...
        setTimeout(() => {
            moodSelector.style.display = 'none';
            contentWrapper.classList.add('show');
            header.classList.add('show');
            navCircle.classList.add('show');
            setupEyeTracking();
            const initialNavItem = document.querySelector('.nav-item.nav-index');
            if(initialNavItem) moveNavIndicator(initialNavItem);
             hideCursorFollower(); // Hide follower when mood is set
        }, 500);
    });

    // Navigation and Panel elements
    const navItems = document.querySelectorAll('.nav-item');
    const aboutPanel = document.querySelector('.about-panel');
    const contactPanel = document.querySelector('.contact-panel');
    const panels = [aboutPanel, contactPanel];
    const workView = document.getElementById('work-view');
    const indexNavItem = document.querySelector('.nav-item.nav-index');
    const aboutNavItem = document.querySelector('.nav-item.nav-about');
    const contactNavItem = document.querySelector('.nav-item.nav-contact');
    const workNavItem = document.querySelector('.nav-item.nav-work');

    // --- Trigger Element References (for click actions) ---
    const headerNameTrigger = document.getElementById('header-name-trigger');
    const headerStatusTrigger = document.getElementById('header-status-trigger');
    const workThumbnailTrigger = document.getElementById('work-thumbnail-trigger'); // Get the specific trigger


    // --- Link Trigger Clicks to Actions ---
    if (headerNameTrigger && aboutPanel && aboutNavItem) {
        headerNameTrigger.addEventListener('click', () => {
            togglePanel(aboutPanel, contactPanel);
            moveNavIndicator(aboutNavItem); // Move indicator
            hideCursorFollower(); // Hide follower
        });
    }
    if (headerStatusTrigger && contactPanel && contactNavItem) {
        headerStatusTrigger.addEventListener('click', () => {
            togglePanel(contactPanel, aboutPanel);
            moveNavIndicator(contactNavItem); // Move indicator
            hideCursorFollower(); // Hide follower
        });
    }
     // Use the specific trigger ID for the work thumbnail click
    if (workThumbnailTrigger && workView && workNavItem) {
        workThumbnailTrigger.addEventListener('click', function() {
             workView.classList.add('show');
             closeAllPanels(); // Close other panels
             moveNavIndicator(workNavItem); // Move indicator to Work
             hideCursorFollower(); // Hide follower
        });
    }
    // --- Remove OLD Hover Button Listeners & workThumbnail listener ---
    // (These are now handled by the trigger listeners above)


    // Function to move the indicator
    function moveNavIndicator(targetItem) {
       // ... (keep existing moveNavIndicator logic) ...
         const navIndicator = document.querySelector('.nav-indicator');
        if (!navIndicator || !navCircle || !targetItem) return;

        const angle = parseFloat(targetItem.getAttribute('data-angle')) || 0;
        const circleRadius = navCircle.offsetWidth / 2;
        const indicatorRadius = navIndicator.offsetWidth / 2;
        const offset = circleRadius - indicatorRadius - 10; // 10px padding from edge

        navIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${-offset}px) rotate(${-angle}deg)`;
    }


    navItems.forEach((item) => {
        item.addEventListener('click', function() {
            hideCursorFollower(); // Hide follower on any nav click
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
             moveNavIndicator(this);
        });
    });

    function togglePanel(panelToShow, panelToHide) {
        hideCursorFollower(); // Hide follower when toggling
        if (!panelToShow) return;
        if (panelToShow.classList.contains('panel-active')) {
            panelToShow.classList.remove('panel-active');
             if (indexNavItem) moveNavIndicator(indexNavItem);
        } else {
            if (panelToHide) panelToHide.classList.remove('panel-active');
            panelToShow.classList.add('panel-active');
            // Indicator moved by the click handler
        }
    }

    function closeAllPanels() {
         panels.forEach(panel => {
             if (panel && panel.classList.contains('panel-active')) {
                 panel.classList.remove('panel-active');
                 // Note: Indicator reset happens in specific close actions now
             }
         });
          // If panels were closed, implicitly reset indicator unless something else was just opened
         // Safest to handle reset explicitly in close actions (X, index click)
    }


    // Close panel buttons
    const closePanelBtns = document.querySelectorAll('.close-panel');
    closePanelBtns.forEach((btn) => {
        btn.addEventListener('click', function() {
            const panel = this.closest('.about-panel, .contact-panel');
            if (panel) {
                panel.classList.remove('panel-active');
                 if (indexNavItem) moveNavIndicator(indexNavItem);
                 hideCursorFollower(); // Hide follower
            }
        });
    });

    // Close work view
    const workClose = document.querySelector('.work-close');
    if (workClose && workView) {
        workClose.addEventListener('click', function() {
            workView.classList.remove('show');
             if (indexNavItem) moveNavIndicator(indexNavItem);
             hideCursorFollower(); // Hide follower
        });
    }

    // Theme dots in sidebar
    sidebarDots.forEach((dot) => {
        dot.addEventListener('click', function() {
            // ... (keep existing theme dot logic) ...
            const theme = this.getAttribute('data-theme');
            document.body.className = `${theme}-theme`;
            updateSidebarDots(theme);
             this.style.transform = 'scale(1.3)';
            setTimeout(() => { this.style.transform = 'scale(1)'; }, 150);
            hideCursorFollower(); // Hide follower
        });
    });

    // ... (Keep updateSidebarDots function) ...
    function updateSidebarDots(theme) {
        const dots = document.querySelectorAll('.sidebar-dots .dot');
        dots.forEach((dot) => {
            dot.classList.remove('dot-outline', 'dot-filled');
            if (dot.getAttribute('data-theme') === theme) {
                dot.classList.add('dot-filled');
            } else {
                dot.classList.add('dot-outline');
            }
        });
    }

    // ... (Keep setupEyeTracking function) ...
    function setupEyeTracking() {
        // Ensure elements exist
        if (!innerPupil || !eyeOutline || !eyeContainer || isMobile) { // Added isMobile check
             if(isMobile && innerPupil) { // Reset on mobile
                 innerPupil.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
             }
             // console.error("Eye elements not found for tracking or on mobile.");
            return;
        }

        let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
        const easing = 0.08;
        let rafId = null;
        let isTracking = false;
        let lastMouseX = window.innerWidth / 2, lastMouseY = window.innerHeight / 2;

        function updatePupilPosition() {
            if (isMobile) { // Double check in loop
                 if(rafId) cancelAnimationFrame(rafId);
                 rafId = null;
                return;
            }
             // ... (rest of eye tracking logic remains the same) ...
             if (!isTracking && Math.abs(currentX - targetX) < 0.1 && Math.abs(currentY - targetY) < 0.1) {
                 if (currentX !== 0 || currentY !== 0) {
                    innerPupil.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
                 }
                 if(rafId) cancelAnimationFrame(rafId);
                 rafId = null;
                 return;
             }
            const outlineRect = eyeOutline.getBoundingClientRect();
            const maxMoveX = outlineRect.width * 0.3;
            const maxMoveY = outlineRect.height * 0.3;
             if (!isTracking) { targetX = 0; targetY = 0; }
             else {
                 const eyeRect = eyeOutline.getBoundingClientRect();
                 const eyeCenterX = eyeRect.left + eyeRect.width / 2;
                 const eyeCenterY = eyeRect.top + eyeRect.height / 2;
                 const deltaX = lastMouseX - eyeCenterX;
                 const deltaY = lastMouseY - eyeCenterY;
                 const influenceFactor = 0.1;
                 targetX = deltaX * influenceFactor;
                 targetY = deltaY * influenceFactor;
                 targetX = Math.max(-maxMoveX, Math.min(maxMoveX, targetX));
                 targetY = Math.max(-maxMoveY, Math.min(maxMoveY, targetY));
             }
            currentX += (targetX - currentX) * easing;
            currentY += (targetY - currentY) * easing;
            innerPupil.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;
            rafId = requestAnimationFrame(updatePupilPosition);
        }

        // Use document mousemove for simplicity, check isMobile inside
        document.addEventListener('mousemove', (e) => {
             if(isMobile) return;
             lastMouseX = e.clientX;
             lastMouseY = e.clientY;
            // No need to manage isTracking here if eyeContainer handles enter/leave
        }, { passive: true });

        // Attach enter/leave to eyeContainer to control tracking state
        eyeContainer.addEventListener('mouseenter', () => {
            if(isMobile) return;
            isTracking = true;
            if(!rafId) updatePupilPosition();
        });
        eyeContainer.addEventListener('mouseleave', () => {
            if(isMobile) return;
            isTracking = false;
             if(!rafId) updatePupilPosition(); // Start centering animation
        });

        // Initial centering animation only if not mobile
         if (!rafId && !isMobile) updatePupilPosition();
    }


    // ... (Keep window resize handler, ensure it checks isMobile and calls hideCursorFollower()) ...
     window.addEventListener('resize', function() {
        const wasMobile = isMobile;
        isMobile = window.innerWidth < 768;

        hideCursorFollower(); // Hide follower on resize

        // ... (rest of resize logic for nav indicator and eye tracking) ...
        // Re-select elements that might be affected by layout changes
         const navItemsForResize = document.querySelectorAll('.nav-item');
         const aboutPanelForResize = document.querySelector('.about-panel');
         const contactPanelForResize = document.querySelector('.contact-panel');
         const workViewForResize = document.getElementById('work-view');

         if (navCircle && navCircle.classList.contains('show')) {
           setTimeout(() => {
                let activeItem = document.querySelector('.nav-item.nav-index');
                if (aboutPanelForResize?.classList.contains('panel-active')) {
                    activeItem = document.querySelector('.nav-item.nav-about');
                } else if (contactPanelForResize?.classList.contains('panel-active')) {
                    activeItem = document.querySelector('.nav-item.nav-contact');
                } else if (workViewForResize?.classList.contains('show')) {
                     activeItem = document.querySelector('.nav-item.nav-work');
                }
               if (activeItem) moveNavIndicator(activeItem);
           }, 100);
        }

        // Re-select eye elements and re-setup tracking
        innerPupil = document.querySelector('.inner-pupil');
        eyeOutline = document.querySelector('.eye-outline');
        eyeContainer = document.querySelector('.eye-container');

         if (innerPupil && eyeOutline && eyeContainer) {
            if (!isMobile) { // Desktop or transition to desktop
                 setupEyeTracking();
            } else { // Mobile or transition to mobile
                 innerPupil.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
                 if (typeof rafId !== 'undefined' && rafId) { // Cancel eye animation on mobile
                     cancelAnimationFrame(rafId);
                     rafId = null;
                 }
            }
        }
    });


    // ... (Keep animateLoader function) ...
     function animateLoader() {
        const loaderTextElement = document.getElementById('loader-text');
        if (!loaderTextElement) return;
        const originalTextContent = loaderTextElement.textContent.replace(/\.*$/, '');
        let dotCount = 0;
        let intervalId = null;
        function updateDots() {
            const currentLoader = document.getElementById('loader');
            if (!currentLoader || currentLoader.style.display === 'none' || currentLoader.classList.contains('hide')) {
                if (intervalId) clearInterval(intervalId);
                return;
            }
            dotCount = (dotCount + 1) % 4;
            loaderTextElement.textContent = originalTextContent + '.'.repeat(dotCount);
        }
        intervalId = setInterval(updateDots, 400);
    }
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

    // Initial setup calls
    updateSidebarDots(document.body.classList[0]?.split('-')[0] || 'dark');
    // Initial eye setup happens after mood is set, or on resize if already visible


}); // End DOMContentLoaded


// --- END OF FILE app.js ---