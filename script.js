// ==================== Elementor Sticky 방식 원형 흐름 ====================
class CircleFlow {
    constructor() {
        this.wrapper = document.getElementById('circleFlowWrapper');
        this.container = document.getElementById('circleFlowSection');
        
        if (!this.container || !this.wrapper) {
            return;
        }

        this.cards = Array.from(this.container.querySelectorAll('.flow-card'));
        this.totalSteps = this.cards.length;
        this.currentStep = 1;
        this.isActive = false;
        this.targetStep = 1;
        this.isSnapping = false;
        this.lastScrollTime = Date.now();
        this.scrollVelocity = 0;
        this.lastProgress = 0;
        this.scrollTimeout = null;
        this.wheelTimeout = null;
        this.lastWheelTime = 0;
        this.lastResizeWidth = window.innerWidth; // resize 감지용
        
        this.init();
    }

    init() {
        const isMobile = window.innerWidth <= 768; // 768px 이하에서만 가로 스크롤 (모바일)
        
        if (isMobile) {
            // ===== 모바일 전용: mobile-cards.js가 처리 =====
            return;
        } else {
            // ===== PC & 태블릿: 기존 세로 스크롤 로직 =====
            this.updateCardAnimations(1.0);
            this.updateProgressIndicator();
            
            // 휠 이벤트 리스너 추가
            window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
            
            // 터치 이벤트 리스너 추가
            this.touchStartY = 0;
            this.touchStartTime = 0;
            this.lastTouchEndTime = 0;
            window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
            window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            
            // 스크롤 이벤트 리스너
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            
            // 초기 체크
            setTimeout(() => this.handleScroll(), 100);
        }
        
        window.addEventListener('resize', () => this.handleResize());

        // 네비게이션 버튼
        const skipBtn = document.getElementById('skipBtn2');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipToNextSection());
        }
        
        const skipBtnPrev = document.getElementById('skipBtnPrev');
        if (skipBtnPrev) {
            skipBtnPrev.addEventListener('click', () => this.skipToPrevSection());
        }
    }
    
    handleTouchStart(e) {
        const isMobile = window.innerWidth <= 768;
        // 모바일에서는 터치 이벤트를 사용하지 않음 (자연스러운 스크롤)
        if (isMobile) return;
        
        // 애니메이션 중이거나 섹션이 비활성화되면 무시
        if (this.isSnapping || !this.isActive) return;
        
        const wrapperRect = this.wrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // 섹션이 활성화된 범위 내에서만 터치 감지
        if (wrapperRect.top <= 0 && wrapperRect.bottom > viewportHeight) {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
        }
    }
    
    handleTouchEnd(e) {
        const isMobile = window.innerWidth <= 768;
        // 모바일에서는 터치 이벤트를 사용하지 않음 (자연스러운 스크롤)
        if (isMobile) return;
        
        // 애니메이션 중이거나 섹션이 비활성화되면 무시
        if (this.isSnapping || !this.isActive) return;
        
        // 더블 터치 방지: 200ms 내 연속 터치 무시
        const now = Date.now();
        if (now - this.lastTouchEndTime < 200) {
            return;
        }
        
        const wrapperRect = this.wrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const wrapperHeight = this.wrapper.offsetHeight;
        
        // 섹션이 활성화된 범위 내에서만 처리
        if (wrapperRect.top <= 0 && wrapperRect.bottom > viewportHeight) {
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = this.touchStartY - touchEndY;
            
            // Threshold: 최소 30px 이동만 감지 (너무 작은 터치는 무시)
            if (Math.abs(deltaY) < 30) {
                return;
            }
            
            // 마지막 터치 시간 기록
            this.lastTouchEndTime = now;
            
            // ===== 모바일 핵심 로직: 방향만 감지, 크기는 완전 무시 =====
            // 한 번의 터치 = 무조건 한 단계만 이동
            // deltaY 값의 크기(100px, 500px, 1000px)는 결과에 영향 없음
            
            if (deltaY > 0) {
                // 위로 스와이프 (아래로 스크롤 의도)
                if (this.currentStep < this.totalSteps) {
                    // 다음 카드로 한 단계만 이동
                    e.preventDefault();
                    this.snapToStep(this.currentStep + 1);
                } else if (this.currentStep === this.totalSteps) {
                    // 마지막 카드 → 다음 섹션으로 자연스럽게 스크롤
                    e.preventDefault();
                    const targetScroll = this.wrapper.offsetTop + wrapperHeight - viewportHeight + 100;
                    window.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                }
            } else if (deltaY < 0) {
                // 아래로 스와이프 (위로 스크롤 의도)
                if (this.currentStep > 1) {
                    // 이전 카드로 한 단계만 이동
                    e.preventDefault();
                    this.snapToStep(this.currentStep - 1);
                } else if (this.currentStep === 1) {
                    // 첫 카드 → 이전 섹션으로 자연스럽게 벗어남 (preventDefault 없음)
                    return;
                }
            }
        }
    }
    
    handleWheel(e) {
        const isMobile = window.innerWidth <= 768;
        // 모바일에서는 휠 이벤트를 사용하지 않음 (자연스러운 스크롤)
        if (isMobile) return;
        
        if (this.isSnapping) return;
        
        // 디바운싱: 빠른 연속 스크롤 방지 (250ms 내 중복 입력 차단)
        const now = Date.now();
        if (now - this.lastWheelTime < 250) {
            e.preventDefault();
            return;
        }
        
        const wrapperRect = this.wrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const wrapperHeight = this.wrapper.offsetHeight;
        
        // 스크롤 방향 감지
        const delta = e.deltaY;
        
        // 섹션이 활성화된 범위인지 확인
        if (wrapperRect.top <= 0 && wrapperRect.bottom > viewportHeight) {
            // 작은 스크롤도 감지 (민감도 증가)
            if (Math.abs(delta) > 5) {
                let targetStep = this.currentStep;
                
                if (delta > 0 && this.currentStep < this.totalSteps) {
                    // 아래로 스크롤 -> 다음 카드
                    e.preventDefault();
                    this.lastWheelTime = now;
                    targetStep = this.currentStep + 1;
                    this.snapToStep(targetStep);
                } else if (delta < 0 && this.currentStep > 1) {
                    // 위로 스크롤 -> 이전 카드
                    e.preventDefault();
                    this.lastWheelTime = now;
                    targetStep = this.currentStep - 1;
                    this.snapToStep(targetStep);
                } else if (delta < 0 && this.currentStep === 1) {
                    // 첫 카드에서 위로 -> 이전 섹션으로 (자연스럽게 벗어남)
                    // preventDefault 하지 않음
                    return;
                } else if (delta > 0 && this.currentStep === this.totalSteps) {
                    // 마지막 카드에서 아래로 -> 강제로 섹션 끝으로 스크롤
                    e.preventDefault();
                    this.lastWheelTime = now;
                    const targetScroll = this.wrapper.offsetTop + wrapperHeight - viewportHeight + 100;
                    window.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                    return;
                }
            }
        }
    }

    handleScroll() {
        if (!this.wrapper || !this.container) return;
        
        const isMobile = window.innerWidth <= 768;
        
        // ===== 모바일: 아무것도 하지 않음 (IntersectionObserver가 처리) =====
        if (isMobile) {
            return;
        }
        
        // ===== PC: 기존 로직 그대로 유지 + 네비게이션 제어 추가 =====
        const navbar = document.querySelector('.navbar');
        const wrapperRect = this.wrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const wrapperHeight = this.wrapper.offsetHeight;
        const wrapperTop = wrapperRect.top;
        const wrapperBottom = wrapperRect.bottom;
        
        if (wrapperTop <= 0 && wrapperBottom > viewportHeight) {
            // Fixed 상태 활성화
            this.isActive = true;
            this.container.style.position = 'fixed';
            this.container.style.top = '0';
            
            // 네비게이션 보이기
            if (navbar) {
                navbar.style.transform = 'translateY(0)';
                navbar.style.transition = 'transform 0.3s ease';
            }
            
            // 진행 인디케이터와 스킵 버튼 보이기
            const progressIndicator = this.container.querySelector('.progress-indicator');
            if (progressIndicator) {
                progressIndicator.style.opacity = '1';
                progressIndicator.style.pointerEvents = 'auto';
            }
            
            // 스냅 중이 아닐 때만 현재 카드 상태 유지
            if (!this.isSnapping) {
                // 현재 단계에 해당하는 카드 애니메이션만 표시
                this.updateCardAnimations(this.currentStep);
            }
            
        } else if (wrapperBottom <= viewportHeight) {
            // 섹션이 끝나면 fixed 해제 + 네비게이션 숨김
            this.isActive = false;
            this.container.style.position = 'absolute';
            this.container.style.top = (wrapperHeight - viewportHeight) + 'px';
            
            // 네비게이션 숨기기 (PC에서만)
            if (navbar && !isMobile) {
                navbar.style.transform = 'translateY(-100%)';
                navbar.style.transition = 'transform 0.3s ease';
            }
            
            // 진행 인디케이터와 스킵 버튼 숨기기
            const progressIndicator = this.container.querySelector('.progress-indicator');
            if (progressIndicator) {
                progressIndicator.style.opacity = '0';
                progressIndicator.style.pointerEvents = 'none';
            }
        } else if (wrapperTop > 0) {
            // 섹션 시작 전
            this.isActive = false;
            this.container.style.position = 'absolute';
            this.container.style.top = '0';
            this.currentStep = 1;
            this.updateCardAnimations(1.0);
            this.updateProgressIndicator();
            
            // 네비게이션 보이기
            if (navbar) {
                navbar.style.transform = 'translateY(0)';
                navbar.style.transition = 'transform 0.3s ease';
            }
            
            // 진행 인디케이터와 스킵 버튼 보이기
            const progressIndicator = this.container.querySelector('.progress-indicator');
            if (progressIndicator) {
                progressIndicator.style.opacity = '1';
                progressIndicator.style.pointerEvents = 'auto';
            }
        }
    }
    
    snapToStep(step) {
        // 애니메이션 중에는 절대 실행 안 함 (이중 lock)
        if (this.isSnapping) return;
        
        // 이미 해당 단계면 스냅하지 않음
        if (step === this.currentStep) return;
        
        // Lock 활성화 (애니메이션 시작)
        this.isSnapping = true;
        
        // 애니메이션으로 카드 전환
        const startStep = this.currentStep;
        const startTime = performance.now();
        const duration = 350; // 0.35초 애니메이션 (더 빠르게)
        
        // 즉시 단계 업데이트 (스크롤 위치 동기화)
        this.currentStep = step;
        this.updateProgressIndicator();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // easeOutCubic 이징 (시작은 빠르게, 끝은 부드럽게)
            const eased = 1 - Math.pow(1 - progress, 3);
            
            const currentStepFloat = startStep + (step - startStep) * eased;
            this.updateCardAnimations(currentStepFloat);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 애니메이션 완료 - 최종 상태 보장
                this.updateCardAnimations(step);
                
                // Lock 해제 (새로운 입력 허용)
                this.isSnapping = false;
            }
        };
        
        requestAnimationFrame(animate);
    }

    handleResize() {
        const currentWidth = window.innerWidth;
        const wasSmallScreen = this.lastResizeWidth <= 1024;
        const nowSmallScreen = currentWidth <= 1024;
        
        // 1024px 기준으로 가로 스크롤 ↔ 세로 스크롤 전환 시 새로고침
        if (wasSmallScreen !== nowSmallScreen) {
            if (!wasSmallScreen && nowSmallScreen) {
                // 큰 화면 → 작은 화면 전환
            } else {
                // 작은 화면 → 큰 화면 전환
            }
            window.location.reload();
            return;
        }
        
        // 마지막 너비 저장
        this.lastResizeWidth = currentWidth;
        
        // 큰 화면에서만 스크롤 핸들러 실행
        if (!nowSmallScreen) {
            this.handleScroll();
        }
    }

    skipToNextSection() {
        const nextSection = document.getElementById('benefits');
        if (nextSection) {
            const navbarHeight = 80;
            const targetPosition = nextSection.offsetTop - navbarHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
    
    skipToPrevSection() {
        const prevSection = document.getElementById('processIntro');
        if (prevSection) {
            const navbarHeight = 80;
            const targetPosition = prevSection.offsetTop - navbarHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    updateCardAnimations(stepFloat) {
        // ===== PC 전용 애니메이션 =====
        this.cards.forEach((card, index) => {
            const cardStep = index + 1;
            const distance = cardStep - stepFloat;
            
            let transform, opacity, zIndex, filter;
            
            if (Math.abs(distance) < 0.3) {
                // 현재 활성 카드 (중앙, 최대 크기) - 범위 확대
                transform = 'translate(-50%, -50%) scale(1.05) rotateY(0deg)';
                opacity = 1;
                zIndex = 30;
                filter = 'blur(0px) brightness(1)';
            } else if (distance > 0 && distance <= 1.5) {
                // 다음 카드 (오른쪽 대각선에서 중앙으로)
                const t = Math.max(0, Math.min(1, 1 - distance));
                
                const startX = 40;
                const startY = 6;
                const startRotateY = 35;
                const startScale = 0.72;
                const startOpacity = 0.6;
                
                const x = startX + ((-50 - startX) * t);
                const y = startY + ((-50 - startY) * t);
                const rotateY = startRotateY + ((0 - startRotateY) * t);
                const scale = startScale + ((1.05 - startScale) * t);
                const opacityT = Math.pow(t, 0.6);
                opacity = startOpacity + ((1 - startOpacity) * opacityT);
                
                transform = `translate(${x}%, ${y}%) scale(${scale}) rotateY(${-rotateY}deg)`;
                zIndex = Math.round(15 + t * 15);
                filter = `blur(${(1 - t) * 2}px) brightness(${0.9 + t * 0.1})`;
            } else if (distance < 0 && distance >= -1.5) {
                // 이전 카드 (중앙에서 왼쪽 대각선으로)
                const t = Math.max(0, Math.min(1, Math.abs(distance)));
                
                const endX = -140;
                const endY = -6;
                const endRotateY = -35;
                const endScale = 0.57;
                const endOpacity = 0.45;
                
                const x = -50 + ((endX - (-50)) * t);
                const y = -50 + ((endY - (-50)) * t);
                const rotateY = 0 + ((endRotateY - 0) * t);
                const scale = 1.05 + ((endScale - 1.05) * t);
                const opacityT = Math.pow(t, 1.4);
                opacity = 1 + ((endOpacity - 1) * opacityT);
                
                transform = `translate(${x}%, ${y}%) scale(${scale}) rotateY(${rotateY}deg)`;
                zIndex = Math.round(20 - t * 10);
                filter = `blur(${t * 3}px) brightness(${1 - t * 0.2})`;
            } else if (distance > 1.5) {
                // 미래 카드 (완전 숨김 - 오른쪽)
                transform = 'translate(80%, 50%) scale(0.4) rotateY(-45deg)';
                opacity = 0;
                zIndex = 1;
                filter = 'blur(4px) brightness(0.7)';
            } else {
                // 과거 카드 (완전 숨김 - 왼쪽)
                transform = 'translate(-180%, -50%) scale(0.4) rotateY(45deg)';
                opacity = 0;
                zIndex = 1;
                filter = 'blur(4px) brightness(0.7)';
            }
            
            // 직접 스타일 적용
            card.style.transform = transform;
            card.style.opacity = opacity;
            card.style.zIndex = zIndex;
            card.style.filter = filter;
        });
    }
    


    updateProgressIndicator() {
        const currentStepEl = document.querySelector('.current-step');
        if (currentStepEl) {
            currentStepEl.textContent = this.currentStep;
        }
    }
}

// ==================== 3단계 카드 애니메이션 ====================
class ThreeStepAnimation {
    constructor() {
        this.cards = document.querySelectorAll('.quick-summary .summary-card');
        this.arrows = document.querySelectorAll('.quick-summary .arrow-divider');
        this.currentStep = 0;
        this.totalSteps = this.cards.length;
        this.intervalId = null;
        this.isMobile = window.innerWidth <= 768;
        this.lastResizeWidth = window.innerWidth; // resize 감지용
        
        if (this.cards.length === 0) {
            return;
        }
        
        this.start();
        
        // 리사이즈 이벤트 리스너
        window.addEventListener('resize', () => {
            const currentWidth = window.innerWidth;
            const wasMobile = this.lastResizeWidth <= 768;
            const nowMobile = currentWidth <= 768;
            
            // 768px 기준으로 모바일 ↔ PC 전환 시 새로고침 (양방향)
            if (wasMobile !== nowMobile) {
                window.location.reload();
                return;
            }
            
            // 마지막 너비 저장
            this.lastResizeWidth = currentWidth;
        });
    }
    
    start() {
        // 모바일과 PC 모두 자동 애니메이션 사용
        this.initAutoAnimation();
    }
    
    restart() {
        // 기존 애니메이션 정리
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // 모든 카드 클래스 초기화
        this.cards.forEach(card => {
            card.classList.remove('active', 'dimmed');
        });
        
        // 재시작
        this.start();
    }
    
    initAutoAnimation() {
        // 초기 상태 설정 (1번째 카드 활성화)
        this.updateCardsAuto();
        
        // 1.8초마다 다음 단계로 전환
        this.intervalId = setInterval(() => {
            this.currentStep = (this.currentStep + 1) % this.totalSteps;
            this.updateCardsAuto();
        }, 1800);
    }
    
    initScrollAnimation() {
        // IntersectionObserver로 스크롤 시 순차 활성화
        const options = {
            threshold: 0.5, // 50% 보일 때
            rootMargin: '0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    entry.target.classList.remove('dimmed');
                    
                    // 해당 카드의 화살표 활성화
                    const cardIndex = Array.from(this.cards).indexOf(entry.target);
                    if (cardIndex >= 0 && cardIndex < this.arrows.length) {
                        this.arrows[cardIndex].classList.add('active');
                    }
                } else {
                    entry.target.classList.remove('active');
                    entry.target.classList.add('dimmed');
                    
                    // 해당 카드의 화살표 비활성화
                    const cardIndex = Array.from(this.cards).indexOf(entry.target);
                    if (cardIndex >= 0 && cardIndex < this.arrows.length) {
                        this.arrows[cardIndex].classList.remove('active');
                    }
                }
            });
        }, options);
        
        // 모든 카드 관찰
        this.cards.forEach(card => {
            observer.observe(card);
        });
    }
    
    updateCardsAuto() {
        this.cards.forEach((card, index) => {
            // 모든 클래스 제거
            card.classList.remove('active', 'dimmed');
            
            // 현재 단계만 활성화
            if (index === this.currentStep) {
                card.classList.add('active');
            } else {
                card.classList.add('dimmed');
            }
        });
        
        // 화살표 애니메이션
        this.arrows.forEach((arrow, index) => {
            arrow.classList.remove('active');
            
            // 현재 단계와 다음 단계 사이의 화살표 활성화
            if (index === this.currentStep) {
                arrow.classList.add('active');
            }
        });
    }
}

