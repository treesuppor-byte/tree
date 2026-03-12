// ==================== FAQ & 고객 후기 인터랙티브 동작 ====================
// PC: 기본 활성화 상태, 호버 시 기본 모습으로 전환 (FAQ만)
// 모바일: 스크롤 시 중앙 정렬 카드 활성화 (FAQ + 고객 후기)

class FAQInteractive {
    constructor() {
        this.faqCards = document.querySelectorAll('.faq-premium-card');
        this.testimonialCards = document.querySelectorAll('.testimonial-card');
        this.isMobile = window.innerWidth <= 768;
        
        if (!this.faqCards.length && !this.testimonialCards.length) return;
        
        console.log(`🎯 Interactive 초기화: ${this.isMobile ? '모바일' : 'PC'} 모드`);
        console.log(`   - FAQ 카드: ${this.faqCards.length}개`);
        console.log(`   - 후기 카드: ${this.testimonialCards.length}개`);
        
        this.init();
        
        // 리사이즈 시 재초기화
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = window.innerWidth <= 768;
                
                // 모바일 <-> PC 전환 시에만 재초기화
                if (wasMobile !== this.isMobile) {
                    console.log(`🔄 모드 전환: ${this.isMobile ? '모바일' : 'PC'}`);
                    this.destroy();
                    this.init();
                }
            }, 200);
        });
    }
    
    init() {
        if (this.isMobile) {
            this.initMobile();
        } else {
            // PC에서는 FAQ만 기본 활성화 상태 (CSS로 처리)
            this.faqCards.forEach(card => {
                card.classList.remove('active', 'inactive');
            });
            this.testimonialCards.forEach(card => {
                card.classList.remove('active', 'inactive');
            });
            console.log('✅ PC 모드: CSS 기본 스타일 사용');
        }
    }
    
    destroy() {
        // 모바일 이벤트 제거
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            if (this.touchScrollHandler) {
                window.removeEventListener('touchmove', this.touchScrollHandler);
                window.removeEventListener('touchend', this.touchScrollHandler);
            }
            this.scrollHandler = null;
            this.touchScrollHandler = null;
        }
        
        // Intersection Observer 제거
        if (this.faqObserver) {
            this.faqObserver.disconnect();
            this.faqObserver = null;
        }
        if (this.testimonialObserver) {
            this.testimonialObserver.disconnect();
            this.testimonialObserver = null;
        }
        
        // 모든 active/inactive 클래스 제거
        this.faqCards.forEach(card => {
            card.classList.remove('active', 'inactive');
        });
        this.testimonialCards.forEach(card => {
            card.classList.remove('active', 'inactive');
        });
    }
    
    // ========== 모바일 모드: 스크롤 중앙 정렬 ===========
    initMobile() {
        console.log('📱 모바일 모드 초기화 시작');
        
        // requestAnimationFrame을 사용한 부드러운 체크
        let ticking = false;
        
        const update = () => {
            this.checkCenterCard();
            ticking = false;
        };
        
        // 스크롤 이벤트 핸들러
        this.scrollHandler = () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        };
        
        // 터치 스크롤 이벤트 핸들러
        this.touchScrollHandler = () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        };
        
        // 여러 이벤트 등록 (모바일 호환성)
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
        window.addEventListener('touchmove', this.touchScrollHandler, { passive: true });
        window.addEventListener('touchend', this.scrollHandler, { passive: true });
        
        // Intersection Observer 추가 (백업)
        this.setupIntersectionObserver();
        
        // 초기 체크
        setTimeout(() => {
            console.log('🔍 초기 카드 체크 실행');
            this.checkCenterCard();
        }, 300);
        
        // 페이지 로드 후 다시 체크
        setTimeout(() => {
            this.checkCenterCard();
        }, 1000);
    }
    
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-40% 0px -40% 0px', // 중앙 20% 영역
            threshold: [0, 0.25, 0.5, 0.75, 1]
        };
        
        // FAQ 카드용 Observer
        this.faqObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                    console.log(`👁️ FAQ Observer: 카드 교차 감지`);
                    this.checkCenterCard();
                }
            });
        }, options);
        
        this.faqCards.forEach(card => {
            this.faqObserver.observe(card);
        });
        
        // 고객 후기 카드용 Observer
        this.testimonialObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                    console.log(`👁️ 후기 Observer: 카드 교차 감지`);
                    this.checkCenterCard();
                }
            });
        }, options);
        
        this.testimonialCards.forEach(card => {
            this.testimonialObserver.observe(card);
        });
    }
    
    checkCenterCard() {
        const viewportCenter = window.innerHeight / 2;
        
        // FAQ 카드 체크
        this.checkCardGroup(this.faqCards, viewportCenter, 'FAQ');
        
        // 고객 후기 카드 체크
        this.checkCardGroup(this.testimonialCards, viewportCenter, '후기');
    }
    
    checkCardGroup(cards, viewportCenter, groupName) {
        if (!cards.length) return;
        
        let closestCard = null;
        let minDistance = Infinity;
        
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            const distance = Math.abs(viewportCenter - cardCenter);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestCard = card;
            }
        });
        
        // 중앙에 가장 가까운 카드 활성화
        if (closestCard) {
            const rect = closestCard.getBoundingClientRect();
            // 화면에 보이는지 확인 (더 넓은 범위)
            const isInView = rect.top < window.innerHeight * 0.9 && rect.bottom > window.innerHeight * 0.1;
            
            if (isInView) {
                const cardIndex = Array.from(cards).indexOf(closestCard) + 1;
                console.log(`✨ ${groupName} 카드 ${cardIndex} 활성화 (거리: ${Math.round(minDistance)}px)`);
                this.activateCard(closestCard, cards);
            } else {
                this.deactivateAllCards(cards);
            }
        }
    }
    
    activateCard(targetCard, cards) {
        cards.forEach(card => {
            if (card === targetCard) {
                card.classList.add('active');
                card.classList.remove('inactive');
            } else {
                card.classList.add('inactive');
                card.classList.remove('active');
            }
        });
    }
    
    deactivateAllCards(cards) {
        cards.forEach(card => {
            card.classList.remove('active', 'inactive');
        });
    }
}

// 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            new FAQInteractive();
        }, 100);
    });
} else {
    setTimeout(() => {
        new FAQInteractive();
    }, 100);
}
