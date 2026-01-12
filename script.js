// 현재 이미지 인덱스
let currentImageIndex = 0;
const totalImages = 9;

// 방명록 수정 모드 (Firebase용 - messageId 저장)
let editingMessageId = null;

// 방명록 표시 개수 제한
let displayedMessageCount = 3;

// Firebase 방명록 전체 데이터 (전역 저장)
window.allMessages = [];
const galleryImages = [
    'images/4.jpg',
    'images/10.jpg',
    'images/11.jpg',
    'images/45.jpg',
    'images/22.jpg',
    'images/24.jpg',
    'images/32.jpg',
    'images/26.jpg',
    'images/17.jpg',
    'images/999.jpg'
];

let isMusicPlaying = false;
let isFirstInteractionHandled = false;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0);
    initBackgroundMusic();
    initTouchPrompt();
    loadMessages();
    initScrollAnimation();
    initCalendar();
    initCountdown();
    initGallery();
    initNaverMap();
    preventGlobalImageDownload();
});

// 전역 이미지 다운로드 방지
function preventGlobalImageDownload() {
    // 모든 이미지에 기본 보호 적용
    document.addEventListener('contextmenu', function(event) {
        // 갤러리나 모달 영역의 이미지인 경우에만 방지
        if (event.target.tagName === 'IMG' && 
            (event.target.closest('.gallery-item') || 
             event.target.closest('.modal') ||
             event.target.id === 'modalImage')) {
            event.preventDefault();
            return false;
        }
    }, false);
    
    // 키보드 단축키로 이미지 저장 방지
    document.addEventListener('keydown', function(event) {
        // Ctrl+S (저장) 방지
        if (event.ctrlKey && event.key === 's') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.closest('.gallery') || 
                document.getElementById('imageModal')?.style.display === 'block') {
                event.preventDefault();
                return false;
            }
        }
    }, false);
}

// 배경음악 초기화
function initBackgroundMusic() {
    const music = document.getElementById('backgroundMusic');
    const soundIcon = document.getElementById('soundIcon');
    
    if (!music || !soundIcon) return;
    
    // 볼륨 설정
    music.volume = 0.5;
    music.muted = true;
    music.pause();
    
    // 초기 아이콘 설정
    isMusicPlaying = false;
    updateSoundIcon(false);
    
    // 터치 유도 화면이 없으면 원래 방식대로 첫 상호작용 리스너 추가
    const touchPrompt = document.getElementById('touchPrompt');
    if (!touchPrompt) {
        attachFirstInteractionListener();
    }
}

function updateSoundIcon(isPlaying) {
    const soundIcon = document.getElementById('soundIcon');
    if (!soundIcon) return;
    
    if (isPlaying) {
        soundIcon.src = 'images/soundon.svg';
        soundIcon.alt = '사운드 켜기';
    } else {
        soundIcon.src = 'images/soundoff.svg';
        soundIcon.alt = '사운드 끄기';
    }
}

function attachFirstInteractionListener() {
    if (isFirstInteractionHandled) return;
    const handler = () => {
        if (!isFirstInteractionHandled) {
            startMusicAfterInteraction();
        }
        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);
        document.removeEventListener('keydown', handler);
    };
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
}

function startMusicAfterInteraction() {
    const music = document.getElementById('backgroundMusic');
    if (!music) return;
    
    // 즉시 음악 재생
    music.muted = false;
    music.play().then(() => {
        isMusicPlaying = true;
        isFirstInteractionHandled = true;
        updateSoundIcon(true);
    }).catch((error) => {
        console.log('음악 재생 실패:', error);
        isMusicPlaying = false;
        updateSoundIcon(false);
        // 재생 실패 시 다시 시도
        setTimeout(() => {
            music.play().then(() => {
                isMusicPlaying = true;
                isFirstInteractionHandled = true;
                updateSoundIcon(true);
            }).catch(() => {
                isMusicPlaying = false;
                updateSoundIcon(false);
            });
        }, 100);
    });
}

// 사운드 토글 함수
function toggleSound() {
    const music = document.getElementById('backgroundMusic');
    
    if (!music) return;
    
    if (music.paused || music.muted) {
        // 음악 재생
        music.muted = false;
        music.play().catch(function(error) {
            console.log('음악 재생 실패:', error);
        });
        isMusicPlaying = true;
        isFirstInteractionHandled = true;
        updateSoundIcon(true);
    } else {
        // 음악 정지
        music.pause();
        isMusicPlaying = false;
        updateSoundIcon(false);
    }
}

// 오프닝 장면 애니메이션
// 터치 유도 화면 초기화
function initTouchPrompt() {
    const touchPrompt = document.getElementById('touchPrompt');
    if (!touchPrompt) {
        // 터치 유도 화면이 없으면 바로 오프닝 애니메이션 시작
        initOpeningScenes();
        return;
    }

    // 터치 이벤트 리스너 추가
    const handleTouch = () => {
        if (touchPrompt.classList.contains('hide')) return;
        
        // 터치 유도 화면 숨기기
        touchPrompt.classList.add('hide');
        
        // 바로 음악 재생
        startMusicAfterTouch();
        
        // 바로 오프닝 애니메이션 시작
        initOpeningScenes();
    };

    touchPrompt.addEventListener('click', handleTouch);
    touchPrompt.addEventListener('touchstart', handleTouch);
}

