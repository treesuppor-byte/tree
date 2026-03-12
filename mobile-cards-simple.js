// ==================== 모바일 전용 7단계 카드 (완전 독립) ====================

class MobileCardsSimple {
    constructor() {
        this.wrapper = document.querySelector('.circle-flow-wrapper');
        this.container = document.querySelector('.circle-flow-container');
        this.oldStage = document.querySelector('.circle-flow-stage');
        this.progressIndicator = document.querySelector('.progress-indicator');
        
        if (!this.oldStage) return;
        
        this.isMobileMode = false;
        this.originalStageHTML = this.oldStage.outerHTML; // 원본 저장
        
        // 초기 체크 및 초기화
        this.checkAndInit();
        
        // 리사이즈 이벤트 리스너
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.checkAndInit();
            }, 150);
        });
    }
    
    checkAndInit() {
        const shouldBeMobile = window.innerWidth <= 768;
        
        // 현재 상태와 다를 때만 전환
        if (shouldBeMobile && !this.isMobileMode) {
            this.init();
        } else if (!shouldBeMobile && this.isMobileMode) {
            this.destroy();
        }
    }
    
    init() {
        if (this.isMobileMode) return; // 이미 모바일 모드면 중복 실행 방지
        
        this.isMobileMode = true;
        
        // 🔧 모바일에서 container의 overflow 강제 해제
        if (this.container) {
            this.container.style.overflow = 'visible';
            this.container.style.height = 'auto';
            this.container.style.position = 'relative';
        }
        if (this.wrapper) {
            this.wrapper.style.overflow = 'visible';
            this.wrapper.style.height = 'auto';
        }
        
        // 1. 기존 카드 데이터만 추출 (처음 한 번만)
        if (!this.cardsData) {
            const oldCards = Array.from(this.oldStage.querySelectorAll('.flow-card'));
            this.cardsData = oldCards.map((card, index) => {
                const cardInner = card.querySelector('.card-inner');
                // cloneNode(true)로 모든 자식 요소 깊은 복사
                const clonedInner = cardInner.cloneNode(true);
                
                return {
                    html: clonedInner.outerHTML,
                    isInverted: cardInner.classList.contains('inverted')
                };
            });
        }
        
        // 2. 기존 stage 숨기기 (삭제 대신)
        this.oldStage.style.display = 'none';
        
        // 3. 완전히 새로운 모바일 전용 구조 생성
        this.buildMobileStructure();
        
        // 4. 점 인디케이터
        this.createDots();
        
        // 5. 스크롤 이벤트
        this.attachScroll();
        
        // 6. 초기 위치
        this.mobileStage.scrollLeft = 0;
        this.updateDots();
        this.updateCardsOpacity();
        
        // 7. 스크롤 힌트 표시 (모바일 전용)
        this.showScrollHint();
    }
    
    destroy() {
        if (!this.isMobileMode) return; // 이미 데스크톱 모드면 중복 실행 방지
        
        this.isMobileMode = false;
        
        // 모바일 스테이지 제거
        if (this.mobileStage) {
            this.mobileStage.remove();
            this.mobileStage = null;
        }
        
        // 점 인디케이터 제거
        if (this.dotsContainer) {
            this.dotsContainer.remove();
            this.dotsContainer = null;
        }
        
        // 기존 stage 다시 보이기
        if (this.oldStage) {
            this.oldStage.style.display = '';
        }
        
        // counter 다시 보이기
        const counter = this.progressIndicator?.querySelector('.step-counter');
        if (counter) counter.style.display = '';
        
        // container 스타일 복원
        if (this.container) {
            this.container.style.overflow = '';
            this.container.style.height = '';
            this.container.style.position = '';
        }
        if (this.wrapper) {
            this.wrapper.style.overflow = '';
            this.wrapper.style.height = '';
        }
        
        // 스크롤 힌트 숨기기
        this.hideScrollHint();
    }
    
    buildMobileStructure() {
        const vw = window.innerWidth;
        const cardW = Math.min(vw * 0.75, 380); // 85% → 75%로 축소, 최대 너비 420 → 380
        const gap = 16;
        const sideMargin = (vw - cardW) / 2;
        
        // 카드 정보 저장 (정확한 계산을 위해)
        this.cardWidth = cardW;
        this.cardGap = gap;
        this.sideMargin = sideMargin;
        
        // 새로운 모바일 전용 컨테이너
        this.mobileStage = document.createElement('div');
        this.mobileStage.className = 'mobile-stage';
        this.mobileStage.style.cssText = `
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            padding: 40px 0 60px;
            width: 100%;
            scrollbar-width: none;
            position: relative;
            z-index: 1;
        `;
        
        // 스크롤바 숨기기
        const style = document.createElement('style');
        style.textContent = `
            .mobile-stage::-webkit-scrollbar { 
                display: none !important; 
            }
            .mobile-stage {
                scroll-behavior: smooth;
            }
            .mobile-card {
                transition: opacity 0.3s ease-out, 
                           transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                           filter 0.3s ease-out,
                           z-index 0s;
                transform-origin: center center;
            }
            
            /* 3D perspective 효과 */
            .circle-flow-wrapper {
                perspective: 1500px;
                perspective-origin: center center;
            }
        `;
        document.head.appendChild(style);
        
        // 새로운 카드들 생성
        this.mobileCards = [];
        this.cardsData.forEach((data, i) => {
            const card = document.createElement('div');
            card.className = 'mobile-card';
            
            if (data.isInverted) {
                card.classList.add('inverted');
            }
            
            const ml = i === 0 ? sideMargin : gap;
            const mr = i === this.cardsData.length - 1 ? sideMargin : 0;
            
            card.style.cssText = `
                flex: 0 0 ${cardW}px;
                width: ${cardW}px;
                min-width: ${cardW}px;
                scroll-snap-align: center;
                margin-left: ${ml}px;
                margin-right: ${mr}px;
            `;
            
            card.innerHTML = data.html;
            
            // 🔧 강제로 mini-chart 스타일 적용
            setTimeout(() => {
                const miniChart = card.querySelector('.mini-chart');
                if (miniChart) {
                    // 부모 요소들도 overflow 확인
                    const cardInner = card.querySelector('.card-inner');
                    if (cardInner) {
                        cardInner.style.overflow = 'visible';
                    }
                    
                    miniChart.style.cssText = `
                        height: 80px !important;
                        min-height: 80px !important;
                        width: 100% !important;
                        padding: 16px !important;
                        display: flex !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        align-items: flex-end !important;
                        justify-content: center !important;
                        gap: 24px !important;
                        margin-top: 24px !important;
                        background: rgba(255, 255, 255, 0.2) !important;
                        border-radius: 16px !important;
                        overflow: visible !important;
                        position: relative !important;
                        z-index: 10 !important;
                        box-sizing: border-box !important;
                    `;
                    
                    const miniBars = miniChart.querySelectorAll('.mini-bar');
                    miniBars.forEach((bar, idx) => {
                        const heights = ['36px', '48px', '42px']; // 고정 픽셀 높이
                        bar.style.cssText = `
                            flex: 1 !important;
                            width: 40px !important;
                            max-width: 40px !important;
                            min-width: 40px !important;
                            height: ${heights[idx]} !important;
                            min-height: ${heights[idx]} !important;
                            background: rgba(255, 255, 255, 0.95) !important;
                            border-radius: 8px 8px 0 0 !important;
                            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.4) !important;
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                            position: relative !important;
                            z-index: 11 !important;
                        `;
                    });
                    
                    console.log(`✅ 카드 ${i + 1}: mini-chart 강제 스타일 적용 완료 (픽셀 높이)`);
                    
                    // 다시 한 번 확인
                    setTimeout(() => {
                        const computedChart = window.getComputedStyle(miniChart);
                        console.log(`   📊 적용 후 확인 - display: ${computedChart.display}, height: ${computedChart.height}, background: ${computedChart.background}`);
                    }, 100);
                }
            }, 0);
            
            
            this.mobileStage.appendChild(card);
            this.mobileCards.push(card);
        });
        
        // 🔧 핵심 수정: wrapper에 직접 추가 (container의 overflow:hidden 회피)
        this.wrapper.appendChild(this.mobileStage);
    }
    
    createDots() {
        const counter = this.progressIndicator.querySelector('.step-counter');
        if (counter) counter.style.display = 'none';
        
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
        `;
        
        for (let i = 0; i < this.mobileCards.length; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #D0D5DD;
                transition: all 0.3s ease;
            `;
            this.dotsContainer.appendChild(dot);
        }
        
        this.progressIndicator.appendChild(this.dotsContainer);
    }
    
    attachScroll() {
        this.stage = this.mobileStage;
        this.currentIndex = 0;
        this.scrollTimeout = null;
        
        // 스크롤 이벤트 - 스크롤 중에는 점만 업데이트, 스크롤 완료 후 카드 효과 적용
        this.mobileStage.addEventListener('scroll', () => {
            this.updateDots();
            
            // 스크롤 중에는 타이머 취소하고 새로 설정
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            
            // 스크롤이 멈춘 후 150ms 뒤에 카드 효과 적용
            this.scrollTimeout = setTimeout(() => {
                this.updateCardsOpacity();
            }, 150);
        }, { passive: true });
        
        // 터치 이벤트 추가 (모바일용)
        this.attachTouchEvents();
        
        // 마우스 드래그 이벤트 추가 (PC용)
        this.attachMouseDrag();
    }
    
    attachTouchEvents() {
        let touchStartX = 0;
        let touchStartTime = 0;
        let startScrollLeft = 0;
        
        this.mobileStage.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartTime = Date.now();
            startScrollLeft = this.mobileStage.scrollLeft;
            
            // 첫 터치 시 힌트 숨기기
            this.hideScrollHint();
        }, { passive: true });
        
        this.mobileStage.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndTime = Date.now();
            const touchDistance = touchStartX - touchEndX;
            const duration = touchEndTime - touchStartTime;
            
            // 실제 스크롤된 거리 확인
            const scrollDistance = this.mobileStage.scrollLeft - startScrollLeft;
            
            // 속도 계산 (px/ms)
            const velocity = Math.abs(touchDistance) / duration;
            
            // 이동 판단 조건 (하나라도 만족하면 이동)
            const hasDistance = Math.abs(scrollDistance) > 20 || Math.abs(touchDistance) > 20;
            const hasVelocity = velocity > 0.3; // 속도 임계값 낮춤 (0.3 px/ms)
            
            
            if (hasDistance || hasVelocity) {
                // 방향 판단: 스크롤 거리 우선, 없으면 터치 거리
                let direction = scrollDistance !== 0 ? scrollDistance : touchDistance;
                
                if (direction > 0) {
                    // 왼쪽 스와이프 - 다음 카드
                    this.goToNextCard();
                } else if (direction < 0) {
                    // 오른쪽 스와이프 - 이전 카드
                    this.goToPrevCard();
                } else {
                    this.goToCard(this.currentIndex);
                }
            } else {
                // 작은 이동은 현재 카드로
                this.goToCard(this.currentIndex);
            }
        }, { passive: true });
    }
    
    attachMouseDrag() {
        let isDown = false;
        let startX;
        let scrollLeft;
        let startTime;
        
        this.mobileStage.addEventListener('mousedown', (e) => {
            isDown = true;
            this.mobileStage.style.cursor = 'grabbing';
            this.mobileStage.style.userSelect = 'none';
            startX = e.pageX;
            scrollLeft = this.mobileStage.scrollLeft;
            startTime = Date.now();
            
            // 첫 드래그 시 힌트 숨기기
            this.hideScrollHint();
        });
        
        const handleMouseEnd = (e) => {
            if (!isDown) return;
            
            isDown = false;
            this.mobileStage.style.cursor = 'grab';
            
            // 마우스를 뗀 시점의 위치
            const endX = e.pageX;
            const endTime = Date.now();
            const mouseDistance = startX - endX;
            const duration = endTime - startTime;
            
            // 실제 스크롤된 거리
            const scrollDistance = this.mobileStage.scrollLeft - scrollLeft;
            
            // 속도 계산 (px/ms)
            const velocity = Math.abs(mouseDistance) / Math.max(duration, 1);
            
            // 이동 판단 조건 (하나라도 만족하면 이동)
            const hasDistance = Math.abs(scrollDistance) > 20 || Math.abs(mouseDistance) > 20;
            const hasVelocity = velocity > 0.3; // 속도 임계값 낮춤
            
            
            if (hasDistance || hasVelocity) {
                // 방향 판단: 스크롤 거리 우선
                let direction = scrollDistance !== 0 ? scrollDistance : mouseDistance;
                
                if (direction > 0) {
                    this.goToNextCard();
                } else if (direction < 0) {
                    this.goToPrevCard();
                } else {
                    this.goToCard(this.currentIndex);
                }
            } else {
                this.goToCard(this.currentIndex);
            }
        };
        
        this.mobileStage.addEventListener('mouseleave', handleMouseEnd);
        this.mobileStage.addEventListener('mouseup', handleMouseEnd);
        
        this.mobileStage.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            
            const x = e.pageX;
            const walk = (startX - x) * 1.2;
            this.mobileStage.scrollLeft = scrollLeft + walk;
        });
        
        // 기본 커서 스타일
        this.mobileStage.style.cursor = 'grab';
    }
    
    // 다음 카드로 이동
    goToNextCard() {
        if (this.currentIndex < this.mobileCards.length - 1) {
            this.currentIndex++;
            this.goToCard(this.currentIndex);
        } else {
            // 7번 카드에서 오른쪽 넘기면 다음 섹션으로
            this.goToCard(this.currentIndex); // 일단 현재 위치로
            setTimeout(() => {
                this.scrollToNextSection();
            }, 300);
        }
    }
    
    // 이전 카드로 이동
    goToPrevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.goToCard(this.currentIndex);
        } else {
            // 1번 카드에서 왼쪽 넘기면 현재 위치 유지
            this.goToCard(this.currentIndex);
        }
    }
    
    // 다음 섹션으로 스크롤
    scrollToNextSection() {
        // process-section의 다음 섹션 찾기
        const processSection = document.querySelector('.process-section');
        if (processSection && processSection.nextElementSibling) {
            const nextSection = processSection.nextElementSibling;
            nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // 대안: target-audience-section 직접 찾기
            const targetSection = document.querySelector('.target-audience-section');
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    // 특정 카드로 부드럽게 이동
    goToCard(index) {
        this.currentIndex = index;
        
        // 정확한 중앙 정렬 계산
        // 각 카드의 실제 위치를 계산
        let targetScroll = 0;
        
        if (index === 0) {
            // 첫 번째 카드: sideMargin이 이미 있으므로 0으로 스크롤
            targetScroll = 0;
        } else {
            // 이후 카드들: 첫 카드 sideMargin + (cardWidth + gap) * index - sideMargin
            // = (cardWidth + gap) * index
            targetScroll = (this.cardWidth + this.cardGap) * index;
        }
        
        // 부드러운 스크롤 애니메이션
        this.mobileStage.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        
        // 점 업데이트
        setTimeout(() => {
            this.updateDots();
        }, 50);
    }
    
    snapToNearestCard() {
        const centerX = this.mobileStage.scrollLeft + this.mobileStage.clientWidth / 2;
        
        let closest = 0;
        let minDist = Infinity;
        
        this.mobileCards.forEach((card, i) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const dist = Math.abs(centerX - cardCenter);
            
            if (dist < minDist) {
                minDist = dist;
                closest = i;
            }
        });
        
        this.goToCard(closest);
    }
    
    updateCardsOpacity() {
        const centerX = this.mobileStage.scrollLeft + this.mobileStage.clientWidth / 2;
        
        this.mobileCards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = centerX - cardCenter; // 방향 포함
            const cardWidth = card.offsetWidth;
            const absDistance = Math.abs(distance);
            
            if (absDistance < cardWidth * 0.5) {
                // 중앙 카드 - 완전히 정면, 최대 크기 (크기 변화 없음)
                card.style.opacity = '1';
                card.style.transform = `
                    scale(1) 
                    rotateY(0deg) 
                    translateZ(0px)
                    translateY(0px)
                `;
                card.style.zIndex = '100';
                card.style.filter = 'brightness(1) blur(0px)';
            } else if (absDistance < cardWidth * 1.5) {
                // 바로 옆 카드 - 살짝만 작아짐
                const progress = (absDistance - cardWidth * 0.5) / cardWidth;
                const rotateAngle = distance > 0 ? -15 * progress : 15 * progress;
                const translateZ = -60 * progress;
                const translateY = 15 * progress;
                const scale = 1 - 0.08 * progress; // 크기 변화 줄임 (0.12 → 0.08)
                const opacity = 1 - 0.3 * progress;
                const blur = 1 * progress;
                
                card.style.opacity = opacity;
                card.style.transform = `
                    scale(${scale}) 
                    rotateY(${rotateAngle}deg) 
                    translateZ(${translateZ}px)
                    translateY(${translateY}px)
                `;
                card.style.zIndex = Math.floor(50 - absDistance);
                card.style.filter = `brightness(${1 - 0.15 * progress}) blur(${blur}px)`;
            } else {
                // 멀리 있는 카드
                const rotateAngle = distance > 0 ? -25 : 25;
                
                card.style.opacity = '0.4';
                card.style.transform = `
                    scale(0.9) 
                    rotateY(${rotateAngle}deg) 
                    translateZ(-120px)
                    translateY(30px)
                `;
                card.style.zIndex = '1';
                card.style.filter = 'brightness(0.8) blur(2px)';
            }
        });
    }
    
    updateDots() {
        const centerX = this.mobileStage.scrollLeft + this.mobileStage.clientWidth / 2;
        
        let closest = 0;
        let minDist = Infinity;
        
        this.mobileCards.forEach((card, i) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const dist = Math.abs(centerX - cardCenter);
            
            if (dist < minDist) {
                minDist = dist;
                closest = i;
            }
        });
        
        const dots = this.dotsContainer.children;
        for (let i = 0; i < dots.length; i++) {
            if (i === closest) {
                dots[i].style.cssText = `
                    width: 28px;
                    height: 10px;
                    border-radius: 5px;
                    background: #0066FF;
                    transition: all 0.3s ease;
                `;
            } else {
                dots[i].style.cssText = `
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #D0D5DD;
                    transition: all 0.3s ease;
                `;
            }
        }
    }
    
    // 스크롤 힌트 표시 (모바일 전용)
    showScrollHint() {
        const scrollHint = document.getElementById('scrollHint');
        if (!scrollHint) {
            return;
        }
        
        // 이미 사용자가 상호작용했는지 확인 (localStorage 사용)
        const hasInteracted = localStorage.getItem('scrollHintDismissed');
        if (hasInteracted === 'true') {
            return;
        }
        
        // 힌트 표시
        setTimeout(() => {
            scrollHint.classList.add('active');
            
            // 5초 후 자동으로 페이드 아웃
            this.hintTimeout = setTimeout(() => {
                this.fadeOutHint();
            }, 5000);
        }, 800); // 카드 애니메이션 후 표시
    }
    
    // 스크롤 힌트 숨기기
    hideScrollHint() {
        const scrollHint = document.getElementById('scrollHint');
        if (!scrollHint) return;
        
        // 타임아웃 취소
        if (this.hintTimeout) {
            clearTimeout(this.hintTimeout);
            this.hintTimeout = null;
        }
        
        // 사용자가 상호작용했다고 표시
        localStorage.setItem('scrollHintDismissed', 'true');
        
        // 페이드 아웃 후 제거
        this.fadeOutHint();
        
        console.log('✅ 스크롤 힌트 숨김 (사용자 상호작용)');
    }
    
    // 부드러운 페이드 아웃
    fadeOutHint() {
        const scrollHint = document.getElementById('scrollHint');
        if (!scrollHint) return;
        
        scrollHint.classList.add('fade-out');
        
        setTimeout(() => {
            scrollHint.classList.remove('active', 'fade-out');
        }, 800); // fade-out transition 시간과 맞춤
    }
}

// 초기화
let mobileCardsInstance = null;
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        mobileCardsInstance = new MobileCardsSimple();
        // 전역으로 노출 (힌트 클릭 이벤트에서 접근 가능하도록)
        window.mobileCardsInstance = mobileCardsInstance;
    }, 100);
});