// ==================== 실시간 승인 현황 ====================
class RealtimeApprovals {
    constructor() {
        this.feed = document.getElementById('approvalFeed');
        if (!this.feed) {
            console.warn('RealtimeApprovals: 피드를 찾을 수 없습니다.');
            return;
        }
        
        this.businesses = ['카페', '음식점', '편의점', '미용실', '의류샵', '온라인몰', '베이커리', '꽃집'];
        this.regions = ['강남', '서초', '마포', '용산', '송파', '강서', '구로', '동작', '관악', '영등포'];
        
        // 초기 3개 생성
        this.addInitialItems();
        
        // 5초마다 새로운 승인 추가
        setInterval(() => this.addNewApproval(), 5000);
    }
    
    addInitialItems() {
        for (let i = 0; i < 3; i++) {
            const item = this.createApprovalItem(false);
            this.feed.appendChild(item);
        }
    }
    
    addNewApproval() {
        const item = this.createApprovalItem(true);
        
        // 맨 위에 추가
        this.feed.insertBefore(item, this.feed.firstChild);
        
        // 3개만 유지
        const items = this.feed.querySelectorAll('.approval-item');
        if (items.length > 3) {
            items[items.length - 1].style.animation = 'slideOutToBottom 0.5s ease-out';
            setTimeout(() => {
                if (items[items.length - 1].parentNode) {
                    items[items.length - 1].remove();
                }
            }, 500);
        }
    }
    