// 터치 후 음악 재생
function startMusicAfterTouch() {
    const music = document.getElementById('backgroundMusic');
    if (!music) return;
    
    // 음악이 이미 재생 중이면 중단하고 다시 시작
    if (!music.paused) {
        music.pause();
        music.currentTime = 0;
    }
    
    // 음소거 해제
    music.muted = false;
    
    // 음악 재생 시도
    const playPromise = music.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isMusicPlaying = true;
            updateSoundIcon(true);
        }).catch((error) => {
            console.log('음악 재생 실패:', error);
            // 재생 실패 시 다시 시도
            setTimeout(() => {
                music.play().then(() => {
                    isMusicPlaying = true;
                    updateSoundIcon(true);
                }).catch(() => {
                    isMusicPlaying = false;
                    updateSoundIcon(false);
                });
            }, 100);
        });
    } else {
        // Promise를 지원하지 않는 브라우저
        isMusicPlaying = !music.paused;
        updateSoundIcon(isMusicPlaying);
    }
}

function initOpeningScenes() {
    const opening = document.getElementById('opening');
    const scenes = opening ? Array.from(opening.querySelectorAll('.scene')) : [];
    if (!opening || scenes.length === 0) {
        return;
    }

    const DELAY_START = 200;
    const HOLD = 2500;
    const TRANSITION = 900;
    const END_GAP = 400;
    const FADE_DURATION = 900;

    scenes.forEach(scene => scene.classList.remove('show', 'hide'));

    const playScene = (index, delay) => {
        if (!scenes[index]) {
            setTimeout(() => {
                opening.classList.add('fade-out');
                setTimeout(() => {
                    opening.style.display = 'none';
                }, FADE_DURATION);
            }, END_GAP);
            return;
        }

        setTimeout(() => {
            const currentScene = scenes[index];
            currentScene.classList.add('show');

            setTimeout(() => {
                currentScene.classList.remove('show');
                currentScene.classList.add('hide');
            }, HOLD);

            setTimeout(() => {
                currentScene.classList.remove('hide');
                playScene(index + 1, 0);
            }, HOLD + TRANSITION);
        }, delay);
    };

    playScene(0, DELAY_START);
}

// 갤러리 초기화
function initGallery() {
    // 초기에는 4개만 보이도록 설정 (이미 HTML에서 gallery-item-hidden 클래스가 적용되어 있음)
    // 추가로 display 스타일도 설정
    const hiddenItems = document.querySelectorAll('.gallery-item-hidden');
    hiddenItems.forEach(item => {
        item.style.display = 'none';
    });
    
    // 갤러리 이미지 다운로드 방지
    preventGalleryImageDownload();
}

