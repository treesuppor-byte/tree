// ==================== 부드러운 관성 스크롤 (Smooth Inertia Scroll) ====================
class SmoothScroll {
    constructor() {
        this.targetScroll = 0;
        this.currentScroll = 0;
        this.ease = 0.08; // 감속 강도 (0.05 ~ 0.1)
        this.isRunning = false;
        this.touchStartY = 0;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // 섹션 스냅 포인트
        this.snapPoints = [];
        this.snapThreshold = 100; // 섹션에서 이 거리 내에 있으면 더 강하게 당김
        this.snapStrength = 0.15; // 스냅 당김 강도
        
        this.init();
    }

    init() {
        // 초기 스크롤 위치 설정
        this.currentScroll = window.pageYOffset;
        this.targetScroll = this.currentScroll;
        
        // 스냅 포인트 계산
        this.calculateSnapPoints();
        
        // 모바일(768px 이하)에서는 SmoothScroll 완전 비활성화
        if (window.innerWidth <= 768) {
            console.log('SmoothScroll 모바일 완전 비활성화');
            return;
        }
        
        // PC(769px 이상): wheel 이벤트 제어
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        // 리사이즈 시 스냅 포인트 재계산
        window.addEventListener('resize', () => this.calculateSnapPoints());
        
        // 애니메이션 시작
        this.startRAF();
    }

    calculateSnapPoints() {
        // 주요 섹션들의 top 위치 저장
        this.snapPoints = [];
        
        const sections = document.querySelectorAll('section, .hero-section, .quick-summary, .circle-flow-wrapper, .benefits-section, .testimonial-section, .cta-section, footer');
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const offsetTop = rect.top + window.pageYOffset;
            this.snapPoints.push(offsetTop);
        });
        
        // 페이지 최상단과 최하단도 추가
        this.snapPoints.unshift(0);
        this.snapPoints.push(document.body.scrollHeight - window.innerHeight);
        
        // 중복 제거 및 정렬
        this.snapPoints = [...new Set(this.snapPoints)].sort((a, b) => a - b);
    }

    onWheel(e) {
        e.preventDefault();
        
        // 휠 delta 값 (속도)
        const delta = e.deltaY;
        const multiplier = 1.2; // 스크롤 민감도
        
        // 목표 스크롤 위치 업데이트
        this.targetScroll += delta * multiplier;
        
        // 범위 제한
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        this.targetScroll = Math.max(0, Math.min(this.targetScroll, maxScroll));
    }

    onTouchStart(e) {
        this.touchStartY = e.touches[0].clientY;
    }

    onTouchMove(e) {
        const touchY = e.touches[0].clientY;
        const delta = this.touchStartY - touchY;
        
        // 목표 스크롤 위치 업데이트
        this.targetScroll += delta * 0.8; // 터치는 조금 더 직관적으로
        
        // 범위 제한
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        this.targetScroll = Math.max(0, Math.min(this.targetScroll, maxScroll));
        
        this.touchStartY = touchY;
    }

    applySnapEffect() {
        // 가까운 스냅 포인트 찾기
        let closestSnap = null;
        let closestDistance = Infinity;
        
        this.snapPoints.forEach(point => {
            const distance = Math.abs(this.targetScroll - point);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestSnap = point;
            }
        });
        
        // 스냅 포인트에 가까우면 자연스럽게 당김
        if (closestDistance < this.snapThreshold) {
            // 거리에 비례해서 당김 강도 조절
            const pullStrength = (1 - closestDistance / this.snapThreshold) * this.snapStrength;
            const diff = closestSnap - this.targetScroll;
            this.targetScroll += diff * pullStrength;
        }
    }

    updateScroll() {
        // 스냅 효과 적용
        this.applySnapEffect();
        
        // Easing 적용 (lerp - linear interpolation)
        const diff = this.targetScroll - this.currentScroll;
        
        // 차이가 아주 작으면 멈춤 (성능 최적화)
        if (Math.abs(diff) < 0.1) {
            this.currentScroll = this.targetScroll;
        } else {
            this.currentScroll += diff * this.ease;
        }
        
        // 실제 스크롤 적용
        window.scrollTo(0, this.currentScroll);
    }

    startRAF() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.raf();
    }

    raf() {
        this.updateScroll();
        requestAnimationFrame(() => this.raf());
    }

    // 외부에서 스크롤 위치 설정 (버튼 클릭 등)
    scrollTo(target, duration = 1000) {
        this.targetScroll = target;
        
        // 범위 제한
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        this.targetScroll = Math.max(0, Math.min(this.targetScroll, maxScroll));
    }
}

// 페이지 로드 시 초기화
let smoothScrollInstance = null;

window.addEventListener('DOMContentLoaded', () => {
    // 약간의 지연 후 초기화 (다른 스크립트와의 충돌 방지)
    setTimeout(() => {
        smoothScrollInstance = new SmoothScroll();
        
        // 전역으로 접근 가능하게
        window.smoothScroll = smoothScrollInstance;
    }, 100);
});

// 앵커 링크 처리
document.addEventListener('click', (e) => {
    const target = e.target.closest('a[href^="#"]');
    if (target && smoothScrollInstance) {
        e.preventDefault();
        const targetId = target.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 80;
            const targetPosition = targetElement.offsetTop - navbarHeight;
            smoothScrollInstance.scrollTo(targetPosition);
        }
    }
});
