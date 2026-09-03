(function () {
    'use strict';

    // ─────────────────────────────────────
    // DOM References
    // ─────────────────────────────────────
    const intro = document.getElementById('intro');
    const introEyebrow = document.querySelector('.intro__eyebrow');
    const introLines = document.querySelectorAll('.intro__line');
    const playBtn = document.getElementById('playBtn');
    const playBtnCircle = document.querySelector('.play-btn__circle');
    const introFooter = document.querySelector('.intro__footer');
    const lottieSection = document.getElementById('lottieSection');
    const lottieContainer = document.getElementById('lottieContainer');
    const videoSection = document.getElementById('videoSection');
    const videoContainer = document.getElementById('videoContainer');
    const video = document.getElementById('mainVideo');
    const videoProgress = document.getElementById('videoProgress');
    const videoProgressFill = document.getElementById('videoProgressFill');
    const videoUi = document.getElementById('videoUi');
    const videoStatus = document.getElementById('videoStatus');
    const videoTime = document.getElementById('videoTime');
    const finalScreen = document.getElementById('finalScreen');
    const finalEyebrow = document.querySelector('.final-screen__eyebrow');
    const finalTitle = document.querySelector('.final-screen__title');
    const finalDescription = document.querySelector('.final-screen__description');
    const replayBtn = document.getElementById('replayBtn');
    const cursor = document.getElementById('cursor');
    const grainOverlay = document.querySelector('.grain-overlay');
    const ambientGlow = document.querySelector('.ambient-glow');

    // ─────────────────────────────────────
    // State
    // ─────────────────────────────────────
    let isPlaying = false;
    let hasInteracted = false;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let rafId = null;
    let uiHideTimeout = null;
    let isFullscreen = false;
    let introTimeline = null;
    let lottieAnimation = null;

    // ─────────────────────────────────────
    // Reduced Motion
    // ─────────────────────────────────────
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionDuration = prefersReducedMotion ? 0.01 : 1;

    // ─────────────────────────────────────
    // Utility: Format Time
    // ─────────────────────────────────────
    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    // ─────────────────────────────────────
    // Custom Cursor
    // ─────────────────────────────────────
    function initCursor() {
        const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

        if (isTouchDevice) {
            document.body.classList.add('show-cursor');
            cursor.style.display = 'none';
            return;
        }

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function updateCursor() {
            const ease = 0.25;
            cursorX += (mouseX - cursorX) * ease;
            cursorY += (mouseY - cursorY) * ease;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            rafId = requestAnimationFrame(updateCursor);
        }

        updateCursor();

        const hoverTargets = document.querySelectorAll('.play-btn, .replay-btn');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover-interactive'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover-interactive'));
        });
    }

    // ─────────────────────────────────────
    // Magnetic Button Effect
    // ─────────────────────────────────────
    function initMagneticButton(btn, strength = 0.3) {
        if (!btn || prefersReducedMotion) return;

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = (e.clientX - centerX) * strength;
            const deltaY = (e.clientY - centerY) * strength;

            gsap.to(btn, {
                x: deltaX,
                y: deltaY,
                duration: 0.4,
                ease: 'power2.out'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.4)'
            });
        });
    }

    // ─────────────────────────────────────
    // Intro Animation
    // ─────────────────────────────────────
    function initIntro() {
        if (introTimeline) {
            introTimeline.kill();
        }

        introTimeline = gsap.timeline({ defaults: { ease: 'power4.out' } });

        introTimeline
            .to(introEyebrow, {
                opacity: 1,
                duration: motionDuration * 1.3
            })
            .to(introLines, {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: motionDuration * 1.3,
                stagger: 0.2,
                ease: 'power4.out'
            }, '-=1.0')
            .to(playBtnCircle, {
                opacity: 1,
                scale: 1,
                duration: motionDuration * 1.2,
                ease: 'back.out(1.2)'
            }, '-=0.8')
            .to(introFooter, {
                opacity: 1,
                duration: motionDuration * 1.0
            }, '-=0.6');
    }

    // ─────────────────────────────────────
    // Lottie Animation
    // ─────────────────────────────────────
    function playLottieAnimation() {
        return new Promise((resolve) => {
            if (!lottieContainer) {
                resolve();
                return;
            }

            lottieAnimation = lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: false,
                autoplay: true,
                path: 'js/Spotify.json'
            });

            lottieAnimation.addEventListener('complete', () => {
                resolve();
            });

            lottieAnimation.addEventListener('error', () => {
                resolve();
            });

            // Safety timeout in case Lottie hangs
            setTimeout(() => {
                resolve();
            }, 4000);
        });
    }

    // ─────────────────────────────────────
    // Fullscreen
    // ─────────────────────────────────────
    function requestFullscreen() {
        const el = videoContainer;
        if (!el) return;

        if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
        isFullscreen = true;
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        isFullscreen = false;
    }

    // ─────────────────────────────────────
    // Show/Hide Video Controls
    // ─────────────────────────────────────
    function showVideoControls() {
        if (uiHideTimeout) clearTimeout(uiHideTimeout);
        gsap.to([videoUi, videoProgress], {
            opacity: 1,
            duration: motionDuration * 0.4
        });
        videoProgress.classList.add('visible');
        scheduleHideVideoControls();
    }

    function hideVideoControls() {
        if (uiHideTimeout) clearTimeout(uiHideTimeout);
        gsap.to([videoUi, videoProgress], {
            opacity: 0,
            duration: motionDuration * 0.5
        });
        videoProgress.classList.remove('visible');
    }

    function scheduleHideVideoControls() {
        if (uiHideTimeout) clearTimeout(uiHideTimeout);
        uiHideTimeout = setTimeout(() => {
            if (isPlaying) {
                hideVideoControls();
            }
        }, 2500);
    }

    // ─────────────────────────────────────
    // Video Progress + Time
    // ─────────────────────────────────────
    function updateProgress() {
        if (!video.duration) return;
        const progress = video.currentTime / video.duration;
        gsap.set(videoProgressFill, { scaleX: Math.max(0, Math.min(1, progress)) });
        gsap.set(videoProgress, { scaleX: 1 });
        videoTime.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
    }

    // ─────────────────────────────────────
    // Video End Handler
    // ─────────────────────────────────────
    function handleVideoEnd() {
        if (!isPlaying) return;
        isPlaying = false;

        const tl = gsap.timeline({
            defaults: { ease: 'power4.inOut' },
            onComplete: () => {
                exitFullscreen();
                videoSection.classList.remove('active');
                finalScreen.classList.add('active');
                showFinalScreen();
            }
        });

        tl.to(videoContainer, {
            opacity: 0,
            scale: 0.94,
            duration: motionDuration * 2.2
        })
        .to(videoUi, {
            opacity: 0,
            duration: motionDuration * 1.0
        }, '-=1.6')
        .to(videoProgress, {
            opacity: 0,
            duration: motionDuration * 0.7
        }, '-=1.4')
        .to(videoSection, {
            opacity: 0,
            duration: motionDuration * 1.2
        }, '-=1.0');
    }

    // ─────────────────────────────────────
    // Final Screen Animation
    // ─────────────────────────────────────
    function showFinalScreen() {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

        tl.to(finalEyebrow, {
            opacity: 1,
            y: 0,
            duration: motionDuration * 1.0
        })
        .to(finalTitle, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: motionDuration * 1.4
        }, '-=0.5')
        .to(finalDescription, {
            opacity: 1,
            duration: motionDuration * 1.0
        }, '-=0.8');
    }

    // ─────────────────────────────────────
    // Reset Experience
    // ─────────────────────────────────────
    function resetExperience() {
        isPlaying = false;

        video.pause();
        video.currentTime = 0;
        video.muted = false;

        finalScreen.classList.remove('active');
        gsap.set([finalEyebrow, finalTitle, finalDescription], {
            opacity: 0,
            y: 0,
            filter: 'blur(10px)'
        });

        gsap.set(videoProgressFill, { scaleX: 0 });
        gsap.set(videoProgress, { scaleX: 0, opacity: 0 });
        videoProgress.classList.remove('visible');
        gsap.set(videoUi, { opacity: 0 });
        videoTime.textContent = '00:00 / 00:00';

        gsap.set(videoContainer, {
            opacity: 0,
            scale: 0.92,
            filter: 'blur(16px)'
        });

        intro.style.display = 'flex';
        lottieSection.classList.remove('active');
        gsap.set(lottieSection, { opacity: 0 });
        videoSection.classList.remove('active');
        gsap.set(videoSection, { opacity: 0 });

        // Preload video again for next play
        video.load();

        initIntro();
    }

    // ─────────────────────────────────────
    // Video Hover / Click
    // ─────────────────────────────────────
    function initVideoHover() {
        if (prefersReducedMotion) return;

        videoContainer.addEventListener('mouseenter', () => {
            if (!isPlaying) return;
            gsap.to(videoContainer, {
                scale: 1.005,
                duration: 0.8,
                ease: 'power2.out'
            });
            showVideoControls();
        });

        videoContainer.addEventListener('mouseleave', () => {
            gsap.to(videoContainer, {
                scale: 1,
                duration: 0.8,
                ease: 'power2.out'
            });
            scheduleHideVideoControls();
        });

        videoContainer.addEventListener('click', (e) => {
            if (!isPlaying) return;
            const uiVisible = gsap.getProperty(videoUi, 'opacity') > 0.1;
            if (uiVisible) {
                hideVideoControls();
            } else {
                showVideoControls();
            }
        });
    }

    // ─────────────────────────────────────
    // Visibility Handler
    // ─────────────────────────────────────
    function initVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (isPlaying) {
                    video.pause();
                    hideVideoControls();
                }
            }
        });
    }

    // ─────────────────────────────────────
    // Start Experience
    // ─────────────────────────────────────
    async function startExperience() {
        if (isPlaying) return;
        isPlaying = true;

        video.muted = false;
        hasInteracted = true;

        const tl = gsap.timeline({
            defaults: { ease: 'power4.inOut' },
            onComplete: async () => {
                intro.style.display = 'none';
                lottieSection.classList.add('active');
                await playLottieAnimation();
                await transitionToVideo();
            }
        });

        tl.to(playBtnCircle, {
            scale: 3.5,
            opacity: 0,
            duration: motionDuration * 0.7,
            ease: 'power3.in'
        })
        .to(introEyebrow, {
            opacity: 0,
            y: -30,
            duration: motionDuration * 0.6
        }, '-=0.5')
        .to(introLines, {
            opacity: 0,
            y: -40,
            duration: motionDuration * 0.7,
            stagger: 0.08
        }, '-=0.55')
        .to(introFooter, {
            opacity: 0,
            duration: motionDuration * 0.5
        }, '-=0.4')
        .to('.vignette', {
            opacity: 1,
            duration: motionDuration * 2.0
        }, '-=0.7')
        .to(ambientGlow, {
            opacity: 1,
            duration: motionDuration * 1.4
        }, '-=1.2')
        .to(lottieSection, {
            opacity: 1,
            duration: motionDuration * 0.6
        }, '-=0.6');
    }

    // ─────────────────────────────────────
    // Transition to Video
    // ─────────────────────────────────────
    async function transitionToVideo() {
        // Ensure video is ready and first frame is available
        if (video.readyState < 3) {
            await new Promise((resolve) => {
                const onReady = () => {
                    video.removeEventListener('canplaythrough', onReady);
                    resolve();
                };
                video.addEventListener('canplaythrough', onReady, { once: true });
                video.load();
            });
        }

        // Reset to start and play
        video.currentTime = 0;
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
        }

        // Wait for actual playback to start
        await new Promise((resolve) => {
            const onPlaying = () => {
                video.removeEventListener('playing', onPlaying);
                resolve();
            };
            video.addEventListener('playing', onPlaying, { once: true });
            setTimeout(resolve, 300);
        });

        requestFullscreen();

        lottieSection.classList.remove('active');
        videoSection.classList.add('active');

        const tl = gsap.timeline({
            defaults: { ease: 'power4.inOut' },
            onComplete: () => {
                scheduleHideVideoControls();
            }
        });

        // Smooth crossfade from Lottie to video
        tl.to(lottieSection, {
            opacity: 0,
            scale: 1.15,
            duration: motionDuration * 1.0,
            ease: 'power3.in'
        })
        .to(videoSection, {
            opacity: 1,
            duration: motionDuration * 0.5
        }, '-=0.5')
        .to(videoContainer, {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: motionDuration * 1.6,
            ease: 'power4.out'
        }, '-=0.4')
        .to(videoUi, {
            opacity: 1,
            duration: motionDuration * 0.8
        }, '-=0.7')
        .to(videoProgress, {
            opacity: 1,
            duration: motionDuration * 0.5
        }, '-=0.4');
    }

    // ─────────────────────────────────────
    // Event Listeners
    // ─────────────────────────────────────
    function initEventListeners() {
        playBtn.addEventListener('click', startExperience);
        replayBtn.addEventListener('click', resetExperience);

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('ended', handleVideoEnd);
        video.addEventListener('loadedmetadata', () => {
            videoTime.textContent = '00:00 / ' + formatTime(video.duration);
        });

        let mouseMoveTimeout;
        document.addEventListener('mousemove', () => {
            if (isPlaying) {
                showVideoControls();
                clearTimeout(mouseMoveTimeout);
                mouseMoveTimeout = setTimeout(() => {
                    if (isPlaying) scheduleHideVideoControls();
                }, 1000);
            }
        });

        videoContainer.addEventListener('touchstart', () => {
            if (isPlaying) {
                showVideoControls();
            }
        }, { passive: true });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (!isPlaying && document.activeElement === playBtn) {
                    e.preventDefault();
                    startExperience();
                } else if (isPlaying && document.activeElement === replayBtn) {
                    e.preventDefault();
                    resetExperience();
                }
            }

            if (!isPlaying) return;

            switch (e.key.toLowerCase()) {
                case 'arrowleft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    break;
                case 'arrowright':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
                    break;
                case '0':
                    e.preventDefault();
                    video.currentTime = 0;
                    break;
            }
        });

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    }

    function handleFullscreenChange() {
        const isNowFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (isFullscreen !== isNowFullscreen) {
            isFullscreen = isNowFullscreen;
        }
    }

    // ─────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────
    function init() {
        initCursor();
        initMagneticButton(playBtn, 0.25);
        initMagneticButton(replayBtn, 0.2);
        initVideoHover();
        initVisibilityHandler();
        initEventListeners();
        initIntro();

        // Preload video immediately for smooth transition
        video.preload = 'auto';
        video.load();

        gsap.to(ambientGlow, {
            opacity: 1,
            duration: motionDuration * 2,
            delay: motionDuration * 0.5,
            ease: 'power2.out'
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
