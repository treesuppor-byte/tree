(() => {
  const body = document.body;
  const currentPage = body.dataset.page;
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  const menuIcon = document.querySelector('[data-menu-icon]');

  if (currentPage === 'home') {
    document.querySelectorAll('main > section[data-journey]').forEach((section, index) => {
      const marker = document.createElement('span');
      const content = document.createElement('span');
      const row = document.createElement('span');
      const number = document.createElement('span');
      const label = document.createElement('span');
      marker.className = 'page-journey-marker';
      content.className = 'page-journey-marker__content';
      row.className = 'page-journey-marker__row';
      marker.setAttribute('aria-hidden', 'true');
      number.textContent = String(index + 1).padStart(2, '0');
      label.textContent = section.dataset.journey;
      row.append(number, label);
      content.append(row);
      marker.append(content);
      section.prepend(marker);
    });
  }

  document.querySelectorAll(`[data-nav="${currentPage}"]`).forEach((link) => {
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
  });

  const closeMenu = () => {
    if (!menuToggle || !mobileNav || !menuIcon) return;
    mobileNav.classList.remove('is-open');
    body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '메뉴 열기');
    menuIcon.classList.remove('icon-close');
    menuIcon.classList.add('icon-menu');
  };

  if (menuToggle && mobileNav && menuIcon) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      body.classList.toggle('menu-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
      menuIcon.classList.toggle('icon-menu', !isOpen);
      menuIcon.classList.toggle('icon-close', isOpen);
    });

    mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) closeMenu();
    });
  }

  const titleTargets = document.querySelectorAll(
    'main section h2, .page-hero__title, .pplus-hero__title'
  );
  const preferredCorePhrases = [
    '실제 흐름',
    '빠르고 간편하게',
    '하나의 흐름',
    '고민하지 않아도',
    '내 통장에 들어오는 순간',
    '검토 기준',
    '골라 연결',
    '장부 앱',
    '한눈에',
    '많이 묻는 내용',
    '바로 정리',
    '한 번에',
    '사업 상황에 맞춰',
    '빠르게 비교',
    '네 단계',
    '먼저 상담',
    '더 편리해지는',
    '세 가지 기준',
    '회사 정보',
    '함께 정리',
    '바로 상담',
    '자주 묻는 질문',
    '공지사항',
    '바로 문의',
    '쉽게 확인',
    '놓치지 마세요',
    '보는 순서는 단순하게',
    '쉽게 관리',
    '찾을 수 없습니다',
    '서포트리'
  ];

  const addPencilUnderline = (core) => core.classList.add('pencil-underline');
  const wrapTitleLines = (title) => {
    const nodes = [...title.childNodes];
    const fragment = document.createDocumentFragment();
    let line = document.createElement('span');
    line.className = 'pencil-title__line';

    nodes.forEach((node) => {
      if (node.nodeName !== 'BR') {
        line.append(node);
        return;
      }
      fragment.append(line, node);
      line = document.createElement('span');
      line.className = 'pencil-title__line';
    });
    fragment.append(line);
    title.replaceChildren(fragment);
  };

  titleTargets.forEach((title) => {
    if (currentPage === 'pplus') {
      if (!title.closest('.reveal')) title.classList.add('reveal');
      return;
    }

    title.classList.add('pencil-title');
    if (!title.closest('.reveal')) title.classList.add('reveal');

    let underlineAdded = false;
    const preferredCore = preferredCorePhrases.find((phrase) =>
      title.textContent.includes(phrase)
    );
    if (preferredCore) {
      const phraseWalker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      while (phraseWalker.nextNode()) {
        const node = phraseWalker.currentNode;
        const phraseIndex = node.textContent.indexOf(preferredCore);
        if (phraseIndex < 0) continue;
        const core = document.createElement('span');
        core.textContent = preferredCore;
        node.replaceWith(
          document.createTextNode(node.textContent.slice(0, phraseIndex)),
          core,
          document.createTextNode(node.textContent.slice(phraseIndex + preferredCore.length))
        );
        addPencilUnderline(core);
        underlineAdded = true;
        break;
      }
    }

    const existingCore = title.querySelector(':scope > span');
    if (!underlineAdded && existingCore) {
      addPencilUnderline(existingCore);
      underlineAdded = true;
    }

    if (!underlineAdded) {
      const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
      }
      const lastText = textNodes.at(-1);
      const match = lastText?.textContent.match(/^(.*?)(\S+)(\s*)$/s);
      if (match) {
        const core = document.createElement('span');
        core.textContent = match[2];
        lastText.replaceWith(
          document.createTextNode(match[1]),
          core,
          document.createTextNode(match[3])
        );
        addPencilUnderline(core);
      }
    }

    wrapTitleLines(title);
  });

  const sideRails = document.querySelectorAll('.home-side-rail');
  if (sideRails.length) {
    let previousScrollY = window.scrollY;
    let sideRailFrame = 0;
    const updateSideRails = () => {
      const currentScrollY = window.scrollY;
      const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      let target = 50;
      if (currentScrollY > 2 && currentScrollY < maximumScroll - 2) {
        if (currentScrollY > previousScrollY) target = 25;
        if (currentScrollY < previousScrollY) target = 75;
      }
      body.style.setProperty('--home-inscription-y', `${target}%`);
      previousScrollY = currentScrollY;
      sideRailFrame = 0;
    };
    const requestSideRailUpdate = () => {
      if (sideRailFrame) return;
      sideRailFrame = window.requestAnimationFrame(updateSideRails);
    };
    updateSideRails();
    window.addEventListener('scroll', requestSideRailUpdate, { passive: true });
    window.addEventListener('resize', requestSideRailUpdate);
  }

  const homeVideoMini = document.querySelector('.home-video-mini');
  const homeVideoSection = document.querySelector('#supportree-video');
  const homeVideoMiniPlayer = homeVideoMini?.querySelector('video');
  const homeVideoSound = homeVideoMini?.querySelector('[data-video-sound]');
  const homeVideoClose = homeVideoMini?.querySelector('[data-video-close]');
  const setHomeVideoSound = (isAudible) => {
    if (!homeVideoMiniPlayer || !homeVideoSound) return;
    homeVideoMiniPlayer.muted = !isAudible;
    homeVideoSound.classList.toggle('is-audible', isAudible);
    homeVideoSound.setAttribute('aria-pressed', String(isAudible));
    homeVideoSound.setAttribute('aria-label', isAudible ? '영상 소리 끄기' : '영상 소리 켜기');
  };
  if (homeVideoMiniPlayer && homeVideoSound) {
    setHomeVideoSound(false);
    homeVideoSound.addEventListener('click', () => {
      const shouldPlaySound = homeVideoMiniPlayer.muted;
      setHomeVideoSound(shouldPlaySound);
      if (shouldPlaySound && homeVideoMiniPlayer.paused) {
        homeVideoMiniPlayer.play().catch(() => setHomeVideoSound(false));
      }
    });
  }
  if (homeVideoMini && homeVideoClose) {
    homeVideoClose.addEventListener('click', () => {
      setHomeVideoSound(false);
      homeVideoMiniPlayer?.pause();
      homeVideoMini.classList.add('is-dismissed');
    });
  }
  if (homeVideoMini && homeVideoSection && 'IntersectionObserver' in window) {
    const homeVideoObserver = new IntersectionObserver(
      ([entry]) => {
        homeVideoMini.classList.toggle('is-hidden', entry.isIntersecting);
        if (entry.isIntersecting) setHomeVideoSound(false);
      },
      { threshold: 0.18 }
    );
    homeVideoObserver.observe(homeVideoSection);
  }

  const floatingContact = document.querySelector('.floating-contact');
  if (floatingContact) {
    const floatingTop = document.createElement('button');
    floatingTop.className = 'floating-top';
    floatingTop.type = 'button';
    floatingTop.setAttribute('aria-label', '페이지 맨 위로 이동');
    floatingTop.innerHTML = '<span class="sr-only">맨 위로</span>';
    floatingContact.before(floatingTop);

    const updateFloatingTop = () => {
      floatingTop.classList.toggle(
        'is-visible',
        window.scrollY > Math.min(520, window.innerHeight * 0.65)
      );
    };
    updateFloatingTop();
    window.addEventListener('scroll', updateFloatingTop, { passive: true });
    floatingTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: body.classList.contains('reduce-motion') ? 'auto' : 'smooth'
      });
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  const journeyMarkers = document.querySelectorAll('.page-journey-marker');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) body.classList.add('reduce-motion');

  document.querySelectorAll('a[href*="pf.kakao.com"]:not(.floating-contact)').forEach((link) => {
    const label = '카톡 상담하기';
    const base = document.createElement('span');
    const fill = document.createElement('span');
    base.className = 'kakao-link__content kakao-link__base';
    fill.className = 'kakao-link__content kakao-link__fill';
    base.textContent = label;
    fill.textContent = label;
    fill.setAttribute('aria-hidden', 'true');
    link.replaceChildren(base, fill);
    link.setAttribute('aria-label', label);
    link.classList.add('kakao-link');
  });

  const rollingCounters = [];
  document
    .querySelectorAll(
      '.home-trust-facts dd, .business-metric strong, .about-stats .stat-card__number'
    )
    .forEach((number) => {
      const finalText = number.textContent.trim();
      number.setAttribute('aria-label', finalText);
      if (prefersReducedMotion) return;

      const visual = document.createElement('span');
      const digits = [];
      visual.className = 'trust-number';
      visual.setAttribute('aria-hidden', 'true');

      [...finalText].forEach((character) => {
        if (!/\d/.test(character)) {
          visual.append(character);
          return;
        }

        const digit = document.createElement('span');
        const reel = document.createElement('span');
        digit.className = 'trust-digit';
        digit.style.setProperty('--digit', character);
        reel.className = 'trust-digit__reel';
        reel.style.animationDelay = `${digits.length * -37}ms`;

        for (let value = 0; value <= 9; value += 1) {
          const item = document.createElement('span');
          item.textContent = String(value);
          reel.append(item);
        }

        digit.append(reel);
        visual.append(digit);
        digits.push(digit);
      });

      number.textContent = '';
      number.append(visual);
      rollingCounters.push({ element: number, digits });
    });

  const settleCounter = ({ element, digits }) => {
    if (element.dataset.counterSettled) return;
    element.dataset.counterSettled = 'true';
    [...digits].reverse().forEach((digit, index) => {
      window.setTimeout(() => digit.classList.add('is-settled'), 850 + index * 220);
    });
  };

  if (rollingCounters.length) {
    if (!('IntersectionObserver' in window)) {
      rollingCounters.forEach(settleCounter);
    } else {
      const counterObserver = new IntersectionObserver(
        (entries, instance) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const counter = rollingCounters.find(({ element }) => element === entry.target);
            if (counter) settleCounter(counter);
            instance.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.25 }
      );
      rollingCounters.forEach(({ element }) => counterObserver.observe(element));
    }
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    journeyMarkers.forEach((marker) => marker.classList.add('is-visible'));
  } else {
    const journeyObserver = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        instance.unobserve(entry.target);
      });
    }, { rootMargin: '-49% 0px -49% 0px', threshold: 0 });

    const viewportCenter = window.innerHeight / 2;
    journeyMarkers.forEach((marker) => {
      if (marker.getBoundingClientRect().top <= viewportCenter) {
        marker.classList.add('is-visible');
      } else {
        journeyObserver.observe(marker);
      }
    });
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        instance.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach((item) => observer.observe(item));
  }

  document.querySelectorAll('.faq-item, .notice-item').forEach((details) => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.faq-item__answer, .notice-item__content');
    if (!summary || !content) return;

    summary.setAttribute('aria-expanded', String(details.open));

    if (prefersReducedMotion || !Element.prototype.animate) {
      details.addEventListener('toggle', () => {
        summary.setAttribute('aria-expanded', String(details.open));
      });
      return;
    }

    const duration = 220;
    const easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

    const clearAnimationState = () => {
      details.dataset.animating = '';
      details.classList.remove('is-closing');
      details.style.height = '';
      details.style.overflow = '';
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
    };

    const openDetails = () => {
      const startHeight = details.offsetHeight;
      details.open = true;
      summary.setAttribute('aria-expanded', 'true');
      const targetHeight = details.offsetHeight;

      details.style.height = `${startHeight}px`;
      details.style.overflow = 'hidden';
      content.style.opacity = '0';

      const sizeAnimation = details.animate([
        { height: `${startHeight}px` },
        { height: `${targetHeight}px` },
      ], { duration, easing });
      const contentAnimation = content.animate([
        { opacity: 0 },
        { opacity: 1 },
      ], { duration: Math.round(duration * 0.82), easing, fill: 'forwards' });

      details.dataset.animating = 'open';
      sizeAnimation.onfinish = clearAnimationState;
      sizeAnimation.oncancel = () => {
        contentAnimation.cancel();
        clearAnimationState();
      };
    };

    const closeDetails = () => {
      const startHeight = details.offsetHeight;
      const borderHeight = details.offsetHeight - details.clientHeight;
      const targetHeight = summary.offsetHeight + borderHeight;
      details.classList.add('is-closing');
      details.style.height = `${startHeight}px`;
      details.style.overflow = 'hidden';
      content.style.opacity = '1';

      const sizeAnimation = details.animate([
        { height: `${startHeight}px` },
        { height: `${targetHeight}px` },
      ], { duration, easing });
      const contentAnimation = content.animate([
        { opacity: 1 },
        { opacity: 0 },
      ], { duration: Math.round(duration * 0.72), easing, fill: 'forwards' });

      details.dataset.animating = 'close';
      sizeAnimation.onfinish = () => {
        details.style.height = `${targetHeight}px`;
        content.style.opacity = '0';
        details.open = false;
        summary.setAttribute('aria-expanded', 'false');
        clearAnimationState();
      };
      sizeAnimation.oncancel = () => {
        contentAnimation.cancel();
        clearAnimationState();
      };
    };

    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (details.dataset.animating) return;

      if (details.open) {
        closeDetails();
      } else {
        openDetails();
      }
    });
  });

  document.querySelectorAll('[data-faq-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.faqFilter;
      document.querySelectorAll('[data-faq-filter]').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');

      document.querySelectorAll('[data-faq-category]').forEach((item) => {
        const matches = category === 'all' || item.dataset.faqCategory === category;
        item.hidden = !matches;
      });
    });
  });
})();
