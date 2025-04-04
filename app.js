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
function animateLoader() {
    const loaderTextElement = document.getElementById('loader-text');
    const currentLoaderCheck = document.getElementById('loader');

    if (!loaderTextElement || !currentLoaderCheck) {
        return;
    }

    const originalTextContent = loaderTextElement.textContent.replace(/\.*$/, '');
    let dotCount = 0;
    let intervalId = null;

    function updateDots() {
        const currentLoader = document.getElementById('loader');
        // Stop if loader is gone or hidden
        if (!currentLoader || currentLoader.style.display === 'none' || currentLoader.classList.contains('hide')) {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            return;
        }
        dotCount = (dotCount + 1) % 4;
        if (loaderTextElement) {
            loaderTextElement.textContent = originalTextContent + '.'.repeat(dotCount);
        }
    }

    // Clear any existing interval before starting a new one
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(updateDots, 400);
}

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


document.addEventListener('DOMContentLoaded', function () {
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
        // Update follower position directly if active (no separate RAF needed for this simple version)
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
                updateFollowerPosition_Basic(); // Position immediately on enter
            }
        });

        trigger.addEventListener('mouseleave', (e) => {
            // Mobile check FIRST
            if (isMobile || !cursorFollower) return;

            // Only hide if the mouse leaves the *currently active* trigger
            if (activeTriggerElement === trigger) {
                hideFollower();
            }
        });

        trigger.addEventListener('click', () => {
            // Hide follower on click regardless of mobile status
            hideFollower();
        });
    });

    // Function to update follower position (called by mousemove listener)
    function updateFollowerPosition_Basic() {
        // Safety check (redundant due to mousemove condition, but safe)
        if (isFollowerActive && cursorFollower && !isMobile) {
            cursorFollower.style.transform = `translate(${mouseX + FOLLOWER_OFFSET}px, ${mouseY + FOLLOWER_OFFSET}px)`;
        }
    }

    // --- Simplified Eye Tracking ---
    // Call setup function once DOM is loaded. It handles internal checks.
    setupEyeTracking_Simple();

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

        let currentX = 0;
        let currentY = 0;
        const easing = 0.08;

        let eyeRect, eyeCenterX, eyeCenterY, maxMoveX, maxMoveY;

        function recalculateBounds() {
            // Elements checked at start of setupEyeTracking_Simple
            eyeRect = eye.getBoundingClientRect();
            // Check for valid dimensions
            if (!eyeRect || eyeRect.width === 0 || eyeRect.height === 0) {
                // console.warn("RecalculateBounds failed: Invalid eyeRect dimensions.", eyeRect); // DEBUG
                // Invalidate bounds to prevent calculations based on bad data
                eyeCenterX = undefined;
                eyeCenterY = undefined;
                maxMoveX = undefined;
                maxMoveY = undefined;
                return false; // Indicate failure
            }
            eyeCenterX = eyeRect.left + eyeRect.width / 2;
            eyeCenterY = eyeRect.top + eyeRect.height / 2;
            // Define movement limits relative to eye size
            maxMoveX = eyeRect.width * 0.25;
            maxMoveY = eyeRect.height * 0.25;
            // console.log("Bounds recalculated:", {eyeCenterX, eyeCenterY, maxMoveX, maxMoveY}); // DEBUG
            return true; // Indicate success
        }

        function updatePupil() {
            // Re-check conditions that might stop the animation
            if (isMobile || !pupil || !eye) { // Check mobile and element existence
                if (eyeTrackingRafId) {
                    cancelAnimationFrame(eyeTrackingRafId);
                    eyeTrackingRafId = null;
                }
                if (pupil) {
                    pupil.style.transform = `translate(-50%, -50%)`; // Reset position
                }
                isEyeTrackingActive = false; // Ensure state is correct
                return; // Stop the loop
            }

            let targetX = 0;
            let targetY = 0;

            // Calculate target position only if active and bounds are valid
            if (isEyeTrackingActive && eyeCenterX !== undefined && maxMoveX !== undefined) {
                const deltaX = mouseX - eyeCenterX;
                const deltaY = mouseY - eyeCenterY;
                const influence = 0.15; // How much the mouse influences the pupil

                targetX = deltaX * influence;
                targetY = deltaY * influence;

                // Clamp movement within the calculated limits
                targetX = Math.max(-maxMoveX, Math.min(maxMoveX, targetX));
                targetY = Math.max(-maxMoveY, Math.min(maxMoveY, targetY));
            }
            // If not active, targetX/Y remain 0, causing the pupil to ease back to center

            // Apply easing
            currentX += (targetX - currentX) * easing;
            currentY += (targetY - currentY) * easing;

            // Apply the transform if values are valid numbers
            if (!isNaN(currentX) && !isNaN(currentY)) {
                pupil.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;
            }

            // Continue the animation loop
            eyeTrackingRafId = requestAnimationFrame(updatePupil);
        }

        // --- Event listeners for INTERACTION CONTAINER (.eye-container) ---
        // console.log("Adding eye container listeners."); // DEBUG
        eyeContainer.addEventListener('mouseenter', () => {
            if (isMobile) return; // Ignore on mobile
            if (recalculateBounds()) { // Recalculate bounds on enter in case layout changed
                isEyeTrackingActive = true; // Start tracking the mouse
                // Start the animation loop ONLY if it's not already running
                if (!eyeTrackingRafId) {
                    // console.log("Starting eye tracking loop on mouseenter."); // DEBUG
                    updatePupil();
                }
            } else {
                // console.warn("Could not start eye tracking: bounds invalid on mouseenter."); // DEBUG
                isEyeTrackingActive = false; // Ensure tracking is off if bounds are bad
            }
        });

        eyeContainer.addEventListener('mouseleave', () => {
            if (isMobile) return; // Ignore on mobile
            isEyeTrackingActive = false; // Stop aiming for the mouse; pupil will ease to center
            // console.log("Stopping eye tracking target on mouseleave (will center)."); // DEBUG
            // The updatePupil loop continues via RAF until it stops itself or is cancelled
        });

        // Initial call to calculate bounds and start the loop (for centering animation)
        if (recalculateBounds()) {
            // console.log("Starting initial eye tracking loop (centering)."); // DEBUG
            updatePupil(); // Start the loop
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

    // Add checks for mood selector elements before adding listeners
    if (moodCircle && moodOptions.length > 0 && moodIndicator && setMoodBtn) {

        moodOptions.forEach((option) => {
            option.addEventListener('click', function () {
                // Remove active class from all options
                moodOptions.forEach(opt => opt.classList.remove('active-option'));
                // Add active class to the clicked option
                this.classList.add('active-option');

                // --- Calculate angle and NEW offset for the indicator ---
                const optionRect = this.getBoundingClientRect();
                const circleRect = moodCircle.getBoundingClientRect(); // Get mood circle bounds

                // Ensure circleRect is valid before proceeding
                if (!circleRect || circleRect.width === 0) return;

                const circleCenterX = circleRect.left + circleRect.width / 2;
                const circleCenterY = circleRect.top + circleRect.height / 2;

                const label = this.querySelector('.mood-label');
                const labelRect = label?.getBoundingClientRect(); // Use optional chaining

                // Ensure label exists before calculating position
                if (!label || !labelRect) return;

                const optionCenterX = labelRect.left + labelRect.width / 2;
                const optionCenterY = labelRect.top + labelRect.height / 2;

                const angleRad = Math.atan2(optionCenterY - circleCenterY, optionCenterX - circleCenterX);
                let angleDeg = angleRad * (180 / Math.PI) + 90; // Keep the +90 offset if it aligns correctly

                // Calculate the offset like the nav indicator
                const moodCircleRadius = circleRect.width / 2;
                // Approximate indicator "radius" (half its height roughly) + desired gap
                const indicatorHeight = 10; // From CSS border-bottom (arrow height)
                const moodIndicatorGap = 5; // Adjust gap as needed (space between circle edge and arrow base)
                const moodIndicatorOffset = moodCircleRadius > 0 ? moodCircleRadius - indicatorHeight - moodIndicatorGap : 40; // Dynamic offset with fallback

                // --- Apply NEW rotation and translation ---
                // Mimic nav indicator: center, rotate, translate outwards
                moodIndicator.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg) translateY(${-moodIndicatorOffset}px)`;
                // Note: We don't need the final rotate(-angle) like the nav dot because the arrow shape looks fine when rotated.


                // Update sidebar dots preview based on selection
                const theme = this.classList.contains('dark-option') ? 'dark'
                            : this.classList.contains('light-option') ? 'light'
                            : this.classList.contains('spark-option') ? 'spark'
                            : 'dark'; // Default theme
                updateSidebarDots(theme);
            });
        });

        // Trigger click on the initially active mood option to set the indicator
        const initialActiveMood = document.querySelector('.mood-option.active-option');
        if (initialActiveMood) {
            initialActiveMood.click();
        }

        // Logic for the "Set Mood" button
        setMoodBtn.addEventListener('click', function () {
            const activeOption = document.querySelector('.mood-option.active-option');
            if (activeOption) {
                // Determine the selected theme
                const mood = activeOption.classList.contains('dark-option') ? 'dark'
                           : activeOption.classList.contains('light-option') ? 'light'
                           : activeOption.classList.contains('spark-option') ? 'spark'
                           : 'dark'; // Default theme

                // Apply the theme class to the body
                document.body.className = `${mood}-theme`;

                // Hide the mood selector
                if (moodSelector) {
                    moodSelector.classList.remove('show');
                    moodSelector.style.transform = 'scale(0.9)'; // Optional shrink effect
                }
                hideFollower(); // Ensure follower is hidden

                // After transition, hide mood selector completely and show main content
                setTimeout(() => {
                    if (moodSelector) {
                        moodSelector.style.display = 'none';
                    }
                    // Show main content elements
                    if (contentWrapper) contentWrapper.classList.add('show');
                    if (header) header.classList.add('show');
                    if (navCircle) navCircle.classList.add('show');

                    // Re-initialize eye tracking AFTER main content is visible and theme applied
                    setTimeout(setupEyeTracking_Simple, 150); // Slightly longer delay

                    // Set initial nav indicator position (e.g., to 'index')
                     const initialNavItem = document.querySelector('.nav-item.nav-index');
                     if(initialNavItem) {
                        moveNavIndicator(initialNavItem);
                     }
                }, 500); // Match CSS transition duration
            }
        });

    } else {
        // Fallback if mood selector elements aren't found
        // console.warn("Mood selector elements not fully found. Showing content directly."); // DEBUG
        // Optionally show main content directly if mood selector is broken
        if (contentWrapper) {
            contentWrapper.classList.add('show');
        }
        if (header) {
            header.classList.add('show');
        }
        if (navCircle) {
            navCircle.classList.add('show');
        }
        // Still attempt to set up eye tracking
        setTimeout(setupEyeTracking_Simple, 150);
    }


    // --- Navigation and Panel/View Setup ---
    // Query elements needed for navigation and panels
    const navItems = document.querySelectorAll('.nav-item');
    const aboutPanel = document.querySelector('.about-panel');
    const contactPanel = document.querySelector('.contact-panel');
    const workView = document.getElementById('work-view');
    const indexNavItem = document.querySelector('.nav-item.nav-index');
    const aboutNavItem = document.querySelector('.nav-item.nav-about');
    const contactNavItem = document.querySelector('.nav-item.nav-contact');
    const workNavItem = document.querySelector('.nav-item.nav-work');
    const headerNameTrigger = document.getElementById('header-name-trigger');
    const headerStatusTrigger = document.getElementById('header-status-trigger');
    const workThumbnailTrigger = document.getElementById('work-thumbnail-trigger');

    // Add event listeners only if the elements exist
    if (headerNameTrigger && aboutPanel && aboutNavItem) {
        headerNameTrigger.addEventListener('click', () => {
            hideFollower();
            togglePanel(aboutPanel, contactPanel); // Toggle About, hide Contact if open
            moveNavIndicator(aboutNavItem);
        });
    }

    if (headerStatusTrigger && contactPanel && contactNavItem) {
        headerStatusTrigger.addEventListener('click', () => {
            hideFollower();
            togglePanel(contactPanel, aboutPanel); // Toggle Contact, hide About if open
            moveNavIndicator(contactNavItem);
        });
    }

    if (workThumbnailTrigger && workView && workNavItem) {
        workThumbnailTrigger.addEventListener('click', function () {
            hideFollower();
            if (workView) workView.classList.add('show');
            closeAllPanels(); // Close About/Contact if open
            moveNavIndicator(workNavItem);
        });
    }

    // Navigation item clicks
    if (navItems.length > 0) {
        navItems.forEach((item) => {
            item.addEventListener('click', function () {
                hideFollower();
                const targetNavItem = this; // Store 'this' for clarity

                if (targetNavItem.classList.contains('nav-about')) {
                    togglePanel(aboutPanel, contactPanel);
                } else if (targetNavItem.classList.contains('nav-contact')) {
                    togglePanel(contactPanel, aboutPanel);
                } else if (targetNavItem.classList.contains('nav-work')) {
                    if (workView) workView.classList.add('show');
                    closeAllPanels();
                } else if (targetNavItem.classList.contains('nav-index')) {
                    if (workView) workView.classList.remove('show');
                    closeAllPanels();
                }
                // Always move the indicator to the clicked item
                moveNavIndicator(targetNavItem);
            });
        });
    }

    // Close buttons for panels
    document.querySelectorAll('.close-panel').forEach((btn) => {
        btn.addEventListener('click', function () {
            hideFollower();
            const panel = this.closest('.about-panel, .contact-panel');
            if (panel) {
                panel.classList.remove('panel-active');
                // Move indicator back to index when a panel is closed
                if (indexNavItem) {
                    moveNavIndicator(indexNavItem);
                }
            }
        });
    });

    // Close button for work view
    const workClose = document.querySelector('.work-close');
    if (workClose && workView) {
        workClose.addEventListener('click', function () {
            hideFollower();
            workView.classList.remove('show');
            // Move indicator back to index when work view is closed
            if (indexNavItem) {
                moveNavIndicator(indexNavItem);
            }
        });
    }

    // --- Sidebar Theme Dots ---
    const sidebarDots = document.querySelectorAll('.sidebar-dots .dot');
    if (sidebarDots.length > 0) {
        sidebarDots.forEach((dot) => {
            dot.addEventListener('click', function () {
                hideFollower();
                const theme = this.getAttribute('data-theme');
                if (theme) { // Check if theme attribute exists
                    document.body.className = `${theme}-theme`;
                    updateSidebarDots(theme); // Update dot appearance

                    // Simple click feedback animation
                    this.style.transform = 'scale(1.3)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 150);

                    // Re-setup eye tracking after theme change might affect layout/colors
                    setTimeout(setupEyeTracking_Simple, 100);
                }
            });
        });
        // Set initial active dot based on current body theme or default to 'dark'
        const initialTheme = document.body.classList[0]?.split('-')[0] || 'dark';
        updateSidebarDots(initialTheme);
    }

}); // End DOMContentLoaded


// --- Helper Functions (Keep these globally accessible or move if appropriate) ---

function moveNavIndicator(targetItem) {
    const navIndicator = document.querySelector('.nav-indicator');
    const currentNavCircle = document.querySelector('.nav-circle');
    // Ensure all required elements exist
    if (!navIndicator || !currentNavCircle || !targetItem) return;

    const angle = parseFloat(targetItem.getAttribute('data-angle')) || 0;
    const circleRadius = currentNavCircle.offsetWidth / 2;
    const indicatorRadius = navIndicator.offsetWidth / 2;
    // Calculate offset from center: radius of circle - radius of indicator - desired gap (e.g., 10px)
    // Provide a fallback offset if circleRadius is 0 (e.g., before fully rendered)
    const offset = circleRadius > 0 ? circleRadius - indicatorRadius - 10 : 60;

    // Apply transformations: move to center, rotate to angle, move out by offset, un-rotate indicator itself
    navIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${-offset}px) rotate(${-angle}deg)`;
}

function togglePanel(panelToShow, panelToHide) {
    // Ensure the panel to show exists
    if (!panelToShow) return;

    const indexNavItem = document.querySelector('.nav-item.nav-index'); // Find index nav item for resetting

    // If the panel to show is already active, close it
    if (panelToShow.classList.contains('panel-active')) {
        panelToShow.classList.remove('panel-active');
        // Move indicator back to index if available
        if (indexNavItem) {
             moveNavIndicator(indexNavItem);
        }
    } else {
        // If the other panel (panelToHide) is active, close it first
        if (panelToHide && panelToHide.classList.contains('panel-active')) {
            panelToHide.classList.remove('panel-active');
        }
        // Open the target panel
        panelToShow.classList.add('panel-active');
        // Note: moveNavIndicator is typically called by the event listener that calls togglePanel
    }
    // Ensure work view is hidden when toggling panels
    const workView = document.getElementById('work-view');
    if (workView && workView.classList.contains('show')) {
        workView.classList.remove('show');
    }
}

function closeAllPanels() {
    document.querySelectorAll('.about-panel, .contact-panel').forEach(panel => {
        // Check if panel exists and is active before removing class
        if (panel && panel.classList.contains('panel-active')) {
            panel.classList.remove('panel-active');
        }
    });
}

function updateSidebarDots(activeTheme) {
    const dots = document.querySelectorAll('.sidebar-dots .dot');
    dots.forEach((dot) => {
        // Reset classes
        dot.classList.remove('dot-outline', 'dot-filled');
        // Apply class based on whether the dot's theme matches the active theme
        if (dot.getAttribute('data-theme') === activeTheme) {
            dot.classList.add('dot-filled');
        } else {
            dot.classList.add('dot-outline');
        }
    });
}


// --- Window Resize Handler ---
window.addEventListener('resize', function () {
    // console.log("Resize event triggered."); // DEBUG
    const previousMobileState = isMobile; // Store previous state
    isMobile = window.innerWidth < 768; // Recalculate isMobile
    // console.log("isMobile after resize:", isMobile); // DEBUG

    hideFollower(); // Always hide follower on resize

    // Only re-setup eye tracking if the mobile state changed or if it's not mobile now
    // This prevents unnecessary resets if resizing happens only on desktop/mobile without crossing the threshold
    if (isMobile !== previousMobileState || !isMobile) {
        // console.log("Calling setupEyeTracking_Simple from resize handler due to state change or non-mobile."); // DEBUG
        // Use a small delay to allow layout to potentially settle slightly
        setTimeout(setupEyeTracking_Simple, 50);
    } else if (isMobile && pupil) {
        // If it remains mobile, ensure the pupil is reset
        pupil.style.transform = `translate(-50%, -50%)`;
    }


    // Update Nav Indicator position after layout potentially settles
    const currentNavCircle = document.querySelector('.nav-circle');
    // Check if navCircle is visible (meaning main content is likely shown)
    if (currentNavCircle && currentNavCircle.classList.contains('show')) {
        // Use a timeout to let the browser reflow/repaint
        setTimeout(() => {
            // Determine the currently active section to move the indicator correctly
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

            // Move indicator if an active item was found
            if (activeItem) {
                moveNavIndicator(activeItem);
            }
        }, 150); // Delay might need adjustment based on complexity
    }

    // --- ALSO UPDATE MOOD INDICATOR ON RESIZE ---
    // Check if mood selector is potentially visible or just finished transitioning
    if (moodSelector && (moodSelector.classList.contains('show') || getComputedStyle(moodSelector).display !== 'none')) {
        setTimeout(() => {
            const activeMoodOption = document.querySelector('.mood-option.active-option');
            if (activeMoodOption) {
                // Re-trigger the click logic to recalculate position based on new dimensions
                activeMoodOption.click();
            }
        }, 150); // Similar delay
    }
});
// --- END OF FILE app.js ---