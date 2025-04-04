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
setTimeout(() => {
    if (loader) {
        loader.classList.add('hide');
        // Wait for loader transition to finish before potentially showing mood selector
        setTimeout(() => {
            if (moodSelector) {
                 moodSelector.classList.add('show');
            }
            if (loader) {
                loader.style.display = 'none'; // Fully remove loader
            }
        }, 500); // Match CSS transition duration
    }
}, 2000); // Initial delay

// Preloader animation function definition
function animateLoader() { const loaderTextElement = document.getElementById('loader-text'); const currentLoaderCheck = document.getElementById('loader'); if (!loaderTextElement || !currentLoaderCheck) return; const originalTextContent = loaderTextElement.textContent.replace(/\.*$/, ''); let dotCount = 0; let intervalId = null; function updateDots() { const currentLoader = document.getElementById('loader'); if (!currentLoader || currentLoader.style.display === 'none' || currentLoader.classList.contains('hide')) { if (intervalId) clearInterval(intervalId); intervalId = null; return; } dotCount = (dotCount + 1) % 4; if (loaderTextElement) loaderTextElement.textContent = originalTextContent + '.'.repeat(dotCount); } if (intervalId) clearInterval(intervalId); intervalId = setInterval(updateDots, 400); }

// --- MOVED HIDE FOLLOWER FUNCTION TO GLOBAL SCOPE ---
function hideFollower() {
    if (!cursorFollower) { // Ensure it's selected
        cursorFollower = document.getElementById('cursor-follower-text');
    }
    if (cursorFollower) {
        cursorFollower.classList.remove('active');
    }
    isFollowerActive = false;
    activeTriggerElement = null;
    if (followerRafId) {
        cancelAnimationFrame(followerRafId);
        followerRafId = null;
    }
}
// --- END OF MOVED FUNCTION ---