    createApprovalItem(isNew) {
        const business = this.businesses[Math.floor(Math.random() * this.businesses.length)];
        const region = this.regions[Math.floor(Math.random() * this.regions.length)];
        const amount = (Math.floor(Math.random() * 50) + 10) * 100000; // 1백만 ~ 5천만
        const timeAgo = Math.floor(Math.random() * 10) + 1;
        
        const item = document.createElement('div');
        item.className = 'approval-item';
        if (isNew) {
            item.style.animation = 'slideInFromTop 0.5s ease-out';
        }
        
        item.innerHTML = `
            <div class="approval-info">
                <div class="approval-icon">${business[0]}</div>
                <div class="approval-details">
                    <div class="approval-text">${region} ${business}</div>
                    <div class="approval-amount">₩${amount.toLocaleString()}</div>
                </div>
            </div>
            <div class="approval-time">${timeAgo}분 전</div>
        `;
        
        return item;
    }
}

// ==================== 신뢰 지표 게이지 애니메이션 ====================
class TrustMetrics {
    constructor() {
        this.cards = document.querySelectorAll('.metric-card-new');
        if (this.cards.length === 0) {
            console.warn('TrustMetrics: 카드를 찾을 수 없습니다.');
            return;
        }
        
        // Intersection Observer로 화면에 보일 때 애니메이션
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateMetrics();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        this.cards.forEach(card => observer.observe(card));
    }
    
