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


document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize Elements ---
    pupil = document.querySelector('.pupil');
    eye = document.querySelector('.eye');
    eyeContainer = document.querySelector('.eye-container');
    cursorFollower = document.getElementById('cursor-follower-text');
    const contentWrapper = document.querySelector('.content-wrapper'); // Needed for mood set
    const header = document.querySelector('.header'); // Needed for mood set
    const navCircle = document.querySelector('.nav-circle'); // Needed for mood set

    // Log initial selections (for debugging)
    // console.log("Elements:", { pupil, eye, eyeContainer, cursorFollower });

    // Start loader animation
    animateLoader();

    // --- Global Mouse Move Listener ---
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });


    // --- Simplified Follower Logic ---
    const hoverTriggers = document.querySelectorAll('.interactive-hover-trigger');
    const FOLLOWER_OFFSET = 18;

    hoverTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', (e) => {
            if (isMobile || !cursorFollower) return;

            const hoverText = trigger.getAttribute('data-hover-text');
            if (hoverText) {
                // If another trigger was active, clear its state first
                if (activeTriggerElement && activeTriggerElement !== trigger) {
                    activeTriggerElement = null; // Stop tracking the old one
                    // Don't necessarily hide immediately, let mouseleave handle it unless moving very fast
                }

                activeTriggerElement = trigger; // Track the new trigger
                cursorFollower.textContent = hoverText;
                cursorFollower.classList.add('active');
                isFollowerActive = true; // Set the flag

                // Start simple position update (no smoothing yet)
                updateFollowerPosition_Basic(); // Call basic update
                // Stop any previous advanced loop if running
                if (followerRafId) cancelAnimationFrame(followerRafId);
                followerRafId = null;
            }
        });

        trigger.addEventListener('mouseleave', (e) => {
            if (isMobile || !cursorFollower) return;
            // Only hide if leaving the currently tracked element
            if (activeTriggerElement === trigger) {
                 cursorFollower.classList.remove('active');
                 isFollowerActive = false; // Clear the flag
                 activeTriggerElement = null; // Stop tracking
            }
        });

        // Hide on click (simplified)
         trigger.addEventListener('click', () => {
            hideFollower();
         });
    });

    // Basic position update (no animation loop yet)
    function updateFollowerPosition_Basic() {
        if(isFollowerActive && cursorFollower && !isMobile) {
             cursorFollower.style.transform = `translate(${mouseX + FOLLOWER_OFFSET}px, ${mouseY + FOLLOWER_OFFSET}px)`;
        }
    }
    // Add basic update to mousemove temporarily to test visibility
     document.addEventListener('mousemove', updateFollowerPosition_Basic, { passive: true });

    // Simple hide function
    function hideFollower() {
        if (cursorFollower) {
            cursorFollower.classList.remove('active');
        }
        isFollowerActive = false;
        activeTriggerElement = null;
        if (followerRafId) cancelAnimationFrame(followerRafId); // Stop advanced loop if running
        followerRafId = null;
    }
    // --- End Simplified Follower Logic ---


    // --- Simplified Eye Tracking ---
    setupEyeTracking_Simple(); // Call the simplified setup

    function setupEyeTracking_Simple() {
        if (!pupil || !eye || !eyeContainer || isMobile) {
            if(isMobile && pupil) pupil.style.transform = `translate(-50%, -50%)`;
            if(eyeTrackingRafId) cancelAnimationFrame(eyeTrackingRafId); eyeTrackingRafId = null;
            return;
        }

        let currentX = 0, currentY = 0;
        const easing = 0.08;

        // Store bounds once if possible, or recalculate if needed
        let eyeRect = eye.getBoundingClientRect();
        let pupilRect = pupil.getBoundingClientRect();
        let eyeCenterX = eyeRect.left + eyeRect.width / 2;
        let eyeCenterY = eyeRect.top + eyeRect.height / 2;
        // Correct maxMove calculation based on EYE size, not difference
        let maxMoveX = eyeRect.width * 0.3; // Pupil center can move 30% of eye width
        let maxMoveY = eyeRect.height * 0.3; // Pupil center can move 30% of eye height


        // Recalculate bounds if needed (e.g., after window resize or layout shift)
        function recalculateBounds() {
            if (!eye || !pupil) return false;
            eyeRect = eye.getBoundingClientRect();
            pupilRect = pupil.getBoundingClientRect();
            if (!eyeRect || !pupilRect || eyeRect.width === 0) return false;
            eyeCenterX = eyeRect.left + eyeRect.width / 2;
            eyeCenterY = eyeRect.top + eyeRect.height / 2;
            maxMoveX = eyeRect.width * 0.3;
            maxMoveY = eyeRect.height * 0.3;
            return true;
        }


        function updatePupil() {
            if (isMobile || !pupil || !eye) { // Check elements again
                if(eyeTrackingRafId) cancelAnimationFrame(eyeTrackingRafId); eyeTrackingRafId = null;
                if (pupil) pupil.style.transform = `translate(-50%, -50%)`;
                return;
            }

            let targetX = 0, targetY = 0;

            if (isEyeTrackingActive && eyeCenterX !== undefined) { // Only calculate target if tracking and bounds are valid
                const deltaX = mouseX - eyeCenterX;
                const deltaY = mouseY - eyeCenterY;
                const influence = 0.2; // Slightly more influence

                targetX = deltaX * influence;
                targetY = deltaY * influence;

                // Clamp based on calculated maxMove
                targetX = Math.max(-maxMoveX, Math.min(maxMoveX, targetX));
                targetY = Math.max(-maxMoveY, Math.min(maxMoveY, targetY));
            } // Else target remains 0,0 (center)

            // Apply easing
            currentX += (targetX - currentX) * easing;
            currentY += (targetY - currentY) * easing;

            // Apply transform
            pupil.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;

            // Continue animation
            eyeTrackingRafId = requestAnimationFrame(updatePupil);
        }

        // Event listeners for eye container
        if (eyeContainer) {
            eyeContainer.addEventListener('mouseenter', () => {
                if (isMobile) return;
                if (recalculateBounds()) { // Calculate bounds on enter
                    isEyeTrackingActive = true;
                    if (!eyeTrackingRafId) updatePupil(); // Start loop if stopped
                } else {
                     isEyeTrackingActive = false; // Don't track if bounds invalid
                }
            });
            eyeContainer.addEventListener('mouseleave', () => {
                if (isMobile) return;
                isEyeTrackingActive = false; // Stop tracking target
                // Loop continues until centered
                if (!eyeTrackingRafId) updatePupil(); // Ensure centering starts
            });
        }

        // Initial start of the loop (will center the pupil)
        if (!eyeTrackingRafId && !isMobile) {
             if(recalculateBounds()) { // Ensure bounds are calculated initially
                updatePupil();
             }
        }
    }
     // --- End Simplified Eye Tracking ---


    // --- Mood Selector Setup ---
    const moodCircle = document.querySelector('.mood-circle');
    const moodOptions = document.querySelectorAll('.mood-option');
    const moodIndicator = document.querySelector('.mood-indicator');
    const setMoodBtn = document.getElementById('set-mood-btn');
    moodOptions.forEach((option) => { option.addEventListener('click', function() { /* ... mood option click logic ... */ moodOptions.forEach(opt => opt.classList.remove('active-option')); this.classList.add('active-option'); const optionRect = this.getBoundingClientRect(); const circleRect = moodCircle.getBoundingClientRect(); const circleCenterX = circleRect.left + circleRect.width / 2; const circleCenterY = circleRect.top + circleRect.height / 2; const label = this.querySelector('.mood-label'); const labelRect = label.getBoundingClientRect(); const optionCenterX = labelRect.left + labelRect.width / 2; const optionCenterY = labelRect.top + labelRect.height / 2; const angleRad = Math.atan2(optionCenterY - circleCenterY, optionCenterX - circleCenterX); const angleDeg = angleRad * (180 / Math.PI) + 90; moodIndicator.style.transform = `translateX(-50%) rotate(${angleDeg}deg)`; const theme = this.classList.contains('dark-option') ? 'dark' : this.classList.contains('light-option') ? 'light' : this.classList.contains('spark-option') ? 'spark' : 'dark'; updateSidebarDots(theme); }); });
    const initialActiveMood = document.querySelector('.mood-option.active-option');
    if (initialActiveMood) initialActiveMood.click();
    setMoodBtn.addEventListener('click', function() { /* ... set mood click logic ... */ const activeOption = document.querySelector('.mood-option.active-option'); if (activeOption) { const mood = activeOption.classList.contains('dark-option') ? 'dark' : activeOption.classList.contains('light-option') ? 'light' : activeOption.classList.contains('spark-option') ? 'spark' : 'dark'; document.body.className = `${mood}-theme`; if (moodSelector) { moodSelector.classList.remove('show'); moodSelector.style.transform = 'scale(0.9)'; } hideFollower(); setTimeout(() => { if (moodSelector) moodSelector.style.display = 'none'; if (contentWrapper) contentWrapper.classList.add('show'); if (header) header.classList.add('show'); if (navCircle) navCircle.classList.add('show'); setupEyeTracking_Simple(); const initialNavItem = document.querySelector('.nav-item.nav-index'); if(initialNavItem) moveNavIndicator(initialNavItem); }, 500); } });

    // --- Navigation and Panel/View Setup ---
    const navItems = document.querySelectorAll('.nav-item'); const aboutPanel = document.querySelector('.about-panel'); const contactPanel = document.querySelector('.contact-panel'); const panels = [aboutPanel, contactPanel]; const workView = document.getElementById('work-view'); const indexNavItem = document.querySelector('.nav-item.nav-index'); const aboutNavItem = document.querySelector('.nav-item.nav-about'); const contactNavItem = document.querySelector('.nav-item.nav-contact'); const workNavItem = document.querySelector('.nav-item.nav-work'); const headerNameTrigger = document.getElementById('header-name-trigger'); const headerStatusTrigger = document.getElementById('header-status-trigger'); const workThumbnailTrigger = document.getElementById('work-thumbnail-trigger'); if (headerNameTrigger && aboutPanel && aboutNavItem) headerNameTrigger.addEventListener('click', () => { togglePanel(aboutPanel, contactPanel); moveNavIndicator(aboutNavItem); }); if (headerStatusTrigger && contactPanel && contactNavItem) headerStatusTrigger.addEventListener('click', () => { togglePanel(contactPanel, aboutPanel); moveNavIndicator(contactNavItem); }); if (workThumbnailTrigger && workView && workNavItem) workThumbnailTrigger.addEventListener('click', function() { if (workView) workView.classList.add('show'); closeAllPanels(); moveNavIndicator(workNavItem); }); navItems.forEach((item) => { item.addEventListener('click', function() { hideFollower(); /* ... nav actions ... */ if (this.classList.contains('nav-about')) { togglePanel(aboutPanel, contactPanel); } else if (this.classList.contains('nav-contact')) { togglePanel(contactPanel, aboutPanel); } else if (this.classList.contains('nav-work')) { if (workView) workView.classList.add('show'); closeAllPanels(); } else if (this.classList.contains('nav-index')) { if (workView) workView.classList.remove('show'); closeAllPanels(); } moveNavIndicator(this); }); }); document.querySelectorAll('.close-panel').forEach((btn) => { btn.addEventListener('click', function() { hideFollower(); const panel = this.closest('.about-panel, .contact-panel'); if (panel) { panel.classList.remove('panel-active'); if (indexNavItem) moveNavIndicator(indexNavItem); } }); }); const workClose = document.querySelector('.work-close'); if (workClose && workView) workClose.addEventListener('click', function() { hideFollower(); workView.classList.remove('show'); if (indexNavItem) moveNavIndicator(indexNavItem); });

    // --- Sidebar Theme Dots ---
     document.querySelectorAll('.sidebar-dots .dot').forEach((dot) => { dot.addEventListener('click', function() { hideFollower(); const theme = this.getAttribute('data-theme'); document.body.className = `${theme}-theme`; updateSidebarDots(theme); this.style.transform = 'scale(1.3)'; setTimeout(() => { this.style.transform = 'scale(1)'; }, 150); }); }); updateSidebarDots(document.body.classList[0]?.split('-')[0] || 'dark');

}); // End DOMContentLoaded


