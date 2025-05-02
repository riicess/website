document.addEventListener('DOMContentLoaded', function () {
    // --- Initialize Elements ---
    const pupil = document.querySelector('.pupil');
    const eyeElement = document.querySelector('.eye'); // Renamed from eye for clarity
    const eyeContainer = document.querySelector('.eye-container');
    const eyeWrapper = document.getElementById('eye-wrapper'); // Use the new ID
    const atomOrbits = document.querySelectorAll('.atom-orbit'); // Select all orbits
    const cursorFollower = document.getElementById('cursor-follower-text');
    const loader = document.getElementById('loader');
    const moodSelector = document.getElementById('mood-selector');
    const mainContainer = document.querySelector('.main-container');
    const body = document.body;

    // Panels & Triggers
    const aboutPanel = document.getElementById('about-panel');
    const contactPanel = document.getElementById('contact-panel');
    const skillsPanel = document.getElementById('skills-panel');
    const toolsPanel = document.getElementById('tools-panel');
    const panels = document.querySelectorAll('.panel'); // Get all panels to check if any are open
    const workView = document.getElementById('work-view');
    const navAboutTrigger = document.getElementById('nav-about-trigger');
    const navContactTrigger = document.getElementById('nav-contact-trigger');
    const navSkillsTrigger = document.getElementById('nav-skills-trigger');
    const navToolsTrigger = document.getElementById('nav-tools-trigger');
    const navWorkTrigger = document.getElementById('nav-work-trigger');
    const workCloseBtn = document.querySelector('#work-view .work-close');
    const panelCloseBtns = document.querySelectorAll('.close-panel');
    const navLinks = document.querySelectorAll('.nav-link');
    const statusTrigger = document.getElementById('header-status-trigger');
    const erenTrigger = document.getElementById('hero-eren');

    // Floating Action Texts
    const actionTextSkills = document.getElementById('action-text-skills');
    const actionTextWork = document.getElementById('action-text-work');
    const actionTextSkillsAlt = document.getElementById('action-text-skills-alt');
    const floatingActionTexts = [actionTextSkills, actionTextWork, actionTextSkillsAlt].filter(Boolean);

    // Mood Selector Elements
    const moodOptions = document.querySelectorAll('#mood-selector .mood-option');
    const setMoodBtn = document.getElementById('set-mood-btn');
    const moodCloseBtn = document.querySelector('.mood-close-btn');
    const themeDots = document.querySelectorAll('.theme-dots .dot');

    // State
    let isMobile = window.innerWidth < 768;
    let mouseX = 0, mouseY = 0;
    let eyeTrackingRafId = null;
    let followerRafId = null;
    let isFollowerActive = false;
    let activeTriggerElement = null;
    let selectedTheme = body.classList[0]?.replace('-theme', '') || 'dark';
    let isBlinking = false;
    let isLookingAtTarget = false;
    let targetCoords = { x: 0, y: 0 };
    let currentExpression = 'normal';
    let mobileTargetTimerId = null;
    // Eye state variables moved to outer scope
    let eyeRect, eyeCenterX, eyeCenterY, maxMoveX, maxMoveY;
    // Variables moved from setupEyeTracking/updatePupil for broader scope access
    let currentX = 0, currentY = 0;
    const easing = 0.08;
    const influence = 0.15;
    const targetInfluence = 0.1;
    const targetEasing = 0.06;


    // --- Eye Click Interaction State ---
    let eyeClickCount = 0;
    const maxEyeClicks = 5; // Max number of clicks to intensify effect
    let eyeResetTimerId = null;
    const baseOrbitDurations = { // Match CSS durations
        'orbit-1': 8,
        'orbit-2': 10,
        'orbit-3': 12
    };

    const scrambleChars = '!<>-_\\/—=+*^?#_____123456789';

    // --- Helper Functions (Define Recalculate Bounds Here) ---
    function recalculateBounds() {
        // Check if elements still exist/visible
        // Important: Check eyeWrapper visibility for desktop logic
        if (!eyeElement || !eyeWrapper || (window.innerWidth >= 768 && eyeWrapper.offsetParent === null)) {
            // Clear potentially stale values if eye isn't visible/exists
            eyeCenterX = undefined;
            eyeCenterY = undefined;
            return false;
        }
        eyeRect = eyeElement.getBoundingClientRect();
        if (!eyeRect || eyeRect.width === 0) {
            eyeCenterX = undefined;
            eyeCenterY = undefined;
            return false;
        }
        eyeCenterX = eyeRect.left + eyeRect.width / 2;
        eyeCenterY = eyeRect.top + eyeRect.height / 2;
        maxMoveX = eyeRect.width * 0.25;
        maxMoveY = eyeRect.height * 0.25;
        return true;
    }


    // --- Loader Hiding ---
    window.addEventListener('load', () => {
        if (loader) {
            loader.classList.add('hide');
            setTimeout(() => {
                if (loader) loader.style.display = 'none';
            }, 300);
        }
    });

    // --- Global Mouse Move ---
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    // --- Cursor Follower ---
    const hoverTriggers = document.querySelectorAll('.interactive-hover-trigger');
    const FOLLOWER_OFFSET = 15;

    hoverTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', () => {
            if (isMobile || !cursorFollower) return;
            const hoverText = trigger.getAttribute('data-hover-text');
            if (hoverText) {
                activeTriggerElement = trigger;
                cursorFollower.textContent = hoverText;
                cursorFollower.classList.add('active');
                isFollowerActive = true;
                updateFollowerPosition();
                if (!followerRafId) loopFollower();
            }
        });
        trigger.addEventListener('mouseleave', () => {
            if (isMobile || !cursorFollower || activeTriggerElement !== trigger) {
                return;
            }
            hideFollower();
        });
        trigger.addEventListener('click', hideFollower);
    });

    function updateFollowerPosition() {
        if (isFollowerActive && cursorFollower && !isMobile) {
            cursorFollower.style.transform = `translate(${mouseX + FOLLOWER_OFFSET}px, ${mouseY + FOLLOWER_OFFSET}px)`;
        }
    }

    function loopFollower() {
        if (!isFollowerActive) {
            followerRafId = null;
            return;
        }
        updateFollowerPosition();
        followerRafId = requestAnimationFrame(loopFollower);
    }

    function hideFollower() {
        if (cursorFollower) cursorFollower.classList.remove('active');
        isFollowerActive = false;
        activeTriggerElement = null;
    }

    // --- Text Scramble Effect ---
    function scrambleText(element) {
        if (element.dataset.scrambling || !element.textContent) return;

        const originalText = element.textContent;
        element.dataset.originalText = originalText;
        element.dataset.scrambling = 'true';

        let iterations = 0;
        const intervalDuration = 60;
        const totalDuration = 500;
        const maxIterations = Math.floor(totalDuration / intervalDuration);

        const interval = setInterval(() => {
            element.textContent = originalText
                .split('')
                .map((char, index) => {
                    if (char === ' ') return ' ';
                    if (index < iterations * (originalText.length / maxIterations)) {
                        return originalText[index];
                    }
                    return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                })
                .join('');

            if (iterations >= maxIterations) {
                clearInterval(interval);
                element.textContent = originalText;
                delete element.dataset.scrambling;
                delete element.dataset.originalText;
            }
            iterations++;
        }, intervalDuration);

        element.dataset.scrambleInterval = interval;
    }

    function unscrambleText(element) {
        const intervalId = element.dataset.scrambleInterval;
        if (intervalId) clearInterval(intervalId);
        if (element.dataset.originalText) element.textContent = element.dataset.originalText;
        delete element.dataset.scrambling;
        delete element.dataset.originalText;
        delete element.dataset.scrambleInterval;
    }

    // --- Eye Tracking (updatePupil moved outside setupEyeTracking) ---

    function updatePupil() {
        // Mobile check should effectively prevent this running if eyeWrapper is hidden by CSS
        if (isMobile || !pupil || !eyeWrapper || eyeWrapper.offsetParent === null) {
            if (pupil) { pupil.style.transform = `translate(-50%, -50%) scale(1)`; }
            // Still request frame to keep checking if view changes back to desktop or for resize
            eyeTrackingRafId = requestAnimationFrame(updatePupil);
            return;
        }

        // Desktop Eye Logic
        if (eyeCenterX === undefined) { // Check if bounds are valid
            if (!recalculateBounds()) { // Try recalculating
                eyeTrackingRafId = requestAnimationFrame(updatePupil);
                return; // Skip frame if bounds still invalid
            }
        }

        let lookTargetX, lookTargetY, currentInfluenceVal, currentEasingVal; // Renamed to avoid conflict

        if (isLookingAtTarget) {
            lookTargetX = targetCoords.x; lookTargetY = targetCoords.y;
            currentInfluenceVal = targetInfluence; currentEasingVal = targetEasing;
        } else {
            lookTargetX = mouseX; lookTargetY = mouseY;
            currentInfluenceVal = influence; currentEasingVal = easing;
        }

        const deltaX = lookTargetX - eyeCenterX;
        const deltaY = lookTargetY - eyeCenterY;

        let targetPupilX = deltaX * currentInfluenceVal;
        let targetPupilY = deltaY * currentInfluenceVal;

        targetPupilX = Math.max(-maxMoveX, Math.min(maxMoveX, targetPupilX));
        targetPupilY = Math.max(-maxMoveY, Math.min(maxMoveY, targetPupilY));

        currentX += (targetPupilX - currentX) * currentEasingVal;
        currentY += (targetPupilY - currentY) * currentEasingVal;

        // Check pupil exists again before styling (robustness)
        if (pupil) {
            // Apply base transform and the calculated translation
            // The scaleY/translateY for squinting is handled separately in handleEyeClick/resetEyeEffects
            // We read the existing scale/translateY applied by those functions and preserve it here
            const existingSquintTransform = pupil.style.transform.match(/scaleY\([^)]+\)|translateY\([^)]+\)/g)?.join(' ') || '';
            pupil.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px) ${existingSquintTransform}`;
        }
        eyeTrackingRafId = requestAnimationFrame(updatePupil);
    }

    function setupEyeTracking() {
        // Check for eyeWrapper as well, since it might be hidden
        if (!pupil || !eyeElement || !eyeWrapper) {
            // Don't warn if mobile, as hiding is expected
            if (!isMobile) console.warn("Eye elements missing for tracking.");
            return;
        }

        // recalculateBounds function is now defined outside

        // Initial calculation moved here, after updatePupil is defined
        recalculateBounds();
        // Start loop only if on desktop initially
        if (!isMobile && eyeWrapper && eyeWrapper.offsetParent !== null) {
            if (!eyeTrackingRafId) updatePupil();
        } else if (isMobile) {
            // If mobile, still start loop to handle potential switch back to desktop
            if (!eyeTrackingRafId) updatePupil();
        }
    }
    // Call setup after updatePupil is defined
    setupEyeTracking();


    // --- Eye Behaviors ---
    function blink() {
        // Check if eyeWrapper is visible
        if (isBlinking || isMobile || !eyeContainer || !eyeWrapper || eyeWrapper.offsetParent === null || eyeClickCount > 0) return;
        isBlinking = true;
        eyeContainer.classList.add('eye-blink');
        setTimeout(() => {
            eyeContainer.classList.remove('eye-blink');
            if (eyeClickCount === 0) isBlinking = false;
        }, 150);
    }

    function setExpression(expression) {
        if (isMobile || !eyeContainer || !eyeWrapper || eyeWrapper.offsetParent === null) return;
        eyeContainer.classList.remove('eye-squint', 'eye-shocked');
        currentExpression = expression;
        if (expression === 'shocked') { eyeContainer.classList.add('eye-shocked'); }
    }

    function lookAtRandomTarget() {
        if (isLookingAtTarget || isMobile || floatingActionTexts.length === 0 || !eyeWrapper || eyeWrapper.offsetParent === null) return;

        const targetElement = floatingActionTexts[Math.floor(Math.random() * floatingActionTexts.length)];
        // Ensure target element itself is visible before trying to look
        if (targetElement.offsetParent === null) return;

        const rect = targetElement.getBoundingClientRect();

        if (rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0) {
            isLookingAtTarget = true;
            targetCoords.x = rect.left + rect.width / 2;
            targetCoords.y = rect.top + rect.height / 2;

            const lookDuration = Math.random() * 1500 + 1000;
            setTimeout(() => {
                isLookingAtTarget = false;
            }, lookDuration);
        }
    }

    function scheduleEyeBehaviors() {
        // Check if eyeWrapper is visible
        if (isMobile || !eyeWrapper || eyeWrapper.offsetParent === null) {
            // If hidden, check again later in case it becomes visible
            setTimeout(scheduleEyeBehaviors, 5000); // Check every 5s
            return;
        }

        // Blinking Timer
        const blinkDelay = Math.random() * 30000 + 20000;
        setTimeout(() => {
            blink();
            scheduleEyeBehaviors(); // Reschedule
        }, blinkDelay);

        // Look At Target Timer
        const lookTargetDelay = Math.random() * 15000 + 8000;
        setTimeout(lookAtRandomTarget, lookTargetDelay);

        // Expression Change Timer
        const expressionDelay = Math.random() * 25000 + 15000;
        setTimeout(() => {
            const expressions = ['normal', 'shocked', 'normal', 'normal'];
            setExpression(expressions[Math.floor(Math.random() * expressions.length)]);
        }, expressionDelay);
    }
    setTimeout(scheduleEyeBehaviors, 3000); // Initial start


    // --- Eye Click Interaction ---
    if (eyeWrapper) { // Check if wrapper exists
        eyeWrapper.addEventListener('click', handleEyeClick);
    }

    function handleEyeClick() {
        // Check if eyeWrapper is visible when clicked
        if (!eyeWrapper || eyeWrapper.offsetParent === null) return; // Exit if hidden

        const isPanelOpen = Array.from(panels).some(p => p.classList.contains('panel-active'));
        if (isPanelOpen || (workView && workView.classList.contains('show'))) {
            return;
        }

        clearTimeout(eyeResetTimerId);

        eyeClickCount = Math.min(eyeClickCount + 1, maxEyeClicks);

        // 1. Apply Squint
        const eyeSquintFactor = Math.max(0.05, 1 - (eyeClickCount * 0.15)); // Squint eye a bit more
        const pupilSquintFactor = Math.max(0, 1 - (eyeClickCount * 0.20)); // Allow pupil scale to reach 0
        const pupilOpacity = (eyeClickCount === maxEyeClicks) ? '0' : '1'; // Make invisible at max clicks
        const pupilTranslateY = eyeClickCount * -1.5; // Move pupil up slightly

        if (eyeElement) {
            if (eyeContainer && eyeContainer.classList.contains('eye-blink')) {
                eyeContainer.classList.remove('eye-blink');
                isBlinking = false;
            }
            eyeElement.style.transform = `scaleY(${eyeSquintFactor})`;
            // Update pupil transform directly - combine with existing translation from updatePupil
            const baseTransform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;
            if (pupil) { // Check pupil exists before styling
                pupil.style.opacity = pupilOpacity; // Apply opacity change
                pupil.style.transform = `${baseTransform} scaleY(${pupilSquintFactor}) translateY(${pupilTranslateY}px)`;
            }
        }

        // 2. Speed up Atoms (Desktop Only - visibility already checked)
        if (atomOrbits.length > 0) {
            const speedFactor = 1 + (eyeClickCount * 0.6);
            atomOrbits.forEach(orbit => {
                let baseDuration = 8; // Default
                if (orbit.classList.contains('orbit-1')) baseDuration = baseOrbitDurations['orbit-1'];
                else if (orbit.classList.contains('orbit-2')) baseDuration = baseOrbitDurations['orbit-2'];
                else if (orbit.classList.contains('orbit-3')) baseDuration = baseOrbitDurations['orbit-3'];

                const newDuration = baseDuration / speedFactor;
                orbit.style.animationDuration = `${newDuration}s`;
            });
        }

        // 3. Set Timer to Reset
        eyeResetTimerId = setTimeout(resetEyeEffects, 2500);
    }

    function resetEyeEffects() {
        eyeClickCount = 0; // Always reset click count

        // Only reset styles if eyeWrapper exists and is visible
        if (eyeWrapper && eyeWrapper.offsetParent !== null) {
            // Reset Squint (CSS transition handles smoothness)
            if (eyeElement) {
                eyeElement.style.transform = 'scaleY(1)';
            }
            if (pupil) {
                 // Reset pupil transform - combine with existing translation from updatePupil
                 const baseTransform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;
                 pupil.style.opacity = '1'; // Reset opacity
                 pupil.style.transform = `${baseTransform} scaleY(1) translateY(0px)`;
            }
            // Reset Atom Speed (CSS transition handles smoothness)
            if (atomOrbits.length > 0) {
                atomOrbits.forEach(orbit => {
                    orbit.style.animationPlayState = 'running'; // Ensure it stays running
                    // Set back to base duration
                    if (orbit.classList.contains('orbit-1')) orbit.style.animationDuration = baseOrbitDurations['orbit-1'] + 's';
                    else if (orbit.classList.contains('orbit-2')) orbit.style.animationDuration = baseOrbitDurations['orbit-2'] + 's';
                    else if (orbit.classList.contains('orbit-3')) orbit.style.animationDuration = baseOrbitDurations['orbit-3'] + 's';
                    // If no class matches, maybe reset to a default or remove the style
                    // else { orbit.style.animationDuration = ''; } // Or a default like '8s'
                });
            }
        }
        isBlinking = false; // Always allow blinking again after reset attempt
    }


    // --- Mobile Eye Targeting --- (Effectively just cleanup now)
    function stopMobileTargeting() {
        clearTimeout(mobileTargetTimerId);
        mobileTargetTimerId = null;
    }

    // --- Theme Switching ---
    function applyTheme(theme) {
        body.className = `${theme}-theme`;
        selectedTheme = theme;
        themeDots.forEach(dot => dot.classList.toggle('active', dot.getAttribute('data-theme') === theme));
        moodOptions.forEach(opt => opt.classList.toggle('active-option', opt.getAttribute('data-theme') === theme));
        localStorage.setItem('portfolioTheme', theme);
    }
    moodOptions.forEach(option => {
        option.addEventListener('click', function () {
            const theme = this.getAttribute('data-theme');
            if (theme) {
                moodOptions.forEach(opt => opt.classList.remove('active-option'));
                this.classList.add('active-option');
                selectedTheme = theme;
            }
        });
    });
    setMoodBtn.addEventListener('click', () => {
        if (selectedTheme) applyTheme(selectedTheme);
        if (moodSelector) moodSelector.classList.remove('show');
    });
    moodCloseBtn.addEventListener('click', () => {
        if (moodSelector) moodSelector.classList.remove('show');
        const currentTheme = body.classList[0]?.replace('-theme', '') || 'dark';
        moodOptions.forEach(opt => {
            opt.classList.toggle('active-option', opt.getAttribute('data-theme') === currentTheme);
        });
        selectedTheme = currentTheme;
    });
    themeDots.forEach(dot => {
        dot.addEventListener('click', function () {
            const theme = this.getAttribute('data-theme');
            if (theme) {
                applyTheme(theme);
                hideFollower();
            } else {
                console.warn("Theme dot clicked without data-theme attribute:", this);
            }
        });
    });
    const savedTheme = localStorage.getItem('portfolioTheme');
    applyTheme(savedTheme || 'dark');

    // --- Panel & Work View Toggling ---
    // Reset logic inside these functions is already correct
    function closeAllPanels() { panels.forEach(p => p.classList.remove('panel-active')); navLinks.forEach(link => link.classList.remove('active')); resetEyeEffects(); }
    function closeWorkView() { if (workView) workView.classList.remove('show'); navLinks.forEach(link => link.classList.remove('active')); resetEyeEffects(); }

    // Listeners for panel/view triggers
    if (navAboutTrigger && aboutPanel) { navAboutTrigger.addEventListener('click', (e) => { e.preventDefault(); closeWorkView(); resetEyeEffects(); const isAlreadyOpen = aboutPanel.classList.contains('panel-active'); closeAllPanels(); if (!isAlreadyOpen) { aboutPanel.classList.add('panel-active'); navAboutTrigger.classList.add('active'); aboutPanel.querySelector('.close-panel')?.focus(); } hideFollower(); }); }
    if (navContactTrigger && contactPanel) { navContactTrigger.addEventListener('click', (e) => { e.preventDefault(); closeWorkView(); resetEyeEffects(); const isAlreadyOpen = contactPanel.classList.contains('panel-active'); closeAllPanels(); if (!isAlreadyOpen) { contactPanel.classList.add('panel-active'); contactPanel.querySelector('.close-panel')?.focus(); navContactTrigger.classList.add('active'); } hideFollower(); }); }
    if (navSkillsTrigger && skillsPanel) { navSkillsTrigger.addEventListener('click', (e) => { e.preventDefault(); closeWorkView(); resetEyeEffects(); const isAlreadyOpen = skillsPanel.classList.contains('panel-active'); closeAllPanels(); if (!isAlreadyOpen) { skillsPanel.classList.add('panel-active'); skillsPanel.querySelector('.close-panel')?.focus(); navSkillsTrigger.classList.add('active'); } hideFollower(); }); }
    if (navToolsTrigger && toolsPanel) { navToolsTrigger.addEventListener('click', (e) => { e.preventDefault(); closeWorkView(); resetEyeEffects(); const isAlreadyOpen = toolsPanel.classList.contains('panel-active'); closeAllPanels(); if (!isAlreadyOpen) { toolsPanel.classList.add('panel-active'); toolsPanel.querySelector('.close-panel')?.focus(); navToolsTrigger.classList.add('active'); } hideFollower(); }); }
    if (navWorkTrigger && workView) { navWorkTrigger.addEventListener('click', (e) => { e.preventDefault(); closeAllPanels(); resetEyeEffects(); workView.classList.add('show'); navWorkTrigger.classList.add('active'); workCloseBtn?.focus(); hideFollower(); }); }
    if (erenTrigger && aboutPanel) { erenTrigger.addEventListener('click', (e) => { e.preventDefault(); closeWorkView(); resetEyeEffects(); const isAlreadyOpen = aboutPanel.classList.contains('panel-active'); closeAllPanels(); if (!isAlreadyOpen) { aboutPanel.classList.add('panel-active'); aboutPanel.querySelector('.close-panel')?.focus(); } hideFollower(); }); }
    if (statusTrigger && contactPanel) { statusTrigger.addEventListener('click', (e) => { e.preventDefault(); closeWorkView(); resetEyeEffects(); const isAlreadyOpen = contactPanel.classList.contains('panel-active'); closeAllPanels(); if (!isAlreadyOpen) { contactPanel.classList.add('panel-active'); contactPanel.querySelector('.close-panel')?.focus(); } hideFollower(); }); }
    panelCloseBtns.forEach(btn => { btn.addEventListener('click', () => { closeAllPanels(); hideFollower(); }); });
    if (workCloseBtn) workCloseBtn.addEventListener('click', () => { closeWorkView(); hideFollower(); });

    // --- Floating Action Text Listeners ---
    if (actionTextSkills && navSkillsTrigger) { actionTextSkills.addEventListener('click', (e) => { e.preventDefault(); resetEyeEffects(); navSkillsTrigger.click(); }); }
    if (actionTextWork && navWorkTrigger) { actionTextWork.addEventListener('click', (e) => { e.preventDefault(); resetEyeEffects(); navWorkTrigger.click(); }); }
    if (actionTextSkillsAlt && navToolsTrigger) { actionTextSkillsAlt.addEventListener('click', (e) => { e.preventDefault(); resetEyeEffects(); navToolsTrigger.click(); }); }


    // --- Window Resize Handler ---
    window.addEventListener('resize', () => {
        const wasMobile = isMobile;
        isMobile = window.innerWidth < 768;

        hideFollower(); // Always hide

        recalculateBounds(); // Recalculate bounds on every resize

        if (isMobile) {
            if (!wasMobile) { // Switched TO mobile
                stopMobileTargeting();
                resetEyeEffects(); // Attempt reset (will only work if eye was visible)
                // Pupil centering handled by updatePupil's mobile path
                // Eye wrapper hidden by CSS
                // Stop potentially running desktop rAF loop if it wasn't stopped by updatePupil
                if (eyeTrackingRafId) {
                    cancelAnimationFrame(eyeTrackingRafId);
                    eyeTrackingRafId = null; // Ensure it's null
                    // Restart loop in mobile mode immediately (it will just center pupil and wait)
                    updatePupil();
                }

            }
        } else { // Switched TO desktop
            if (wasMobile) {
                resetEyeEffects(); // Attempt reset (will only work if eye becomes visible)
                // Bounds recalculated above
            }
            // Ensure loop is running for desktop if eye is visible
            if (eyeWrapper && eyeWrapper.offsetParent !== null && !eyeTrackingRafId) {
                // Restart the loop if it wasn't running
                updatePupil();
            }
        }

    }, { passive: true }); // END OF RESIZE LISTENER


    // --- Add Scramble Listeners ---
    const scrambleTriggers = document.querySelectorAll('.scramble-hover-trigger');
    scrambleTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', () => {
            const textElement = trigger.querySelector('.status-text') || trigger;
            scrambleText(textElement);
        });
        trigger.addEventListener('mouseleave', () => {
            const textElement = trigger.querySelector('.status-text') || trigger;
            unscrambleText(textElement);
        });
    });

}); // End DOMContentLoaded
