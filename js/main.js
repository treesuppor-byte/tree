// 페이지 로드 시 애니메이션 효과
document.addEventListener('DOMContentLoaded', function() {
    // 스크롤 애니메이션
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 모든 카드에 관찰자 추가
    const cards = document.querySelectorAll('.detail-card, .timeline-item');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });

    // 프로세스 카드 클릭 이벤트
    const processCards = document.querySelectorAll('.process-card');
    processCards.forEach((card, index) => {
        card.addEventListener('click', function() {
            // 해당 상세 카드로 스크롤
            const detailCards = document.querySelectorAll('.detail-card');
            if (detailCards[index]) {
                detailCards[index].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // 강조 효과
                detailCards[index].style.boxShadow = '0 0 30px rgba(33, 150, 243, 0.5)';
                setTimeout(() => {
                    detailCards[index].style.boxShadow = '';
                }, 2000);
            }
        });
    });

    // CTA 버튼 클릭 이벤트
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            alert('문의해 주셔서 감사합니다! 곧 연락드리겠습니다.');
            // 실제 구현시에는 문의 폼이나 연락처 페이지로 이동
        });
    }

    // 체크리스트 항목 클릭 시 체크 효과
    const checklistItems = document.querySelectorAll('.checklist-item');
    checklistItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.background = '#c8e6c9';
            const icon = this.querySelector('i');
            icon.style.transform = 'scale(1.3)';
            
            setTimeout(() => {
                this.style.background = '';
                icon.style.transform = 'scale(1)';
            }, 500);
        });
    });

    // 타임라인 아이템 호버 효과 강화
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        const marker = item.querySelector('.timeline-marker');
        const content = item.querySelector('.timeline-content');
        
        item.addEventListener('mouseenter', function() {
            marker.style.transform = 'translateX(-50%) scale(1.2)';
            marker.style.transition = 'all 0.3s ease';
        });
        
        item.addEventListener('mouseleave', function() {
            marker.style.transform = 'translateX(-50%) scale(1)';
        });
    });

    // 프로그레스 인디케이터 애니메이션
    const badges = document.querySelectorAll('.step-badge, .status-badge');
    badges.forEach((badge, index) => {
        setTimeout(() => {
            badge.style.animation = 'pulse 0.5s ease';
        }, index * 200);
    });

    // 부드러운 스크롤 링크 처리
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 페이지 로드 시 환영 효과
    setTimeout(() => {
        const header = document.querySelector('.header');
        header.style.transform = 'scale(1.05)';
        setTimeout(() => {
            header.style.transform = 'scale(1)';
        }, 300);
    }, 500);

    // 스크롤 시 헤더 스타일 변경
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        const header = document.querySelector('.header');
        
        if (currentScroll > 100) {
            header.style.padding = '20px';
            header.style.transition = 'all 0.3s ease';
        } else {
            header.style.padding = '40px 20px';
        }
        
        lastScroll = currentScroll;
    });

    // 상세 카드 정보 토글 기능 (선택적)
    const detailCards = document.querySelectorAll('.detail-card');
    detailCards.forEach(card => {
        card.addEventListener('dblclick', function() {
            const checklist = this.querySelector('.checklist');
            const infoBox = this.querySelector('.info-box');
            
            if (checklist.style.display === 'none') {
                checklist.style.display = 'block';
                infoBox.style.display = 'flex';
            } else {
                checklist.style.display = 'none';
                infoBox.style.display = 'none';
            }
        });
    });

    console.log('✅ 3일 여정 페이지가 성공적으로 로드되었습니다!');
});

// 추가 유틸리티 함수
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// 페이지 가시성 API 사용
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('페이지가 숨겨졌습니다.');
    } else {
        console.log('페이지가 다시 보입니다.');
    }
});