// 갤러리 이미지 다운로드 방지 함수
function preventGalleryImageDownload() {
    const galleryImages = document.querySelectorAll('.gallery-item img');
    const overlays = document.querySelectorAll('.gallery-image-overlay');
    
    // 오버레이에 이벤트 처리 (이미지 위에 투명 레이어로 터치 가로채기)
    overlays.forEach((overlay, index) => {
        const galleryItem = overlay.closest('.gallery-item');
        if (!galleryItem) return;
        
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        let isLongPress = false;
        let longPressTimer = null;
        
        // touchstart - 터치 시작
        overlay.addEventListener('touchstart', function(event) {
            touchStartTime = Date.now();
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isLongPress = false;
            
            // 멀티터치 방지
            if (event.touches.length > 1) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
            
            // 즉시 이벤트 전파 차단 (이미지로 전달되지 않도록)
            event.stopPropagation();
            
            // 길게 누르기 타이머 (100ms 후 - 매우 짧게 설정)
            longPressTimer = setTimeout(function() {
                isLongPress = true;
                // 진동으로 피드백 (지원되는 경우)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 100);
        }, { passive: false });
        
        // touchmove - 터치 이동 시 길게 누르기 취소
        overlay.addEventListener('touchmove', function(event) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            const touch = event.touches[0];
            const deltaX = Math.abs(touch.clientX - touchStartX);
            const deltaY = Math.abs(touch.clientY - touchStartY);
            
            // 10px 이상 움직이면 길게 누르기 취소
            if (deltaX > 10 || deltaY > 10) {
                isLongPress = false;
            }
        }, { passive: false });
        
        // touchend - 터치 종료
        overlay.addEventListener('touchend', function(event) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            const touchDuration = Date.now() - touchStartTime;
            
            // 길게 누르기로 판단되면 이벤트 완전 차단
            if (isLongPress || touchDuration > 100) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
            }
            
            // 매우 짧은 터치(클릭)만 부모 요소의 onclick으로 전달
            if (touchDuration < 100 && !isLongPress) {
                // 약간의 지연 후 클릭 이벤트 전달 (이미지 다운로드 메뉴가 나타나기 전에)
                setTimeout(function() {
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    galleryItem.dispatchEvent(clickEvent);
                }, 50);
            } else {
                // 길게 누른 경우 이벤트 차단
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
            }
        }, { passive: false });
        
        // contextmenu 방지
        overlay.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 포인터 이벤트 방지
        overlay.addEventListener('pointerdown', function(event) {
            if (event.pointerType === 'touch') {
                event.preventDefault();
            }
        }, { passive: false });
    });
    
    galleryImages.forEach(img => {
        // 우클릭 방지
        img.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 드래그 방지
        img.addEventListener('dragstart', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 이미지 선택 방지
        img.addEventListener('selectstart', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 복사 방지
        img.addEventListener('copy', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 이미지 속성 설정
        img.setAttribute('draggable', 'false');
        
        // CSS 스타일 강제 적용
        img.style.webkitTouchCallout = 'none';
        img.style.webkitUserSelect = 'none';
        img.style.userSelect = 'none';
        img.style.pointerEvents = 'auto';
        
        // 이미지 자체에서도 길게 누르기 방지
        let imgTouchStartTime = 0;
        img.addEventListener('touchstart', function(event) {
            imgTouchStartTime = Date.now();
            if (event.touches.length > 1) {
                event.preventDefault();
                return false;
            }
        }, { passive: false });
        
        img.addEventListener('touchend', function(event) {
            const touchDuration = Date.now() - imgTouchStartTime;
            if (touchDuration > 200) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, { passive: false });
    });
    
    // 갤러리 아이템 자체에도 이벤트 방지
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        // 아이폰에서 길게 누르기 방지
        let itemTouchStartTime = 0;
        item.addEventListener('touchstart', function(event) {
            itemTouchStartTime = Date.now();
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });
        
        item.addEventListener('touchend', function(event) {
            const touchDuration = Date.now() - itemTouchStartTime;
            if (touchDuration > 200) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, { passive: false });
        
        item.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            return false;
        }, false);
    });
    
    // 갤러리 영역 전체 우클릭 방지
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        galleryGrid.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 갤러리 그리드에서도 길게 누르기 방지
        let gridTouchStartTime = 0;
        galleryGrid.addEventListener('touchstart', function(event) {
            gridTouchStartTime = Date.now();
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });
        
        galleryGrid.addEventListener('touchend', function(event) {
            const touchDuration = Date.now() - gridTouchStartTime;
            if (touchDuration > 200) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, { passive: false });
    }
}

// 갤러리 더보기
function showMoreGallery() {
    const hiddenItems = document.querySelectorAll('.gallery-item-hidden');
    const moreBtn = document.getElementById('galleryMoreBtn');
    const fadeOverlay = document.getElementById('galleryFadeOverlay');
    
    // expanded 클래스로 상태 확인
    const isExpanded = moreBtn && moreBtn.classList.contains('expanded');
    
    if (!isExpanded) {
        // 숨겨진 항목들 표시 (더보기 → 접기)
        hiddenItems.forEach(item => {
            item.classList.remove('gallery-item-hidden');
            item.style.display = '';
        });
        if (moreBtn) {
            moreBtn.innerHTML = '접기 <img src="images/arrow.svg" alt="접기" class="gallery-more-arrow">';
            moreBtn.classList.add('expanded');
        }
        // 그라데이션 오버레이 숨기기
        if (fadeOverlay) {
            fadeOverlay.classList.add('hidden');
        }
        // 새로 표시된 이미지에도 보호 적용
        preventGalleryImageDownload();
    } else {
        // 다시 숨기기 (접기 → 더보기)
        const allItems = document.querySelectorAll('.gallery-item');
        allItems.forEach((item, index) => {
            if (index >= 4) { // 5번째부터 (0-based index 4)
                item.classList.add('gallery-item-hidden');
                item.style.display = 'none';
            }
        });
        if (moreBtn) {
            moreBtn.innerHTML = '더보기 <img src="images/arrowdown.svg" alt="더보기" class="gallery-more-arrow">';
            moreBtn.classList.remove('expanded');
        }
        // 그라데이션 오버레이 다시 표시
        if (fadeOverlay) {
            fadeOverlay.classList.remove('hidden');
        }
    }
}

// 스크롤 애니메이션
function initScrollAnimation() {
    const sections = document.querySelectorAll('section');
    const greetingContent = document.querySelector('.greeting-content');

    // greeting-content 스크롤 애니메이션
    if (greetingContent) {
        const greetingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        });

        greetingObserver.observe(greetingContent);
    }

    // 다른 섹션들 스크롤 애니메이션
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// 이미지 갤러리 모달
function openModal(index) {
    currentImageIndex = index;
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    if (galleryImages && galleryImages[index]) {
        modalImg.src = galleryImages[index];
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 모바일 이미지 확대 방지
    preventImageZoom(modal);
    
    // 이미지 캡처 방지
    preventImageCapture(modal, modalImg);
}

// 모바일 이미지 확대 방지 함수
function preventImageZoom(modal) {
    let lastTouchEnd = 0;
    
    // 더블탭 줌 방지
    modal.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // 핀치 줌 방지
    modal.addEventListener('touchmove', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // 이미지 드래그 방지
    const modalImg = document.getElementById('modalImage');
    if (modalImg) {
        modalImg.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });
        
        modalImg.addEventListener('gesturestart', function(event) {
            event.preventDefault();
        });
        
        modalImg.addEventListener('gesturechange', function(event) {
            event.preventDefault();
        });
        
        modalImg.addEventListener('gestureend', function(event) {
            event.preventDefault();
        });
    }
}

