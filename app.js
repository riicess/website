// --- START OF FILE app.js ---

// Global variables
let pupil = null;
let eye = null;
let eyeContainer = null;
let cursorFollower = null; // Follower element
let isMobile = window.innerWidth < 768;
let mouseX = 0, mouseY = 0; // Global mouse position

// Animation frame IDs
let eyeTrackingRafId = null;
let followerRafId = null;

// State variables
let isEyeTrackingActive = false;
let isFollowerActive = false; // Use this flag consistently
let activeTriggerElement = null; // Track hovered trigger

// Loading sequence elements (defined early)
const loader = document.getElementById('loader');
const moodSelector = document.getElementById('mood-selector');

// Loader Hiding logic
setTimeout(() => { if (loader) { loader.classList.add('hide'); setTimeout(() => { if (moodSelector) moodSelector.classList.add('show'); if (loader) loader.style.display = 'none'; }, 500); } }, 2000);

// Preloader animation function definition
function animateLoader() { const loaderTextElement = document.getElementById('loader-text'); const currentLoaderCheck = document.getElementById('loader'); if (!loaderTextElement || !currentLoaderCheck) return; const originalTextContent = loaderTextElement.textContent.replace(/\.*$/, ''); let dotCount = 0; let intervalId = null; function updateDots() { const currentLoader = document.getElementById('loader'); if (!currentLoader || currentLoader.style.display === 'none' || currentLoader.classList.contains('hide')) { if (intervalId) clearInterval(intervalId); intervalId = null; return; } dotCount = (dotCount + 1) % 4; if (loaderTextElement) loaderTextElement.textContent = originalTextContent + '.'.repeat(dotCount); } if (intervalId) clearInterval(intervalId); intervalId = setInterval(updateDots, 400); }

// --- MOVED HIDE FOLLOWER FUNCTION TO GLOBAL SCOPE ---
function hideFollower() {
    // Ensure cursorFollower is selected before trying to use it
    // This check might be redundant if initialized in DOMContentLoaded, but safe
    if (!cursorFollower) {
        cursorFollower = document.getElementById('cursor-follower-text');
    }
    if (cursorFollower) {
        cursorFollower.classList.remove('active');
    }
    isFollowerActive = false;
    activeTriggerElement = null; // Stop tracking which element was hovered
    if (followerRafId) { // Stop any potential animation loop for the follower
        cancelAnimationFrame(followerRafId);
        followerRafId = null;
    }
}
// --- END OF MOVED FUNCTION ---