// --- Other Helper Functions (Keep these) ---
function moveNavIndicator(targetItem) { /* ... function definition ... */ const navIndicator = document.querySelector('.nav-indicator'); const currentNavCircle = document.querySelector('.nav-circle'); if (!navIndicator || !currentNavCircle || !targetItem) return; const angle = parseFloat(targetItem.getAttribute('data-angle')) || 0; const circleRadius = currentNavCircle.offsetWidth / 2; const indicatorRadius = navIndicator.offsetWidth / 2; const offset = circleRadius > 0 ? circleRadius - indicatorRadius - 10 : 60; navIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${-offset}px) rotate(${-angle}deg)`; }
function togglePanel(panelToShow, panelToHide) { /* ... function definition ... */ if (!panelToShow) return; if (panelToShow.classList.contains('panel-active')) { panelToShow.classList.remove('panel-active'); const indexNavItem = document.querySelector('.nav-item.nav-index'); if (indexNavItem) moveNavIndicator(indexNavItem); } else { if (panelToHide && panelToHide.classList.contains('panel-active')) { panelToHide.classList.remove('panel-active'); } panelToShow.classList.add('panel-active'); } }
function closeAllPanels() { /* ... function definition ... */ document.querySelectorAll('.about-panel, .contact-panel').forEach(panel => { if (panel && panel.classList.contains('panel-active')) { panel.classList.remove('panel-active'); } }); }
function updateSidebarDots(theme) { /* ... function definition ... */ const dots = document.querySelectorAll('.sidebar-dots .dot'); dots.forEach((dot) => { dot.classList.remove('dot-outline', 'dot-filled'); if (dot.getAttribute('data-theme') === theme) { dot.classList.add('dot-filled'); } else { dot.classList.add('dot-outline'); } }); }


// --- Window Resize Handler ---
window.addEventListener('resize', function() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 768;

    // Hide follower
    hideFollower();

    // Update Nav Indicator position
     const currentNavCircle = document.querySelector('.nav-circle');
     if (currentNavCircle && currentNavCircle.classList.contains('show')) {
       setTimeout(() => { /* ... update nav indicator position ... */
            const aboutPanelForResize = document.querySelector('.about-panel'); const contactPanelForResize = document.querySelector('.contact-panel'); const workViewForResize = document.getElementById('work-view'); let activeItem = document.querySelector('.nav-item.nav-index'); if (aboutPanelForResize?.classList.contains('panel-active')) { activeItem = document.querySelector('.nav-item.nav-about'); } else if (contactPanelForResize?.classList.contains('panel-active')) { activeItem = document.querySelector('.nav-item.nav-contact'); } else if (workViewForResize?.classList.contains('show')) { activeItem = document.querySelector('.nav-item.nav-work'); } if (activeItem) moveNavIndicator(activeItem);
        }, 100);
    }

    // Re-select elements and re-setup eye tracking
    pupil = document.querySelector('.pupil');
    eye = document.querySelector('.eye');
    eyeContainer = document.querySelector('.eye-container');
    setupEyeTracking_Simple(); // Call simplified setup

});
// --- END OF FILE app.js ---