    animateMetrics() {
        // 게이지 애니메이션
        const circles = document.querySelectorAll('.metric-progress');
        circles.forEach(circle => {
            const progress = parseInt(circle.getAttribute('data-progress'));
            const circumference = 326.73;
            const offset = circumference - (progress / 100) * circumference;
            
            setTimeout(() => {
                circle.style.strokeDashoffset = offset;
            }, 300);
        });
        
        // 숫자 카운트업 애니메이션
        const numbers = document.querySelectorAll('.metric-number-new');
        numbers.forEach(number => {
            const target = parseInt(number.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const counter = setInterval(() => {
                current += step;
                if (current >= target) {
                    number.textContent = target.toLocaleString();
                    clearInterval(counter);
                } else {
                    number.textContent = Math.floor(current).toLocaleString();
                }
            }, 16);
        });
    }
}

// ==================== 모바일 메뉴 ====================
class MobileMenu {
    constructor() {
        this.toggle = document.getElementById('mobileMenuToggle');
        this.overlay = document.getElementById('mobileMenuOverlay');
        this.close = document.getElementById('mobileMenuClose');
        this.menuLinks = document.querySelectorAll('.mobile-menu-link');
        this.dropdownBtn = document.getElementById('mobileDropdownBtn');
        this.dropdownContent = document.getElementById('mobileDropdownContent');
        this.dropdown = document.querySelector('.mobile-menu-dropdown');
        
        if (!this.toggle || !this.overlay || !this.close) {
            console.warn('MobileMenu: 요소를 찾을 수 없습니다.');
            return;
        }
        
        this.init();
    }
    