document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize Elements ---
    // Select elements needed early
    cursorFollower = document.getElementById('cursor-follower-text'); // Initialize follower element ref here
    const contentWrapper = document.querySelector('.content-wrapper');
    const header = document.querySelector('.header');
    const navCircle = document.querySelector('.nav-circle');

    // Elements related to eye tracking will be selected within setupEyeTracking_Simple

    // Start loader animation
    animateLoader();

    // --- Global Mouse Move Listener ---
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Update follower position directly if it's active
        if (isFollowerActive && cursorFollower && !isMobile && activeTriggerElement) {
             updateFollowerPosition_Basic();
        }
    }, { passive: true });


    // --- Simplified Follower Logic ---
    const hoverTriggers = document.querySelectorAll('.interactive-hover-trigger');
    const FOLLOWER_OFFSET = 18;

    hoverTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', (e) => {
            if (isMobile || !cursorFollower) return;

            const hoverText = trigger.getAttribute('data-hover-text');
            if (hoverText) {
                activeTriggerElement = trigger; // Track the new trigger
                cursorFollower.textContent = hoverText;
                cursorFollower.classList.add('active');
                isFollowerActive = true; // Set the flag

                // Start basic position update
                updateFollowerPosition_Basic(); // Set initial position immediately
            }
        });

        trigger.addEventListener('mouseleave', (e) => {
            if (isMobile || !cursorFollower) return;
            // Only hide if leaving the currently tracked element
            if (activeTriggerElement === trigger) {
                 hideFollower(); // Use the globally defined function
            }
        });

        // Hide on click
         trigger.addEventListener('click', () => {
            hideFollower(); // Use the globally defined function
         });
    });

    // Basic position update (called by mousemove when active)
    function updateFollowerPosition_Basic() {
        // Redundant checks, but safe
        if(isFollowerActive && cursorFollower && !isMobile) {
             cursorFollower.style.transform = `translate(${mouseX + FOLLOWER_OFFSET}px, ${mouseY + FOLLOWER_OFFSET}px)`;
        }
    }

    // hideFollower function is now defined globally above.


    // --- Simplified Eye Tracking ---
    // Call setup initially, it handles element finding and mobile checks
    setupEyeTracking_Simple();

    function setupEyeTracking_Simple() {
         // Re-query elements within setup each time it's called
        pupil = document.querySelector('.pupil');
        eye = document.querySelector('.eye');
        eyeContainer = document.querySelector('.eye-container'); // Outer boundary for events

        // Stop any previous animation loop before checking conditions/restarting
        if (eyeTrackingRafId) {
            cancelAnimationFrame(eyeTrackingRafId);
            eyeTrackingRafId = null;
        }
        isEyeTrackingActive = false; // Reset state

        // --- Pre-computation Checks ---
        if (!pupil || !eye || !eyeContainer) {
            // console.warn("Eye tracking setup skipped: Missing elements.", {pupil, eye, eyeContainer});
            if(isMobile && pupil) pupil.style.transform = `translate(-50%, -50%)`; // Reset pupil on mobile if it exists
            return; // Exit setup
        }
        if (isMobile) {
            // console.log("Eye tracking setup skipped: Mobile device.");
            pupil.style.transform = `translate(-50%, -50%)`; // Reset pupil position
             return; // Exit setup
        }
        // --- End Checks ---


        let currentX = 0, currentY = 0;
        const easing = 0.08; // Adjust for desired smoothness

        // Bounds variables - recalculated as needed
        let eyeRect, eyeCenterX, eyeCenterY, maxMoveX, maxMoveY;

        // Function to calculate/recalculate bounds relative to viewport
        function recalculateBounds() {
            // Ensure elements are still valid before getting bounds
            if (!eye || !pupil || !eyeContainer) return false;
            eyeRect = eye.getBoundingClientRect();
            // Check if eye has valid dimensions (might be 0 if hidden/not rendered)
            if (!eyeRect || eyeRect.width === 0 || eyeRect.height === 0) {
                // console.warn("RecalculateBounds failed: Invalid eyeRect", eyeRect);
                return false; // Cannot calculate center or max move
            }
            eyeCenterX = eyeRect.left + eyeRect.width / 2;
            eyeCenterY = eyeRect.top + eyeRect.height / 2;
            // Max move relative to the eye's calculated size
            // Allow pupil center to move within approx central 50% of the eye
            maxMoveX = eyeRect.width * 0.25;
            maxMoveY = eyeRect.height * 0.25;
            // console.log("Bounds recalculated:", {eyeCenterX, eyeCenterY, maxMoveX, maxMoveY});
            return true; // Bounds calculated successfully
        }

        // Animation loop for the pupil using requestAnimationFrame
        function updatePupil() {
            // Essential check: If mobile was detected after loop started, stop.
            if (isMobile) {
                if(eyeTrackingRafId) cancelAnimationFrame(eyeTrackingRafId); eyeTrackingRafId = null;
                if (pupil) pupil.style.transform = `translate(-50%, -50%)`;
                isEyeTrackingActive = false;
                return;
            }
            // Also check elements haven't disappeared (unlikely but safe)
            if (!pupil || !eye) {
                 if(eyeTrackingRafId) cancelAnimationFrame(eyeTrackingRafId); eyeTrackingRafId = null;
                 isEyeTrackingActive = false;
                 return;
            }

            let targetX = 0, targetY = 0;

            // Only calculate a non-zero target if tracking is active AND bounds are valid
            if (isEyeTrackingActive && eyeCenterX !== undefined && maxMoveX !== undefined) {
                const deltaX = mouseX - eyeCenterX;
                const deltaY = mouseY - eyeCenterY;
                const influence = 0.15; // How strongly mouse position pulls the target

                targetX = deltaX * influence;
                targetY = deltaY * influence;

                // Clamp target position to prevent pupil leaving the eye
                targetX = Math.max(-maxMoveX, Math.min(maxMoveX, targetX));
                targetY = Math.max(-maxMoveY, Math.min(maxMoveY, targetY));
            }
            // If isEyeTrackingActive is false, target remains (0,0), so pupil eases back to center

            // Apply easing (smooth interpolation)
            currentX += (targetX - currentX) * easing;
            currentY += (targetY - currentY) * easing;

            // Apply the calculated transform to the pupil
            // Uses translate(-50%, -50%) for initial centering, then adds eased movement
            pupil.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;

            // Request the next frame to continue the loop
            eyeTrackingRafId = requestAnimationFrame(updatePupil);
        }

        // --- Event listeners for the INTERACTION CONTAINER (.eye-container) ---
        if (eyeContainer) {
            eyeContainer.addEventListener('mouseenter', () => {
                if (isMobile) return; // Ignore on mobile
                // Crucial: Recalculate bounds when mouse enters the active area
                if (recalculateBounds()) {
                    isEyeTrackingActive = true; // Enable tracking
                    // Start the animation loop ONLY if it's not already running
                    if (!eyeTrackingRafId) {
                         // console.log("Starting eye tracking loop on mouseenter");
                         updatePupil();
                    }
                } else {
                    //  console.warn("Could not start eye tracking: bounds invalid on mouseenter.");
                     isEyeTrackingActive = false; // Ensure tracking remains off
                }
            });

            eyeContainer.addEventListener('mouseleave', () => {
                if (isMobile) return; // Ignore on mobile
                isEyeTrackingActive = false; // Disable tracking mouse position
                // The loop `updatePupil` will continue via RAF,
                // but since targetX/Y are now 0, it will ease back to center.
                // console.log("Stopping eye tracking target on mouseleave (will center)");
                // No need to restart loop here, it should keep running until centered naturally
            });
        } else {
             console.error("Eye container not found, cannot add mouse listeners.");
        }

        // Initial call to calculate bounds and start the loop
        // This ensures the pupil starts centered and the loop is running
        if (recalculateBounds()) {
            // console.log("Starting initial eye tracking loop (centering).");
            updatePupil();
        } else {
            // console.warn("Could not start initial eye tracking: failed to calculate initial bounds.");
            // Attempt may be made again on resize or mood set
        }
    }
    // --- End Simplified Eye Tracking ---


    // --- Mood Selector Setup ---
    const moodCircle = document.querySelector('.mood-circle');
    const moodOptions = document.querySelectorAll('.mood-option');
    const moodIndicator = document.querySelector('.mood-indicator');
    const setMoodBtn = document.getElementById('set-mood-btn');
    moodOptions.forEach((option) => { option.addEventListener('click', function() { /* ... mood option click logic ... */ moodOptions.forEach(opt => opt.classList.remove('active-option')); this.classList.add('active-option'); const optionRect = this.getBoundingClientRect(); const circleRect = moodCircle.getBoundingClientRect(); const circleCenterX = circleRect.left + circleRect.width / 2; const circleCenterY = circleRect.top + circleRect.height / 2; const label = this.querySelector('.mood-label'); const labelRect = label.getBoundingClientRect(); const optionCenterX = labelRect.left + labelRect.width / 2; const optionCenterY = labelRect.top + labelRect.height / 2; const angleRad = Math.atan2(optionCenterY - circleCenterY, optionCenterX - circleCenterX); let angleDeg = angleRad * (180 / Math.PI) + 90; /* Adjust angle calculation slightly if needed based on layout */ moodIndicator.style.transform = `translateX(-50%) rotate(${angleDeg}deg)`; const theme = this.classList.contains('dark-option') ? 'dark' : this.classList.contains('light-option') ? 'light' : this.classList.contains('spark-option') ? 'spark' : 'dark'; updateSidebarDots(theme); }); });
    const initialActiveMood = document.querySelector('.mood-option.active-option');
    if (initialActiveMood) initialActiveMood.click(); // Simulate click to set initial indicator/theme dot
    setMoodBtn.addEventListener('click', function() { /* ... set mood click logic ... */ const activeOption = document.querySelector('.mood-option.active-option'); if (activeOption) { const mood = activeOption.classList.contains('dark-option') ? 'dark' : activeOption.classList.contains('light-option') ? 'light' : activeOption.classList.contains('spark-option') ? 'spark' : 'dark'; document.body.className = `${mood}-theme`; if (moodSelector) { moodSelector.classList.remove('show'); moodSelector.style.transform = 'scale(0.9)'; } hideFollower(); /* <<< Use global function */ setTimeout(() => { if (moodSelector) moodSelector.style.display = 'none'; if (contentWrapper) contentWrapper.classList.add('show'); if (header) header.classList.add('show'); if (navCircle) navCircle.classList.add('show'); // Re-initialize eye tracking AFTER main content is shown and potentially resized/reflowed setTimeout(setupEyeTracking_Simple, 100); // Increased delay slightly for safety const initialNavItem = document.querySelector('.nav-item.nav-index'); if(initialNavItem) moveNavIndicator(initialNavItem); }, 500); } });

    // --- Navigation and Panel/View Setup ---
    const navItems = document.querySelectorAll('.nav-item'); const aboutPanel = document.querySelector('.about-panel'); const contactPanel = document.querySelector('.contact-panel'); const panels = [aboutPanel, contactPanel]; const workView = document.getElementById('work-view'); const indexNavItem = document.querySelector('.nav-item.nav-index'); const aboutNavItem = document.querySelector('.nav-item.nav-about'); const contactNavItem = document.querySelector('.nav-item.nav-contact'); const workNavItem = document.querySelector('.nav-item.nav-work'); const headerNameTrigger = document.getElementById('header-name-trigger'); const headerStatusTrigger = document.getElementById('header-status-trigger'); const workThumbnailTrigger = document.getElementById('work-thumbnail-trigger'); if (headerNameTrigger && aboutPanel && aboutNavItem) headerNameTrigger.addEventListener('click', () => { hideFollower(); togglePanel(aboutPanel, contactPanel); moveNavIndicator(aboutNavItem); }); if (headerStatusTrigger && contactPanel && contactNavItem) headerStatusTrigger.addEventListener('click', () => { hideFollower(); togglePanel(contactPanel, aboutPanel); moveNavIndicator(contactNavItem); }); if (workThumbnailTrigger && workView && workNavItem) workThumbnailTrigger.addEventListener('click', function() { hideFollower(); if (workView) workView.classList.add('show'); closeAllPanels(); moveNavIndicator(workNavItem); }); navItems.forEach((item) => { item.addEventListener('click', function() { hideFollower(); /* ... nav actions ... */ if (this.classList.contains('nav-about')) { togglePanel(aboutPanel, contactPanel); } else if (this.classList.contains('nav-contact')) { togglePanel(contactPanel, aboutPanel); } else if (this.classList.contains('nav-work')) { if (workView) workView.classList.add('show'); closeAllPanels(); } else if (this.classList.contains('nav-index')) { if (workView) workView.classList.remove('show'); closeAllPanels(); } moveNavIndicator(this); }); }); document.querySelectorAll('.close-panel').forEach((btn) => { btn.addEventListener('click', function() { hideFollower(); const panel = this.closest('.about-panel, .contact-panel'); if (panel) { panel.classList.remove('panel-active'); if (indexNavItem) moveNavIndicator(indexNavItem); } }); }); const workClose = document.querySelector('.work-close'); if (workClose && workView) workClose.addEventListener('click', function() { hideFollower(); workView.classList.remove('show'); if (indexNavItem) moveNavIndicator(indexNavItem); });

    // --- Sidebar Theme Dots ---
     document.querySelectorAll('.sidebar-dots .dot').forEach((dot) => { dot.addEventListener('click', function() {
        hideFollower(); // <<< Use global function
        const theme = this.getAttribute('data-theme');
        document.body.className = `${theme}-theme`;
        updateSidebarDots(theme);
        // Minor visual feedback for click
        this.style.transform = 'scale(1.3)';
        setTimeout(() => { this.style.transform = 'scale(1)'; }, 150);
        // Optional: Re-setup eye tracking in case theme change affects bounds slightly
        setTimeout(setupEyeTracking_Simple, 100); // Give theme styles time to apply
     }); });
     updateSidebarDots(document.body.classList[0]?.split('-')[0] || 'dark'); // Set initial dots

}); // End DOMContentLoaded


// --- Other Helper Functions (Keep these globally accessible) ---
function moveNavIndicator(targetItem) { /* ... function definition ... */ const navIndicator = document.querySelector('.nav-indicator'); const currentNavCircle = document.querySelector('.nav-circle'); if (!navIndicator || !currentNavCircle || !targetItem) return; const angle = parseFloat(targetItem.getAttribute('data-angle')) || 0; const circleRadius = currentNavCircle.offsetWidth / 2; const indicatorRadius = navIndicator.offsetWidth / 2; const offset = circleRadius > 0 ? circleRadius - indicatorRadius - 10 : 60; /* Adjust offset calculation slightly if needed */ navIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${-offset}px) rotate(${-angle}deg)`; }
function togglePanel(panelToShow, panelToHide) { /* ... function definition ... */ if (!panelToShow) return; if (panelToShow.classList.contains('panel-active')) { panelToShow.classList.remove('panel-active'); const indexNavItem = document.querySelector('.nav-item.nav-index'); if (indexNavItem) moveNavIndicator(indexNavItem); } else { if (panelToHide && panelToHide.classList.contains('panel-active')) { panelToHide.classList.remove('panel-active'); } panelToShow.classList.add('panel-active'); } }
function closeAllPanels() { /* ... function definition ... */ document.querySelectorAll('.about-panel, .contact-panel').forEach(panel => { if (panel && panel.classList.contains('panel-active')) { panel.classList.remove('panel-active'); } }); }
function updateSidebarDots(theme) { /* ... function definition ... */ const dots = document.querySelectorAll('.sidebar-dots .dot'); dots.forEach((dot) => { dot.classList.remove('dot-outline', 'dot-filled'); if (dot.getAttribute('data-theme') === theme) { dot.classList.add('dot-filled'); } else { dot.classList.add('dot-outline'); } }); }


// --- Window Resize Handler ---
window.addEventListener('resize', function() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 768;

    // Hide follower immediately on resize
    hideFollower();

    // Update Nav Indicator position after a short delay for layout settling
     const currentNavCircle = document.querySelector('.nav-circle');
     if (currentNavCircle && currentNavCircle.classList.contains('show')) {
       setTimeout(() => {
            const aboutPanelForResize = document.querySelector('.about-panel');
            const contactPanelForResize = document.querySelector('.contact-panel');
            const workViewForResize = document.getElementById('work-view');
            let activeItem = document.querySelector('.nav-item.nav-index'); // Default to index
            if (aboutPanelForResize?.classList.contains('panel-active')) {
                activeItem = document.querySelector('.nav-item.nav-about');
            } else if (contactPanelForResize?.classList.contains('panel-active')) {
                activeItem = document.querySelector('.nav-item.nav-contact');
            } else if (workViewForResize?.classList.contains('show')) {
                activeItem = document.querySelector('.nav-item.nav-work');
            }
            if (activeItem) moveNavIndicator(activeItem);
        }, 150); // Increased delay slightly
    }

    // Re-setup eye tracking for new size/layout
    // The setup function now handles stopping previous loops and mobile checks internally
    setupEyeTracking_Simple();

});
// --- END OF FILE app.js ---