document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize Elements ---
    cursorFollower = document.getElementById('cursor-follower-text');
    const contentWrapper = document.querySelector('.content-wrapper');
    const header = document.querySelector('.header');
    const navCircle = document.querySelector('.nav-circle');
    // Eye elements selected later in setupEyeTracking_Simple

    // Start loader animation
    animateLoader();

    // --- Global Mouse Move Listener ---
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (isFollowerActive && cursorFollower && !isMobile && activeTriggerElement) {
             updateFollowerPosition_Basic();
        }
    }, { passive: true });


    // --- Simplified Follower Logic ---
    const hoverTriggers = document.querySelectorAll('.interactive-hover-trigger');
    const FOLLOWER_OFFSET = 18;

    hoverTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', (e) => {
            // Mobile check FIRST
            if (isMobile || !cursorFollower) return;

            const hoverText = trigger.getAttribute('data-hover-text');
            if (hoverText) {
                activeTriggerElement = trigger;
                cursorFollower.textContent = hoverText;
                cursorFollower.classList.add('active');
                isFollowerActive = true;
                updateFollowerPosition_Basic();
            }
        });

        trigger.addEventListener('mouseleave', (e) => {
            // Mobile check FIRST
            if (isMobile || !cursorFollower) return;

            if (activeTriggerElement === trigger) {
                 hideFollower();
            }
        });

        trigger.addEventListener('click', () => {
            // No mobile check needed here, hideFollower is safe
            hideFollower();
         });
    });

    function updateFollowerPosition_Basic() {
        // Redundant mobile check, but safe
        if(isFollowerActive && cursorFollower && !isMobile) {
             cursorFollower.style.transform = `translate(${mouseX + FOLLOWER_OFFSET}px, ${mouseY + FOLLOWER_OFFSET}px)`;
        }
    }

    // --- Simplified Eye Tracking ---
    // Initial call is slightly delayed to allow DOM rendering
    // console.log("Scheduling initial eye tracking setup."); // DEBUG
    // setTimeout(setupEyeTracking_Simple, 100); // Delay setup slightly

    // Let's try calling it directly first, but rely on the internal checks
     setupEyeTracking_Simple(); // Call it once DOM is loaded

    function setupEyeTracking_Simple() {
         // console.log("Attempting setupEyeTracking_Simple..."); // DEBUG
         // ** Crucial: Select elements *inside* setup **
         pupil = document.querySelector('.pupil');
         eye = document.querySelector('.eye');
         eyeContainer = document.querySelector('.eye-container');

         // ** Crucial: Stop any previous loop FIRST **
         if (eyeTrackingRafId) {
             // console.log("Cancelling previous eye tracking loop."); // DEBUG
             cancelAnimationFrame(eyeTrackingRafId);
             eyeTrackingRafId = null;
         }
         isEyeTrackingActive = false; // Reset state

         // --- Pre-computation Checks ---
         // ** 1. Check if elements exist **
         if (!pupil || !eye || !eyeContainer) {
            // console.warn("Eye tracking setup skipped: Missing required elements.", {pupilFound: !!pupil, eyeFound: !!eye, containerFound: !!eyeContainer}); // DEBUG
            return; // Exit setup if core elements aren't found
         }
         // ** 2. Check if on mobile AFTER confirming elements exist **
         if (isMobile) {
            // console.log("Eye tracking setup skipped: Mobile device detected."); // DEBUG
            pupil.style.transform = `translate(-50%, -50%)`; // Reset pupil position on mobile
             return; // Exit setup
         }
        // --- End Checks ---
        // console.log("Eye tracking prerequisites met. Proceeding with setup."); // DEBUG

        let currentX = 0, currentY = 0;
        const easing = 0.08;

        let eyeRect, eyeCenterX, eyeCenterY, maxMoveX, maxMoveY;

        function recalculateBounds() {
            // Elements checked at start of setupEyeTracking_Simple
            eyeRect = eye.getBoundingClientRect();
            if (!eyeRect || eyeRect.width === 0 || eyeRect.height === 0) {
                // console.warn("RecalculateBounds failed: Invalid eyeRect dimensions.", eyeRect); // DEBUG
                // Invalidate bounds to prevent calculations based on bad data
                eyeCenterX = undefined;
                eyeCenterY = undefined;
                maxMoveX = undefined;
                maxMoveY = undefined;
                return false;
            }
            eyeCenterX = eyeRect.left + eyeRect.width / 2;
            eyeCenterY = eyeRect.top + eyeRect.height / 2;
            maxMoveX = eyeRect.width * 0.25;
            maxMoveY = eyeRect.height * 0.25;
            // console.log("Bounds recalculated:", {eyeCenterX, eyeCenterY, maxMoveX, maxMoveY}); // DEBUG
            return true;
        }

        function updatePupil() {
            // Mobile check just in case state changed during execution
            if (isMobile || !pupil || !eye) { // Also re-check elements
                if(eyeTrackingRafId) cancelAnimationFrame(eyeTrackingRafId); eyeTrackingRafId = null;
                if (pupil) pupil.style.transform = `translate(-50%, -50%)`;
                isEyeTrackingActive = false;
                return;
            }

            let targetX = 0, targetY = 0;

            // Check if bounds are valid before calculating target
            if (isEyeTrackingActive && eyeCenterX !== undefined && maxMoveX !== undefined) {
                const deltaX = mouseX - eyeCenterX;
                const deltaY = mouseY - eyeCenterY;
                const influence = 0.15;

                targetX = deltaX * influence;
                targetY = deltaY * influence;

                targetX = Math.max(-maxMoveX, Math.min(maxMoveX, targetX));
                targetY = Math.max(-maxMoveY, Math.min(maxMoveY, targetY));
            }

            currentX += (targetX - currentX) * easing;
            currentY += (targetY - currentY) * easing;

            // Avoid setting transform if calculations resulted in NaN (unlikely now, but safe)
            if (!isNaN(currentX) && !isNaN(currentY)) {
                 pupil.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;
            }

            eyeTrackingRafId = requestAnimationFrame(updatePupil);
        }

        // --- Event listeners for INTERACTION CONTAINER (.eye-container) ---
        // console.log("Adding eye container listeners."); // DEBUG
        eyeContainer.addEventListener('mouseenter', () => {
            if (isMobile) return;
            if (recalculateBounds()) { // Recalculate bounds on enter
                isEyeTrackingActive = true;
                if (!eyeTrackingRafId) { // Start loop ONLY if it stopped
                    // console.log("Starting eye tracking loop on mouseenter."); // DEBUG
                    updatePupil();
                }
            } else {
                // console.warn("Could not start eye tracking: bounds invalid on mouseenter."); // DEBUG
                isEyeTrackingActive = false;
            }
        });

        eyeContainer.addEventListener('mouseleave', () => {
            if (isMobile) return;
            isEyeTrackingActive = false; // Stop aiming for mouse
            // console.log("Stopping eye tracking target on mouseleave (will center)."); // DEBUG
            // Loop continues via RAF to center the pupil
        });

        // Initial call to calculate bounds and start the loop
        if (recalculateBounds()) {
            // console.log("Starting initial eye tracking loop (centering)."); // DEBUG
            updatePupil();
        } else {
            // console.warn("Could not start initial eye tracking: failed to calculate initial bounds."); // DEBUG
        }
    }
    // --- End Simplified Eye Tracking ---


    // --- Mood Selector Setup ---
    const moodCircle = document.querySelector('.mood-circle');
    const moodOptions = document.querySelectorAll('.mood-option');
    const moodIndicator = document.querySelector('.mood-indicator');
    const setMoodBtn = document.getElementById('set-mood-btn');
    // Add checks for mood selector elements
    if (moodCircle && moodOptions.length > 0 && moodIndicator && setMoodBtn) {
        moodOptions.forEach((option) => { option.addEventListener('click', function() { /* ... mood option click logic ... */ moodOptions.forEach(opt => opt.classList.remove('active-option')); this.classList.add('active-option'); const optionRect = this.getBoundingClientRect(); const circleRect = moodCircle.getBoundingClientRect(); const circleCenterX = circleRect.left + circleRect.width / 2; const circleCenterY = circleRect.top + circleRect.height / 2; const label = this.querySelector('.mood-label'); const labelRect = label?.getBoundingClientRect(); /* Check label exists */ if (!label || !labelRect) return; const optionCenterX = labelRect.left + labelRect.width / 2; const optionCenterY = labelRect.top + labelRect.height / 2; const angleRad = Math.atan2(optionCenterY - circleCenterY, optionCenterX - circleCenterX); let angleDeg = angleRad * (180 / Math.PI) + 90; moodIndicator.style.transform = `translateX(-50%) rotate(${angleDeg}deg)`; const theme = this.classList.contains('dark-option') ? 'dark' : this.classList.contains('light-option') ? 'light' : this.classList.contains('spark-option') ? 'spark' : 'dark'; updateSidebarDots(theme); }); });
        const initialActiveMood = document.querySelector('.mood-option.active-option');
        if (initialActiveMood) initialActiveMood.click(); // Set initial state
        setMoodBtn.addEventListener('click', function() { /* ... set mood click logic ... */ const activeOption = document.querySelector('.mood-option.active-option'); if (activeOption) { const mood = activeOption.classList.contains('dark-option') ? 'dark' : activeOption.classList.contains('light-option') ? 'light' : activeOption.classList.contains('spark-option') ? 'spark' : 'dark'; document.body.className = `${mood}-theme`; if (moodSelector) { moodSelector.classList.remove('show'); moodSelector.style.transform = 'scale(0.9)'; } hideFollower(); setTimeout(() => { if (moodSelector) moodSelector.style.display = 'none'; if (contentWrapper) contentWrapper.classList.add('show'); if (header) header.classList.add('show'); if (navCircle) navCircle.classList.add('show'); // Re-initialize eye tracking AFTER main content is shown and theme applied setTimeout(setupEyeTracking_Simple, 150); // Slightly longer delay const initialNavItem = document.querySelector('.nav-item.nav-index'); if(initialNavItem) moveNavIndicator(initialNavItem); }, 500); } });
    } else {
        // console.warn("Mood selector elements not fully found."); // DEBUG
        // Decide how to proceed if mood selector is broken - maybe show main content directly?
        if (contentWrapper) contentWrapper.classList.add('show');
        if (header) header.classList.add('show');
        if (navCircle) navCircle.classList.add('show');
        setTimeout(setupEyeTracking_Simple, 150); // Still try eye tracking setup
    }


    // --- Navigation and Panel/View Setup ---
    // Assuming these elements are less critical for initial load, keep checks simpler
    const navItems = document.querySelectorAll('.nav-item'); const aboutPanel = document.querySelector('.about-panel'); const contactPanel = document.querySelector('.contact-panel'); const workView = document.getElementById('work-view'); const indexNavItem = document.querySelector('.nav-item.nav-index'); const aboutNavItem = document.querySelector('.nav-item.nav-about'); const contactNavItem = document.querySelector('.nav-item.nav-contact'); const workNavItem = document.querySelector('.nav-item.nav-work'); const headerNameTrigger = document.getElementById('header-name-trigger'); const headerStatusTrigger = document.getElementById('header-status-trigger'); const workThumbnailTrigger = document.getElementById('work-thumbnail-trigger');
    if (headerNameTrigger && aboutPanel && aboutNavItem) headerNameTrigger.addEventListener('click', () => { hideFollower(); togglePanel(aboutPanel, contactPanel); moveNavIndicator(aboutNavItem); });
    if (headerStatusTrigger && contactPanel && contactNavItem) headerStatusTrigger.addEventListener('click', () => { hideFollower(); togglePanel(contactPanel, aboutPanel); moveNavIndicator(contactNavItem); });
    if (workThumbnailTrigger && workView && workNavItem) workThumbnailTrigger.addEventListener('click', function() { hideFollower(); if (workView) workView.classList.add('show'); closeAllPanels(); moveNavIndicator(workNavItem); });
    if (navItems.length > 0) { navItems.forEach((item) => { item.addEventListener('click', function() { hideFollower(); if (this.classList.contains('nav-about')) { togglePanel(aboutPanel, contactPanel); } else if (this.classList.contains('nav-contact')) { togglePanel(contactPanel, aboutPanel); } else if (this.classList.contains('nav-work')) { if (workView) workView.classList.add('show'); closeAllPanels(); } else if (this.classList.contains('nav-index')) { if (workView) workView.classList.remove('show'); closeAllPanels(); } moveNavIndicator(this); }); }); }
    document.querySelectorAll('.close-panel').forEach((btn) => { btn.addEventListener('click', function() { hideFollower(); const panel = this.closest('.about-panel, .contact-panel'); if (panel) { panel.classList.remove('panel-active'); if (indexNavItem) moveNavIndicator(indexNavItem); } }); });
    const workClose = document.querySelector('.work-close'); if (workClose && workView) { workClose.addEventListener('click', function() { hideFollower(); workView.classList.remove('show'); if (indexNavItem) moveNavIndicator(indexNavItem); }); }

    // --- Sidebar Theme Dots ---
    const sidebarDots = document.querySelectorAll('.sidebar-dots .dot');
    if (sidebarDots.length > 0) {
         sidebarDots.forEach((dot) => { dot.addEventListener('click', function() {
            hideFollower();
            const theme = this.getAttribute('data-theme');
            if (theme) { // Check if theme attribute exists
                document.body.className = `${theme}-theme`;
                updateSidebarDots(theme);
                this.style.transform = 'scale(1.3)';
                setTimeout(() => { this.style.transform = 'scale(1)'; }, 150);
                // Re-setup eye tracking after theme change
                setTimeout(setupEyeTracking_Simple, 100);
            }
         }); });
         updateSidebarDots(document.body.classList[0]?.split('-')[0] || 'dark'); // Set initial dots
     }

}); // End DOMContentLoaded


// --- Other Helper Functions (Keep these globally accessible) ---
function moveNavIndicator(targetItem) { const navIndicator = document.querySelector('.nav-indicator'); const currentNavCircle = document.querySelector('.nav-circle'); if (!navIndicator || !currentNavCircle || !targetItem) return; const angle = parseFloat(targetItem.getAttribute('data-angle')) || 0; const circleRadius = currentNavCircle.offsetWidth / 2; const indicatorRadius = navIndicator.offsetWidth / 2; const offset = circleRadius > 0 ? circleRadius - indicatorRadius - 10 : 60; navIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${-offset}px) rotate(${-angle}deg)`; }
function togglePanel(panelToShow, panelToHide) { if (!panelToShow) return; if (panelToShow.classList.contains('panel-active')) { panelToShow.classList.remove('panel-active'); const indexNavItem = document.querySelector('.nav-item.nav-index'); if (indexNavItem) moveNavIndicator(indexNavItem); } else { if (panelToHide && panelToHide.classList.contains('panel-active')) { panelToHide.classList.remove('panel-active'); } panelToShow.classList.add('panel-active'); } }
function closeAllPanels() { document.querySelectorAll('.about-panel, .contact-panel').forEach(panel => { if (panel && panel.classList.contains('panel-active')) { panel.classList.remove('panel-active'); } }); }
function updateSidebarDots(theme) { const dots = document.querySelectorAll('.sidebar-dots .dot'); dots.forEach((dot) => { dot.classList.remove('dot-outline', 'dot-filled'); if (dot.getAttribute('data-theme') === theme) { dot.classList.add('dot-filled'); } else { dot.classList.add('dot-outline'); } }); }


// --- Window Resize Handler ---
window.addEventListener('resize', function() {
    // console.log("Resize event triggered."); // DEBUG
    // Recalculate isMobile on every resize
    isMobile = window.innerWidth < 768;
    // console.log("isMobile after resize:", isMobile); // DEBUG

    hideFollower(); // Hide follower immediately

    // Update Nav Indicator position after layout settles
     const currentNavCircle = document.querySelector('.nav-circle');
     if (currentNavCircle && currentNavCircle.classList.contains('show')) {
       setTimeout(() => {
            const aboutPanelForResize = document.querySelector('.about-panel');
            const contactPanelForResize = document.querySelector('.contact-panel');
            const workViewForResize = document.getElementById('work-view');
            let activeItem = document.querySelector('.nav-item.nav-index'); // Default
            if (aboutPanelForResize?.classList.contains('panel-active')) { activeItem = document.querySelector('.nav-item.nav-about'); }
            else if (contactPanelForResize?.classList.contains('panel-active')) { activeItem = document.querySelector('.nav-item.nav-contact'); }
            else if (workViewForResize?.classList.contains('show')) { activeItem = document.querySelector('.nav-item.nav-work'); }
            if (activeItem) moveNavIndicator(activeItem);
        }, 150);
    }

    // Re-setup eye tracking for the new size/orientation
    // The setup function handles mobile checks and restarting loops internally
    // console.log("Calling setupEyeTracking_Simple from resize handler."); // DEBUG
    setupEyeTracking_Simple();

});
// --- END OF FILE app.js ---