    init() {
        // 햄버거 메뉴 클릭
        this.toggle.addEventListener('click', () => {
            this.openMenu();
        });
        
        // 닫기 버튼 클릭
        this.close.addEventListener('click', () => {
            this.closeMenu();
        });
        
        // 오버레이 클릭 (메뉴 외부)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeMenu();
            }
        });
        
        // 드롭다운 버튼 클릭
        if (this.dropdownBtn && this.dropdown) {
            this.dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dropdown.classList.toggle('active');
            });
        }
        
        // 메뉴 링크 클릭 시 메뉴 닫기
        this.menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });
    }
    
    openMenu() {
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // 스크롤 방지
    }
    
    closeMenu() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = ''; // 스크롤 복원
        // 드롭다운도 닫기
        if (this.dropdown) {
            this.dropdown.classList.remove('active');
        }
    }
}

// ==================== FAQ 아코디언 ====================
class FAQAccordion {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }
    
    init() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => this.toggleItem(item));
        });
    }
    
    toggleItem(item) {
        const isActive = item.classList.contains('active');
        
        // 다른 모든 아이템 닫기
        this.faqItems.forEach(faqItem => {
            faqItem.classList.remove('active');
        });
        
        // 클릭한 아이템 토글
        if (!isActive) {
            item.classList.add('active');
        }
    }
}