// 이미지 캡처 방지 함수
function preventImageCapture(modal, modalImg) {
    // 우클릭 방지
    modal.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        return false;
    }, false);
    
    // 이미지 우클릭 방지
    if (modalImg) {
        modalImg.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 이미지 드래그 방지
        modalImg.addEventListener('dragstart', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 이미지 선택 방지
        modalImg.addEventListener('selectstart', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 이미지 복사 방지
        modalImg.addEventListener('copy', function(event) {
            event.preventDefault();
            return false;
        }, false);
        
        // 아이폰에서 길게 누르기 방지
        let modalTouchStartTime = 0;
        modalImg.addEventListener('touchstart', function(event) {
            modalTouchStartTime = Date.now();
            if (event.touches.length > 1) {
                event.preventDefault();
                return false;
            }
        }, { passive: false });
        
        modalImg.addEventListener('touchend', function(event) {
            const touchDuration = Date.now() - modalTouchStartTime;
            // 200ms 이상 길게 누르면 방지
            if (touchDuration > 200) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, { passive: false });
        
        modalImg.addEventListener('touchmove', function(event) {
            modalTouchStartTime = 0;
        }, { passive: false });
        
        // 포인터 이벤트로 길게 누르기 방지 (iOS 13+)
        modalImg.addEventListener('pointerdown', function(event) {
            if (event.pointerType === 'touch') {
                event.preventDefault();
            }
        }, { passive: false });
        
        // CSS 스타일 강제 적용
        modalImg.style.webkitTouchCallout = 'none';
        modalImg.style.webkitUserSelect = 'none';
        modalImg.style.userSelect = 'none';
    }
    
    // 모달 전체에서도 길게 누르기 방지
    let modalTouchStartTime = 0;
    modal.addEventListener('touchstart', function(event) {
        modalTouchStartTime = Date.now();
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    modal.addEventListener('touchend', function(event) {
        const touchDuration = Date.now() - modalTouchStartTime;
        if (touchDuration > 200) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, { passive: false });
    
    // 키보드 단축키 방지 (F12, Ctrl+S, Ctrl+P 등)
    modal.addEventListener('keydown', function(event) {
        // F12 (개발자 도구)
        if (event.key === 'F12') {
            event.preventDefault();
            return false;
        }
        // Ctrl+S (저장)
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            return false;
        }
        // Ctrl+P (인쇄)
        if (event.ctrlKey && event.key === 'p') {
            event.preventDefault();
            return false;
        }
        // Ctrl+Shift+I (개발자 도구)
        if (event.ctrlKey && event.shiftKey && event.key === 'I') {
            event.preventDefault();
            return false;
        }
        // Ctrl+Shift+C (요소 검사)
        if (event.ctrlKey && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            return false;
        }
        // Ctrl+Shift+J (콘솔)
        if (event.ctrlKey && event.shiftKey && event.key === 'J') {
            event.preventDefault();
            return false;
        }
        // Ctrl+U (소스 보기)
        if (event.ctrlKey && event.key === 'u') {
            event.preventDefault();
            return false;
        }
    }, false);
    
    // 탭 전환 감지 (다른 앱으로 전환 시 모달 닫기 및 이미지 숨기기)
    const handleVisibilityChange = function() {
        if (document.hidden) {
            // 즉시 이미지를 숨기거나 블러 처리
            if (modalImg) {
                modalImg.style.opacity = '0';
                modalImg.style.filter = 'blur(20px)';
            }
            // 짧은 지연 후 모달 닫기
            setTimeout(function() {
                closeModal();
            }, 100);
        } else {
            // 다시 보일 때 이미지 복원
            if (modalImg) {
                modalImg.style.opacity = '1';
                modalImg.style.filter = 'none';
            }
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 창 포커스 잃음 감지 (모바일에서 앱 전환 시)
    const handleBlur = function() {
        if (modalImg) {
            modalImg.style.opacity = '0';
            modalImg.style.filter = 'blur(20px)';
        }
        setTimeout(function() {
            closeModal();
        }, 100);
    };
    window.addEventListener('blur', handleBlur);
    
    // 페이지 언로드 시 이미지 숨기기
    const handleBeforeUnload = function() {
        if (modalImg) {
            modalImg.style.opacity = '0';
            modalImg.style.filter = 'blur(20px)';
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 페이지 숨김 감지 (iOS Safari 등)
    const handlePageHide = function() {
        if (modalImg) {
            modalImg.style.opacity = '0';
            modalImg.style.filter = 'blur(20px)';
        }
        closeModal();
    };
    window.addEventListener('pagehide', handlePageHide);
    
    // 개발자 도구 감지 시도 (간단한 방법)
    let devtools = {open: false, orientation: null};
    const threshold = 160;
    setInterval(function() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                closeModal();
            }
        } else {
            if (devtools.open) {
                devtools.open = false;
            }
        }
    }, 500);
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function changeImage(direction) {
    currentImageIndex += direction;

    if (currentImageIndex < 0) {
        currentImageIndex = totalImages - 1;
    } else if (currentImageIndex >= totalImages) {
        currentImageIndex = 0;
    }

    const modalImg = document.getElementById('modalImage');
    if (galleryImages && galleryImages[currentImageIndex]) {
        modalImg.src = galleryImages[currentImageIndex];
    }
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// 지도 앱 열기
function openKakaoMap() {
    // 실제 장소 좌표로 변경하세요
    const placeName = '순천아모르웨딩컨벤션';
    const url = `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`;
    window.open(url, '_blank');
}

function openNaverMap() {
    // 순천아모르웨딩컨벤션
    const placeName = '순천아모르웨딩컨벤션';
    const address = '전남 순천시 서면 압곡길 94';
    const url = `https://map.naver.com/v5/search/${encodeURIComponent(placeName)}`;
    window.open(url, '_blank');
}

function openTmap() {
    // 구글 지도로 변경 (티맵 대체)
    const placeName = '순천아모르웨딩컨벤션';
    const address = '전남 순천시 서면 압곡길 94';

    // 구글 지도 검색 URL (모바일/PC 모두 작동)
    const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`;
    window.open(googleMapUrl, '_blank');
}

function openKakaoNavi() {
    // 순천아모르웨딩컨벤션 좌표
    const placeName = '순천아모르웨딩컨벤션';
    const latitude = 34.982261;  // 위도
    const longitude = 127.518579; // 경도
    // 카카오내비 앱 스킴 (좌표로 목적지 설정)
    const kakaoNaviUrl = `kakaomap://route?ep=${latitude},${longitude}&by=CAR`;

    // 앱 스킴 시도
    window.location.href = kakaoNaviUrl;

    // 1초 후 앱이 안 열리면 카카오맵 웹으로 폴백
    setTimeout(() => {
        window.open(`https://map.kakao.com/link/to/${encodeURIComponent(placeName)},${latitude},${longitude}`, '_blank');
    }, 1000);
}

function viewMapImage() {
    // 약도 이미지를 모달로 표시
    const mapImagePath = 'images/map-guide.jpg'; // 약도 이미지 경로

    // 이미지 존재 확인을 위해 시도
    const img = new Image();
    img.onload = function() {
        // 이미지가 존재하면 갤러리 모달 활용
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');

        modalImg.src = mapImagePath;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };
    img.onerror = function() {
        // 이미지가 없으면 토스트 메시지
        showToast('약도 이미지를 준비 중입니다');
    };
    img.src = mapImagePath;
}

// 계좌 섹션 토글
function toggleAccountSection(type) {
    const content = document.getElementById(type + 'Content');
    const arrow = document.getElementById(type + 'Arrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.classList.add('open');
    } else {
        content.style.display = 'none';
        arrow.classList.remove('open');
    }
}

// 계좌번호 복사
function copyAccount(bankName, accountNumber) {
    const accountInfo = `${bankName} ${accountNumber}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(accountInfo).then(() => {
            showToast('계좌정보가 복사되었습니다');
        }).catch(err => {
            console.error('복사 실패:', err);
            fallbackCopy(accountInfo);
        });
    } else {
        fallbackCopy(accountInfo);
    }
}

// 구형 브라우저용 복사 함수
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        showToast('계좌정보가 복사되었습니다');
    } catch (err) {
        showToast('복사에 실패했습니다');
    }

    document.body.removeChild(textArea);
}

// 카카오페이 송금하기
function sendKakaoPay(bankName, accountNumber, accountHolder) {
    // 계좌정보 복사
    const accountInfo = `${bankName} ${accountNumber}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(accountInfo).then(() => {
            showToast('계좌정보가 복사되었습니다');
        }).catch(err => {
            console.error('복사 실패:', err);
        });
    }

    // 카카오페이 앱 실행
    // 카카오톡 > 더보기 > Pay > 송금 화면으로 이동
    const kakaoPayUrl = 'kakaotalk://kakaopay/home';

    // 앱 실행 시도
    const appOpenAttempt = window.open(kakaoPayUrl, '_self');

    // 앱이 안 열릴 경우 대비
    setTimeout(() => {
        if (!document.hidden) {
            // 앱이 실행되지 않은 경우
            if (confirm(`${accountInfo}\n${accountHolder}\n\n계좌정보가 복사되었습니다.\n카카오페이를 실행하시겠습니까?`)) {
                // 카카오톡 실행 (카카오페이는 카카오톡 안에 있음)
                window.location.href = 'kakaotalk://';
            }
        }
    }, 500);
}

// 방명록 관련 함수
function focusGuestbook() {
    showGuestbookForm();
}

function showGuestbookForm() {
    const form = document.getElementById('guestbookForm');
    const submitButton = document.getElementById('guestbookSubmitBtn');

    if (form) {
        const isHidden = form.style.display === 'none';
        form.style.display = isHidden ? 'block' : 'none';

        // 새로 작성할 때는 수정 모드 해제 및 버튼 텍스트 원래대로
        if (isHidden) {
            editingMessageId = null;
            if (submitButton) {
                submitButton.textContent = '메시지 남기기';
            }
            // 입력 필드 초기화
            const nameInput = document.getElementById('guestName');
            const passwordInput = document.getElementById('guestPassword');
            const messageInput = document.getElementById('guestMessage');
            if (nameInput) nameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (messageInput) messageInput.value = '';
        }
    }
}

function closeGuestbookForm() {
    const form = document.getElementById('guestbookForm');
    const submitButton = document.getElementById('guestbookSubmitBtn');

    if (form) {
        form.style.display = 'none';
    }
    if (submitButton) {
        submitButton.textContent = '메시지 남기기';
    }
    editingMessageId = null;
}


// 방명록 메시지 저장 및 불러오기 (Firebase)
async function submitMessage() {
    const nameInput = document.getElementById('guestName');
    const passwordInput = document.getElementById('guestPassword');
    const messageInput = document.getElementById('guestMessage');

    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();
    const message = messageInput.value.trim();

    if (!name) {
        showToast('이름을 입력해주세요');
        return;
    }

    if (!password) {
        showToast('비밀번호를 입력해주세요');
        return;
    }

    if (!message) {
        showToast('메시지를 입력해주세요');
        return;
    }

    const { collection, addDoc, updateDoc, doc } = window.firestoreModules;

    try {
        // 수정 모드인 경우
        if (editingMessageId !== null) {
            const messageRef = doc(window.db, 'guestbook', editingMessageId);
            await updateDoc(messageRef, {
                name: name,
                password: password,
                message: message
            });
            editingMessageId = null;
            showToast('메시지가 수정되었습니다');
        } else {
            // 새 메시지 작성
            const messageData = {
                name: name,
                password: password,
                message: message,
                date: new Date().toISOString()
            };
            await addDoc(collection(window.db, 'guestbook'), messageData);
            showToast('메시지가 등록되었습니다');
        }

        // 입력 필드 초기화
        nameInput.value = '';
        passwordInput.value = '';
        messageInput.value = '';

        // 폼 숨기기 및 버튼 텍스트 원래대로
        const form = document.getElementById('guestbookForm');
        const submitButton = document.getElementById('guestbookSubmitBtn');
        if (form) {
            form.style.display = 'none';
        }
        if (submitButton) {
            submitButton.textContent = '메시지 남기기';
        }
        editingMessageId = null;
    } catch (error) {
        console.error('메시지 저장 오류:', error);
        showToast('메시지 저장에 실패했습니다');
    }
}

// Firebase에서 실시간으로 메시지 불러오기
function loadMessages() {
    const { collection, query, orderBy, onSnapshot } = window.firestoreModules;
    const messageList = document.getElementById('messageList');
    const moreContainer = document.getElementById('guestbookMoreContainer');
    const emptyBox = document.getElementById('guestbookEmptyBox');

    if (!window.db) {
        console.error('Firebase가 초기화되지 않았습니다');
        return;
    }

    // 실시간 리스너 설정 (날짜 내림차순)
    const q = query(collection(window.db, 'guestbook'), orderBy('date', 'desc'));

    onSnapshot(q, (snapshot) => {
        window.allMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const messages = window.allMessages;

        if (messages.length === 0) {
            messageList.innerHTML = '';
            if (moreContainer) {
                moreContainer.style.display = 'none';
            }
            if (emptyBox) {
                emptyBox.style.display = 'flex';
            }
            return;
        }

        if (emptyBox) {
            emptyBox.style.display = 'none';
        }

        // 표시할 메시지 개수 결정
        const messagesToShow = messages.slice(0, displayedMessageCount);
        const hasMore = messages.length > displayedMessageCount;

        messageList.innerHTML = messagesToShow.map((msg) => {
            const date = new Date(msg.date);
            const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            const messageContent = escapeHtml(msg.message);
            const name = escapeHtml(msg.name);

            return `
                <div class="message-item">
                    <div class="message-top">
                        <span class="message-name">${name}</span>
                        <div class="message-buttons">
                            <span class="message-edit" onclick="editMessage('${msg.id}')">✎</span>
                            <span class="message-close" onclick="deleteMessage('${msg.id}')">×</span>
                        </div>
                    </div>
                    <div class="message-content">${messageContent}</div>
                </div>
            `;
        }).join('');

        // 더보기/접기 버튼 표시/숨김
        if (moreContainer) {
            const moreBtn = document.getElementById('guestbookMoreBtn');
            if (hasMore || displayedMessageCount >= messages.length) {
                moreContainer.style.display = 'block';
                if (moreBtn) {
                    if (displayedMessageCount >= messages.length && messages.length > 3) {
                        moreBtn.innerHTML = '접기 <img src="images/arrow.svg" alt="접기" class="guestbook-more-arrow">';
                        moreBtn.classList.add('expanded');
                    } else {
                        moreBtn.innerHTML = '더보기 <img src="images/arrowdown.svg" alt="더보기" class="guestbook-more-arrow">';
                        moreBtn.classList.remove('expanded');
                    }
                }
            } else {
                moreContainer.style.display = 'none';
            }
        }
    });
}

// 더보기 기능
function showMoreMessages() {
    const messages = window.allMessages || [];
    const moreBtn = document.getElementById('guestbookMoreBtn');

    // 현재 모든 메시지가 표시되고 있는지 확인
    if (displayedMessageCount >= messages.length) {
        // 접기: 다시 3개만 표시
        displayedMessageCount = 3;
        if (moreBtn) {
            moreBtn.innerHTML = '더보기 <img src="images/arrowdown.svg" alt="더보기" class="guestbook-more-arrow">';
            moreBtn.classList.remove('expanded');
        }
    } else {
        // 더보기: 모든 메시지 표시
        displayedMessageCount = messages.length;
        if (moreBtn) {
            moreBtn.innerHTML = '접기 <img src="images/arrow.svg" alt="접기" class="guestbook-more-arrow">';
            moreBtn.classList.add('expanded');
        }
    }

    // 다시 렌더링 (onSnapshot이 자동으로 처리하지만 즉시 반영을 위해)
    loadMessages();
}

// 방명록 삭제 (Firebase)
async function deleteMessage(messageId) {
    const messages = window.allMessages || [];
    const message = messages.find(m => m.id === messageId);

    if (!message) {
        showToast('메시지를 찾을 수 없습니다');
        return;
    }

    // 비밀번호 확인
    const password = prompt('비밀번호를 입력해주세요:');

    if (password === null) {
        return;
    }

    if (password !== message.password) {
        showToast('비밀번호가 일치하지 않습니다');
        return;
    }

    // 비밀번호가 맞으면 삭제
    const { deleteDoc, doc } = window.firestoreModules;

    try {
        await deleteDoc(doc(window.db, 'guestbook', messageId));
        showToast('메시지가 삭제되었습니다');
    } catch (error) {
        console.error('삭제 오류:', error);
        showToast('메시지 삭제에 실패했습니다');
    }
}

// 방명록 수정 (Firebase)
function editMessage(messageId) {
    const messages = window.allMessages || [];
    const message = messages.find(m => m.id === messageId);

    if (!message) {
        showToast('메시지를 찾을 수 없습니다');
        return;
    }

    // 비밀번호 확인
    const password = prompt('비밀번호를 입력해주세요:');

    if (password === null) {
        return;
    }

    if (password !== message.password) {
        showToast('비밀번호가 일치하지 않습니다');
        return;
    }

    // 비밀번호가 맞으면 수정 폼 표시
    const nameInput = document.getElementById('guestName');
    const passwordInput = document.getElementById('guestPassword');
    const messageInput = document.getElementById('guestMessage');
    const form = document.getElementById('guestbookForm');
        const submitButton = document.getElementById('guestbookSubmitBtn');

    if (nameInput && passwordInput && messageInput && form) {
        nameInput.value = message.name;
        passwordInput.value = message.password;
        messageInput.value = message.message;

        // 수정 모드로 설정 (messageId 저장)
        editingMessageId = messageId;

        // 버튼 텍스트 변경
        if (submitButton) {
            submitButton.textContent = '메시지 수정하기';
        }

        form.style.display = 'block';

        // 폼이 보이도록 스크롤
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// XSS 방지를 위한 HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// 토스트 메시지 표시
function showToast(message) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 3초 후 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// D-Day 계산 (필요시 사용)
function calculateDday(targetDate) {
    const today = new Date();
    const target = new Date(targetDate);
    const diff = target - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
        return `D-${days}`;
    } else if (days === 0) {
        return 'D-Day';
    } else {
        return `D+${Math.abs(days)}`;
    }
}

// 부드러운 스크롤
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// 모바일 터치 스와이프로 갤러리 이미지 넘기기
let touchStartX = 0;
let touchEndX = 0;

document.getElementById('imageModal').addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.getElementById('imageModal').addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        changeImage(1); // 왼쪽으로 스와이프 - 다음 이미지
    }
    if (touchEndX > touchStartX + 50) {
        changeImage(-1); // 오른쪽으로 스와이프 - 이전 이미지
    }
}

// 이미지 프리로드 (성능 향상)
function preloadImages() {
    if (galleryImages) {
        galleryImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
}

// 페이지 로드 완료 후 이미지 프리로드
window.addEventListener('load', preloadImages);

// 사진 업로드 - 구글 폼으로 이동
function openPhotoForm() {
    const jotformUrl = 'https://form.jotform.com/253282846407058';
    window.open(jotformUrl, '_blank');
}

// 달력 생성
function initCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    // 2026년 1월 달력 생성
    const year = 2026;
    const month = 0; // 1월 (0부터 시작)
    const weddingDay = 11;

    // 해당 월의 첫 번째 날짜
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0(일요일) ~ 6(토요일)
    const daysInMonth = lastDay.getDate();

    // 이전 달의 마지막 날짜들
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    calendarGrid.innerHTML = '';

    // 이전 달의 날짜들 (빈 칸 채우기)
    for (let i = startDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonthLastDay - i;
        calendarGrid.appendChild(day);
    }

    // 현재 달의 날짜들
    for (let date = 1; date <= daysInMonth; date++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        if (date === weddingDay) {
            day.classList.add('wedding-day');
        }
        day.textContent = date;
        calendarGrid.appendChild(day);
    }

    // 다음 달의 날짜들 (달력 완성)
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6주 * 7일 = 42
    for (let date = 1; date <= remainingCells; date++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = date;
        calendarGrid.appendChild(day);
    }
}

// 카운트다운 타이머
function initCountdown() {
    const countdownDays = document.getElementById('countdownDays');
    const countdownHours = document.getElementById('countdownHours');
    const countdownMinutes = document.getElementById('countdownMinutes');
    const countdownSeconds = document.getElementById('countdownSeconds');
    const weddingDayCount = document.getElementById('weddingDayCount');
    
    if (!countdownDays || !countdownHours || !countdownMinutes || !countdownSeconds) return;

    // 결혼식 날짜: 2026년 1월 11일 오전 11시
    const weddingDate = new Date('2026-01-11T11:00:00');
    
    function updateCountdown() {
        const now = new Date();
        const diff = weddingDate - now;

        if (diff <= 0) {
            countdownDays.textContent = '00';
            countdownHours.textContent = '00';
            countdownMinutes.textContent = '00';
            countdownSeconds.textContent = '00';
            if (weddingDayCount) {
                weddingDayCount.textContent = '1';
            }
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownDays.textContent = String(days).padStart(2, '0');
        countdownHours.textContent = String(hours).padStart(2, '0');
        countdownMinutes.textContent = String(minutes).padStart(2, '0');
        countdownSeconds.textContent = String(seconds).padStart(2, '0');
        
        // 날짜 메시지 업데이트
        if (weddingDayCount) {
            weddingDayCount.textContent = days + 1;
        }
    }

    // 즉시 업데이트
    updateCountdown();

    // 1초마다 업데이트
    setInterval(updateCountdown, 1000);
}

// 네이버 지도 초기화
function initNaverMap() {
    // 네이버 지도 API가 로드되었는지 확인
    if (typeof naver === 'undefined') {
        console.error('네이버 지도 API가 로드되지 않았습니다.');
        return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('지도 요소를 찾을 수 없습니다.');
        return;
    }

    // 순천아모르웨딩컨벤션 좌표 (전남 순천시 서면 압곡길 94)
    // 좌표: 위도(latitude), 경도(longitude) 순서
    const weddingLocation = new naver.maps.LatLng(34.982261, 127.518579);

    // 지도 옵션
    const mapOptions = {
        center: weddingLocation,
        zoom: 16,
        zoomControl: true,
        zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT
        }
    };

    // 지도 생성
    const map = new naver.maps.Map('map', mapOptions);

    // 마커 생성
    const marker = new naver.maps.Marker({
        position: weddingLocation,
        map: map,
        title: '순천아모르웨딩컨벤션'
    });

    // 정보창 내용
    const contentString = [
        '<div style="padding:10px;min-width:200px;line-height:1.5;">',
        '   <h4 style="margin:0 0 10px 0;font-size:16px;font-weight:bold;">순천아모르웨딩컨벤션</h4>',
        '   <p style="margin:0;font-size:13px;color:#666;">전남 순천시 서면 압곡길 94</p>',
        '   <p style="margin:5px 0 0 0;font-size:13px;color:#666;">Tel. 061-752-1000</p>',
        '</div>'
    ].join('');

    // 정보창 생성
    const infowindow = new naver.maps.InfoWindow({
        content: contentString
    });

    // 마커 클릭 시 정보창 표시
    naver.maps.Event.addListener(marker, 'click', function() {
        if (infowindow.getMap()) {
            infowindow.close();
        } else {
            infowindow.open(map, marker);
        }
    });

    // 기본으로 정보창 열어두기
    infowindow.open(map, marker);
}

// ============================================
// 카카오톡 공유하기
// ============================================

// Kakao SDK 초기화
if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
    Kakao.init('ae248ad0c8a6030638d1be0d2a3a49fd');
    console.log('Kakao SDK 초기화 완료:', Kakao.isInitialized());
}

// 카카오톡 공유하기 함수 (sendCustom 방식)
function shareKakao() {
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        showToast('카카오톡 공유 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    // 카카오 메시지 템플릿 ID
    const TEMPLATE_ID = 127857;

    Kakao.Share.sendCustom({
        templateId: TEMPLATE_ID
    });
}

// 링크 복사하기 함수
function copyLink() {
    const currentUrl = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(currentUrl).then(() => {
            showToast('링크가 복사되었습니다');
        }).catch(err => {
            console.error('복사 실패:', err);
            fallbackCopyLink(currentUrl);
        });
    } else {
        fallbackCopyLink(currentUrl);
    }
}

// 구형 브라우저용 링크 복사 함수
function fallbackCopyLink(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        showToast('링크가 복사되었습니다');
    } catch (err) {
        showToast('링크 복사에 실패했습니다');
    }

    document.body.removeChild(textArea);
}