// ==================== 스무스 스크롤 네비게이션 ====================
class SmoothScrollNav {
    constructor() {
        this.init();
    }
    
    init() {
        // 모든 앵커 링크에 스무스 스크롤 적용
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                
                // 빈 해시나 특수한 경우 제외
                if (!href || href === '#' || href.length <= 1) return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    const navbarHeight = 80;
                    const targetPosition = target.offsetTop - navbarHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // 모바일 메뉴가 열려있으면 닫기
                    const mobileOverlay = document.getElementById('mobileMenuOverlay');
                    if (mobileOverlay && mobileOverlay.classList.contains('active')) {
                        mobileOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }
            });
        });
    }
}

// ==================== 페이지 로드 시 초기화 ====================
window.addEventListener('DOMContentLoaded', () => {
    new CircleFlow();
    new ThreeStepAnimation();
    new RealtimeApprovals();
    new TrustMetrics();
    new MobileMenu();
    new FAQAccordion();
    new SmoothScrollNav();
    
    // VIDEO PLAYER
    const playButton = document.getElementById('playButton');
    const video = document.getElementById('myVideo');

    if (playButton && video) {
        playButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            video.play();
            playButton.classList.add('hidden');
        });

        video.addEventListener('click', function() {
            if (video.paused) {
                video.play();
                playButton.classList.add('hidden');
            } else {
                video.pause();
                playButton.classList.remove('hidden');
            }
        });

        video.addEventListener('pause', function() {
            playButton.classList.remove('hidden');
        });

        video.addEventListener('ended', function() {
            playButton.classList.remove('hidden');
        });
    }
});
