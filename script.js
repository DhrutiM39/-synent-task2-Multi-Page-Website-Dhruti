class SteamAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        const isSmallScreen = window.matchMedia && window.matchMedia('(max-width: 480px)').matches;
        this.particleCount = isSmallScreen ? 30 : 46;

        this.animationFrame = null;

        this.resizeHandler = this.resize.bind(this);

        this.resize();
        this.createParticles();
        window.addEventListener('resize', this.resizeHandler);
        this.animate = this.animate.bind(this);
        this.animate();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;

        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * pixelRatio;
        this.canvas.height = this.height * pixelRatio;
        this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    createParticles() {
        this.particles = Array.from({ length: this.particleCount }, () => (
            this.createParticle(Math.random())
        ));
    }

    createParticle(progress = 0) {
        const cup = this.getCupMetrics();
        const spread = cup.width * 0.28;

        return {
            baseX: cup.centerX + (Math.random() - 0.5) * spread,
            x: cup.centerX,
            y: cup.top,
            radius: 5 + Math.random() * 10,
            speed: 0.25 + Math.random() * 0.45,
            drift: (Math.random() - 0.5) * 0.45,
            wave: Math.random() * Math.PI * 2,
            waveSpeed: 0.012 + Math.random() * 0.018,
            life: progress,
            lifeSpeed: 0.0035 + Math.random() * 0.004,
            opacity: 0
        };
    }

    resetParticle(particle) {
        Object.assign(particle, this.createParticle(0));
    }

    getCupMetrics() {
        const size = Math.min(this.width, this.height);
        const centerX = this.width * 0.5;
        const top = this.height * 0.58;
        const width = size * 0.52;
        const height = size * 0.22;

        return {
            centerX,
            top,
            width,
            height,
            left: centerX - width / 2,
            right: centerX + width / 2,
            bottom: top + height
        };
    }

    updateParticle(particle) {
        particle.life += particle.lifeSpeed;
        particle.wave += particle.waveSpeed;
        particle.y -= particle.speed;
        particle.baseX += particle.drift;
        particle.x = particle.baseX + Math.sin(particle.wave) * 18;

        const fadeIn = Math.min(particle.life / 0.25, 1);
        const fadeOut = Math.max(1 - particle.life, 0);
        particle.opacity = Math.min(fadeIn, fadeOut) * 0.5;

        if (particle.life >= 1 || particle.y < this.height * 0.12) {
            this.resetParticle(particle);
        }
    }

    drawParticle(particle) {
        const gradient = this.ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.radius
        );

        gradient.addColorStop(0, `rgba(245, 235, 221, ${particle.opacity})`);
        gradient.addColorStop(1, 'rgba(245, 235, 221, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawCup() {
        const cup = this.getCupMetrics();
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = '#E8A559';
        ctx.lineWidth = Math.max(4, this.width * 0.012);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.ellipse(cup.centerX, cup.top, cup.width / 2, cup.height * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cup.left + cup.width * 0.08, cup.top + cup.height * 0.08);
        ctx.quadraticCurveTo(cup.left + cup.width * 0.14, cup.bottom, cup.centerX, cup.bottom);
        ctx.quadraticCurveTo(cup.right - cup.width * 0.14, cup.bottom, cup.right - cup.width * 0.08, cup.top + cup.height * 0.08);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cup.right - cup.width * 0.03, cup.top + cup.height * 0.22);
        ctx.bezierCurveTo(
            cup.right + cup.width * 0.28,
            cup.top + cup.height * 0.15,
            cup.right + cup.width * 0.28,
            cup.bottom - cup.height * 0.12,
            cup.right - cup.width * 0.02,
            cup.bottom - cup.height * 0.08
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cup.left + cup.width * 0.12, cup.bottom + cup.height * 0.16);
        ctx.quadraticCurveTo(cup.centerX, cup.bottom + cup.height * 0.35, cup.right - cup.width * 0.12, cup.bottom + cup.height * 0.16);
        ctx.stroke();

        ctx.restore();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    animate() {
        this.clear();
        this.particles.forEach((particle) => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });
        this.drawCup();
        this.animationFrame = requestAnimationFrame(this.animate);
    }

    destroy() {
        cancelAnimationFrame(this.animationFrame);
        window.removeEventListener('resize', this.resizeHandler);
    }
}

class ScrollReveal {
    constructor(selector = '.reveal', options = {}) {
        this.elements = document.querySelectorAll(selector);
        this.visibleClass = options.visibleClass || 'is-visible';
        this.observerOptions = {
            threshold: options.threshold || 0.18,
            rootMargin: options.rootMargin || '0px 0px -60px 0px'
        };

        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            this.elements.forEach((element) => this.reveal(element));
            return;
        }

        this.observer = new IntersectionObserver(
            this.handleIntersect.bind(this),
            this.observerOptions
        );

        this.elements.forEach((element) => this.observer.observe(element));
    }

    handleIntersect(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                this.reveal(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    reveal(element) {
        element.classList.add(this.visibleClass);
    }
}

class TestimonialSlider {
    constructor(selector = '.testimonial-slider', intervalTime = 4000) {
        this.slider = document.querySelector(selector);

        if (!this.slider) {
            return;
        }

        this.cards = this.slider.querySelectorAll('.testimonial-card');
        this.prevButton = this.slider.querySelector('.testimonial-prev');
        this.nextButton = this.slider.querySelector('.testimonial-next');
        this.currentIndex = 0;
        this.intervalTime = intervalTime;
        this.interval = null;

        this.init();
    }

    init() {
        this.showSlide(this.currentIndex);
        this.prevButton.addEventListener('click', () => this.prev());
        this.nextButton.addEventListener('click', () => this.next());
        this.startAutoRotate();
    }

    showSlide(index) {
        this.cards.forEach((card, cardIndex) => {
            card.classList.toggle('is-active', cardIndex === index);
        });
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.cards.length;
        this.showSlide(this.currentIndex);
        this.restartAutoRotate();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
        this.showSlide(this.currentIndex);
        this.restartAutoRotate();
    }

    startAutoRotate() {
        this.interval = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.cards.length;
            this.showSlide(this.currentIndex);
        }, this.intervalTime);
    }

    restartAutoRotate() {
        clearInterval(this.interval);
        this.startAutoRotate();
    }
}

class MobileNavbar {
    constructor(toggleSelector = '.nav-toggle', menuSelector = '.nav-links') {
        this.toggle = document.querySelector(toggleSelector);
        this.menu = document.querySelector(menuSelector);

        if (!this.toggle || !this.menu) {
            return;
        }

        this.init();
    }

    init() {
        this.toggle.addEventListener('click', () => this.toggleMenu());
        this.menu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => this.closeMenu());
        });
    }

    toggleMenu() {
        const isOpen = this.menu.classList.toggle('is-open');
        this.toggle.classList.toggle('is-open', isOpen);
        this.toggle.setAttribute('aria-expanded', isOpen);
        this.toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }

    closeMenu() {
        this.menu.classList.remove('is-open');
        this.toggle.classList.remove('is-open');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.toggle.setAttribute('aria-label', 'Open menu');
    }
}

class Timeline {
    constructor(selector = '.timeline') {
        this.timeline = document.querySelector(selector);

        if (!this.timeline) {
            return;
        }

        this.items = this.timeline.querySelectorAll('.timeline-item');
        this.init();
    }

    init() {
        this.timeline.classList.add('is-enhanced');
        this.items.forEach((item, index) => {
            item.style.setProperty('--timeline-index', `"${index + 1}"`);
        });
    }
}

const menuItems = [
    {
        name: 'House Espresso',
        desc: 'Balanced, rich, and caramel-sweet with a smooth finish.',
        price: 'Rs. 180',
        category: 'coffee'
    },
    {
        name: 'Pour-Over Single Origin',
        desc: 'Rotating seasonal beans brewed slowly for clarity and aroma.',
        price: 'Rs. 240',
        category: 'coffee'
    },
    {
        name: 'Vanilla Cold Brew',
        desc: 'Steeped overnight, lightly sweetened, and served over ice.',
        price: 'Rs. 220',
        category: 'coffee'
    },
    {
        name: 'Cappuccino',
        desc: 'Double espresso with steamed milk and a soft foam cap.',
        price: 'Rs. 210',
        category: 'coffee'
    },
    {
        name: 'Butter Croissant',
        desc: 'Flaky pastry with a soft center, baked fresh each morning.',
        price: 'Rs. 160',
        category: 'pastries'
    },
    {
        name: 'Cinnamon Roll',
        desc: 'Warm cinnamon swirl finished with a light vanilla glaze.',
        price: 'Rs. 170',
        category: 'pastries'
    },
    {
        name: 'Almond Biscotti',
        desc: 'Crisp twice-baked biscuit made for dipping into espresso.',
        price: 'Rs. 130',
        category: 'pastries'
    },
    {
        name: 'Chocolate Muffin',
        desc: 'Tender cocoa muffin with dark chocolate chunks.',
        price: 'Rs. 150',
        category: 'pastries'
    },
    {
        name: 'Office Coffee Box',
        desc: 'Fresh filter coffee for small meetings, served with cups and stirrers.',
        price: 'Rs. 900',
        category: 'catering'
    },
    {
        name: 'Pastry Sharing Tray',
        desc: 'Assorted croissants, muffins, and biscotti for eight guests.',
        price: 'Rs. 1200',
        category: 'catering'
    },
    {
        name: 'Event Brew Bar',
        desc: 'A staffed coffee counter with espresso, cold brew, and custom drinks.',
        price: 'Rs. 4500',
        category: 'catering'
    },
    {
        name: 'Bean Gift Set',
        desc: 'Two fresh roast bags packed with tasting notes and brew tips.',
        price: 'Rs. 850',
        category: 'catering'
    }
];

class MenuFilter {
    constructor({
        tabsSelector = '.menu-tabs',
        gridSelector = '[data-menu-grid]',
        emptySelector = '[data-menu-empty]',
        items = menuItems,
        hiddenClass = 'is-filtered-out',
        transitionTime = 260
    } = {}) {
        this.tabList = document.querySelector(tabsSelector);
        this.grid = document.querySelector(gridSelector);
        this.emptyState = document.querySelector(emptySelector);
        this.items = items;
        this.hiddenClass = hiddenClass;
        this.transitionTime = transitionTime;
        this.activeCategory = 'all';
        this.hideTimers = new Map();

        if (!this.tabList || !this.grid) {
            return;
        }

        this.tabs = this.tabList.querySelectorAll('.menu-tab');
        this.init();
    }

    init() {
        const activeTab = this.tabList.querySelector('.menu-tab.is-active') || this.tabs[0];
        this.activeCategory = activeTab.dataset.category || 'all';
        this.renderAllItems();
        this.filterItems(this.activeCategory);

        this.tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const nextCategory = tab.dataset.category || 'all';

                if (nextCategory === this.activeCategory) {
                    return;
                }

                this.activateTab(tab);
                this.activeCategory = nextCategory;
                this.filterItems(this.activeCategory);
            });
        });
    }

    activateTab(activeTab) {
        this.tabs.forEach((tab) => {
            const isActive = tab === activeTab;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    }

    renderAllItems() {
        this.grid.innerHTML = this.items.map((item) => `
            <article class="menu-card reveal is-visible" data-category="${item.category}">
                <div class="menu-card-main">
                    <h2>${item.name}</h2>
                    <p>${item.desc}</p>
                </div>
                <strong>${item.price}</strong>
            </article>
        `).join('');
        this.cards = this.grid.querySelectorAll('.menu-card');
    }

    filterItems(category) {
        let visibleCount = 0;

        this.cards.forEach((card) => {
            const shouldShow = category === 'all' || card.dataset.category === category;

            if (shouldShow) {
                visibleCount += 1;
                this.showCard(card);
                return;
            }

            this.hideCard(card);
        });

        this.updateEmptyState(visibleCount);
    }

    showCard(card) {
        clearTimeout(this.hideTimers.get(card));
        this.hideTimers.delete(card);
        card.hidden = false;
        requestAnimationFrame(() => {
            card.classList.remove(this.hiddenClass);
        });
    }

    hideCard(card) {
        clearTimeout(this.hideTimers.get(card));
        card.classList.add(this.hiddenClass);

        const timer = setTimeout(() => {
            card.hidden = true;
            this.hideTimers.delete(card);
        }, this.transitionTime);

        this.hideTimers.set(card, timer);
    }

    updateEmptyState(visibleCount) {
        if (!this.emptyState) {
            return;
        }

        this.emptyState.hidden = visibleCount > 0;
    }
}

class ServiceFilter {
    constructor({
        tabsSelector = '[data-service-tabs]',
        gridSelector = '[data-services-grid]',
        emptySelector = '[data-services-empty]',
        hiddenClass = 'is-filtered-out',
        transitionTime = 260
    } = {}) {
        this.tabList = document.querySelector(tabsSelector);
        this.grid = document.querySelector(gridSelector);
        this.emptyState = document.querySelector(emptySelector);
        this.hiddenClass = hiddenClass;
        this.transitionTime = transitionTime;
        this.hideTimers = new Map();
        this.activeCategory = 'all';

        if (!this.tabList || !this.grid) {
            return;
        }

        this.tabs = this.tabList.querySelectorAll('.category-tab');
        this.cards = this.grid.querySelectorAll('.service-card');
        this.init();
    }

    init() {
        const activeTab = this.tabList.querySelector('.category-tab.is-active') || this.tabs[0];
        this.activeCategory = activeTab.dataset.category || 'all';
        this.filterItems(this.activeCategory);

        this.tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const nextCategory = tab.dataset.category || 'all';

                if (nextCategory === this.activeCategory) {
                    return;
                }

                this.activateTab(tab);
                this.activeCategory = nextCategory;
                this.filterItems(this.activeCategory);
            });
        });
    }

    activateTab(activeTab) {
        this.tabs.forEach((tab) => {
            const isActive = tab === activeTab;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    }

    filterItems(category) {
        let visibleCount = 0;

        this.cards.forEach((card) => {
            const shouldShow = category === 'all' || card.dataset.category === category;

            if (shouldShow) {
                visibleCount += 1;
                this.showCard(card);
                return;
            }

            this.hideCard(card);
        });

        this.updateEmptyState(visibleCount);
    }

    showCard(card) {
        clearTimeout(this.hideTimers.get(card));
        this.hideTimers.delete(card);
        card.hidden = false;
        requestAnimationFrame(() => {
            card.classList.remove(this.hiddenClass);
        });
    }

    hideCard(card) {
        clearTimeout(this.hideTimers.get(card));
        card.classList.add(this.hiddenClass);

        const timer = setTimeout(() => {
            card.hidden = true;
            this.hideTimers.delete(card);
        }, this.transitionTime);

        this.hideTimers.set(card, timer);
    }

    updateEmptyState(visibleCount) {
        if (!this.emptyState) {
            return;
        }

        this.emptyState.hidden = visibleCount > 0;
    }
}

class FormValidator {
    constructor(selector = '.contact-form') {
        this.form = document.querySelector(selector);
        if (!this.form) return;

        this.fields = {
            name: this.form.elements.name,
            email: this.form.elements.email,
            phone: this.form.elements.phone,
            message: this.form.elements.message
        };

        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.defaultButtonText = this.submitButton ? this.submitButton.textContent : '';

        this.successMessage = document.getElementById('successMessage');

        this.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.phonePattern = /^\d+$/;

        this.MIN_NAME_LEN = 2;
        // Task says: Phone (jo required hoy) digits-only + length check.
        // We'll validate only when phone is provided.
        this.MIN_PHONE_LEN = 10;
        this.MAX_PHONE_LEN = 15;
        this.MIN_MESSAGE_LEN = 10;

        this.bindEvents();
    }

    bindEvents() {
        Object.values(this.fields).forEach((field) => {
            if (!field) return;

            field.addEventListener('input', () => {
                this.validateField(field, false);
            });

            field.addEventListener('blur', () => {
                this.validateField(field, true);
            });
        });

        this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    }

    getFieldErrorElement(field) {
        const group = field.closest('.form-group');
        if (!group) return null;
        return group.querySelector('.error-message');
    }

    setValidationState(field, { message = '', showSuccess = true } = {}) {
        const group = field.closest('.form-group');
        const errorEl = this.getFieldErrorElement(field);
        if (!group || !errorEl) return;

        const hasError = Boolean(message);
        const valuePresent = field.value.trim().length > 0;
        const isValid = !hasError && valuePresent;

        group.classList.toggle('is-invalid', hasError);
        group.classList.toggle('is-valid', showSuccess && isValid);

        // Accessibility
        field.setAttribute('aria-invalid', String(hasError));

        // Inline feedback text
        errorEl.textContent = message;
    }

    clearValidationState(field) {
        const group = field.closest('.form-group');
        const errorEl = this.getFieldErrorElement(field);
        if (!group || !errorEl) return;

        group.classList.remove('is-invalid', 'is-valid');
        errorEl.textContent = '';
        field.removeAttribute('aria-invalid');
    }

    validateField(field, showSuccess = true) {
        const value = field.value.trim();
        let message = '';

        if (field.name === 'name') {
            if (!value) {
                message = 'Please enter your name.';
            } else if (value.length < this.MIN_NAME_LEN) {
                message = `Name must be at least ${this.MIN_NAME_LEN} characters.`;
            }
        }

        if (field.name === 'email') {
            if (!value) {
                message = 'Please enter your email.';
            } else if (!this.emailPattern.test(value)) {
                message = 'Please enter a valid email address.';
            }
        }

        if (field.name === 'phone') {
            // Optional: validate only when user enters something
            if (value) {
                if (!this.phonePattern.test(value)) {
                    message = 'Phone number must contain digits only.';
                } else if (value.length < this.MIN_PHONE_LEN || value.length > this.MAX_PHONE_LEN) {
                    message = `Phone number must be ${this.MIN_PHONE_LEN} to ${this.MAX_PHONE_LEN} digits.`;
                }
            }
        }

        if (field.name === 'message') {
            if (!value) {
                message = 'Please write a message.';
            } else if (value.length < this.MIN_MESSAGE_LEN) {
                message = `Message must be at least ${this.MIN_MESSAGE_LEN} characters.`;
            }
        }

        if (!value && field.name === 'phone') {
            // Phone empty => valid
            this.clearValidationState(field);
            return true;
        }

        this.setValidationState(field, { message, showSuccess });
        return !message;
    }

    handleSubmit(event) {
        event.preventDefault();

        // Hide success UI on attempt
        if (this.successMessage) {
            this.successMessage.style.display = 'none';
        }

        // Validate all fields (phone can be empty)
        const fields = Object.values(this.fields).filter(Boolean);
        let allValid = true;

        fields.forEach((field) => {
            const ok = this.validateField(field, true);
            if (!ok) allValid = false;
        });

        if (!allValid) {
            // Block submit - errors already highlighted inline
            return;
        }

        this.simulateSubmit();
    }

    setSubmitting(isSubmitting) {
        if (!this.submitButton) return;
        this.submitButton.disabled = isSubmitting;
        this.submitButton.textContent = isSubmitting ? 'Sending...' : this.defaultButtonText;
    }

    simulateSubmit() {
        this.setSubmitting(true);

        setTimeout(() => {
            // Reset form
            this.form.reset();

            // Clear validation UI
            Object.values(this.fields).filter(Boolean).forEach((field) => this.clearValidationState(field));

            // Show success message
            if (this.successMessage) {
                this.successMessage.style.display = 'block';
            }

            this.setSubmitting(false);
        }, 900);
    }
}


class OrderPage {
    constructor({
        tabsSelector = '[data-order-tabs]',
        gridSelector = '[data-order-grid]',
        emptySelector = '[data-order-empty]',
        summaryListSelector = '[data-order-summary-list]',
        summaryEmptySelector = '[data-order-summary-empty]',
        summaryTotalSelector = '[data-order-summary-total]',
        subtotalSelector = '[data-order-subtotal]',
        placeOrderSelector = '[data-place-order]',
        successSelector = '[data-order-success]',
        items = menuItems,
        transitionTime = 260
    } = {}) {
        this.tabList = document.querySelector(tabsSelector);
        this.grid = document.querySelector(gridSelector);
        this.emptyState = document.querySelector(emptySelector);
        this.summaryList = document.querySelector(summaryListSelector);
        this.summaryEmpty = document.querySelector(summaryEmptySelector);
        this.summaryTotal = document.querySelector(summaryTotalSelector);
        this.subtotalEl = document.querySelector(subtotalSelector);
        this.placeOrderBtn = document.querySelector(placeOrderSelector);
        this.successEl = document.querySelector(successSelector);
        this.transitionTime = transitionTime;

        if (!this.grid || !this.tabList) {
            return;
        }

        this.items = items.map((item, index) => ({
            ...item,
            id: `order-item-${index}`,
            priceValue: this.parsePrice(item.price)
        }));

        this.quantities = new Map();
        this.activeCategory = 'all';
        this.hideTimers = new Map();
        this.defaultButtonText = this.placeOrderBtn ? this.placeOrderBtn.textContent : 'Place Order';

        this.init();
    }

    parsePrice(priceText) {
        const match = String(priceText).replace(/,/g, '').match(/\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
    }

    formatPrice(value) {
        return `Rs. ${Math.round(value).toLocaleString('en-IN')}`;
    }

    init() {
        this.renderItems();

        this.tabs = this.tabList.querySelectorAll('.menu-tab');
        const activeTab = this.tabList.querySelector('.menu-tab.is-active') || this.tabs[0];
        this.activeCategory = activeTab.dataset.category || 'all';
        this.filterItems(this.activeCategory);

        this.tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const nextCategory = tab.dataset.category || 'all';

                if (nextCategory === this.activeCategory) {
                    return;
                }

                this.activateTab(tab);
                this.activeCategory = nextCategory;
                this.filterItems(this.activeCategory);
            });
        });

        if (this.placeOrderBtn) {
            this.placeOrderBtn.addEventListener('click', () => this.placeOrder());
        }

        this.updateSummary();
    }

    activateTab(activeTab) {
        this.tabs.forEach((tab) => {
            const isActive = tab === activeTab;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    }

    renderItems() {
        this.grid.innerHTML = this.items.map((item) => `
            <article class="menu-card order-card reveal is-visible" data-category="${item.category}" data-item-id="${item.id}">
                <div class="menu-card-main">
                    <h2>${item.name}</h2>
                    <p>${item.desc}</p>
                    <strong>${item.price}</strong>
                </div>
                <div class="qty-stepper" role="group" aria-label="Quantity for ${item.name}">
                    <button type="button" class="qty-btn qty-decrease" aria-label="Decrease quantity of ${item.name}">−</button>
                    <span class="qty-value" data-qty-value="${item.id}" aria-live="polite">0</span>
                    <button type="button" class="qty-btn qty-increase" aria-label="Increase quantity of ${item.name}">+</button>
                </div>
            </article>
        `).join('');

        this.cards = this.grid.querySelectorAll('.order-card');

        this.cards.forEach((card) => {
            const id = card.dataset.itemId;
            const decreaseBtn = card.querySelector('.qty-decrease');
            const increaseBtn = card.querySelector('.qty-increase');

            decreaseBtn.addEventListener('click', () => this.changeQty(id, -1));
            increaseBtn.addEventListener('click', () => this.changeQty(id, 1));
        });
    }

    changeQty(id, delta) {
        const current = this.quantities.get(id) || 0;
        const next = Math.max(0, Math.min(20, current + delta));

        if (next === 0) {
            this.quantities.delete(id);
        } else {
            this.quantities.set(id, next);
        }

        const valueEl = this.grid.querySelector(`[data-qty-value="${id}"]`);
        if (valueEl) {
            valueEl.textContent = String(next);
        }

        this.updateSummary();
    }

    filterItems(category) {
        let visibleCount = 0;

        this.cards.forEach((card) => {
            const shouldShow = category === 'all' || card.dataset.category === category;

            if (shouldShow) {
                visibleCount += 1;
                this.showCard(card);
                return;
            }

            this.hideCard(card);
        });

        if (this.emptyState) {
            this.emptyState.hidden = visibleCount > 0;
        }
    }

    showCard(card) {
        clearTimeout(this.hideTimers.get(card));
        this.hideTimers.delete(card);
        card.hidden = false;
        requestAnimationFrame(() => {
            card.classList.remove('is-filtered-out');
        });
    }

    hideCard(card) {
        clearTimeout(this.hideTimers.get(card));
        card.classList.add('is-filtered-out');

        const timer = setTimeout(() => {
            card.hidden = true;
            this.hideTimers.delete(card);
        }, this.transitionTime);

        this.hideTimers.set(card, timer);
    }

    updateSummary() {
        const entries = Array.from(this.quantities.entries())
            .map(([id, qty]) => ({ item: this.items.find((entry) => entry.id === id), qty }))
            .filter((entry) => entry.item);

        const hasItems = entries.length > 0;

        if (this.summaryEmpty) this.summaryEmpty.hidden = hasItems;
        if (this.summaryList) this.summaryList.hidden = !hasItems;
        if (this.summaryTotal) this.summaryTotal.hidden = !hasItems;
        if (this.placeOrderBtn) this.placeOrderBtn.disabled = !hasItems;

        let subtotal = 0;

        if (this.summaryList) {
            this.summaryList.innerHTML = entries.map(({ item, qty }) => {
                const lineTotal = item.priceValue * qty;
                subtotal += lineTotal;
                return `
                    <li class="order-summary-item">
                        <span class="order-summary-item-name">${item.name} <span class="order-summary-item-qty">× ${qty}</span></span>
                        <span class="order-summary-item-price">${this.formatPrice(lineTotal)}</span>
                    </li>
                `;
            }).join('');
        } else {
            entries.forEach(({ item, qty }) => {
                subtotal += item.priceValue * qty;
            });
        }

        if (this.subtotalEl) {
            this.subtotalEl.textContent = this.formatPrice(subtotal);
        }
    }

    placeOrder() {
        if (!this.placeOrderBtn || this.placeOrderBtn.disabled) {
            return;
        }

        this.placeOrderBtn.disabled = true;
        this.placeOrderBtn.textContent = 'Placing Order...';

        setTimeout(() => {
            this.quantities.clear();
            this.cards.forEach((card) => {
                const valueEl = card.querySelector('[data-qty-value]');
                if (valueEl) valueEl.textContent = '0';
            });
            this.updateSummary();
            this.placeOrderBtn.textContent = this.defaultButtonText;

            if (this.successEl) {
                this.successEl.style.display = 'block';
                setTimeout(() => {
                    this.successEl.style.display = 'none';
                }, 4000);
            }
        }, 900);
    }
}

class ReviewForm {
    constructor(selector = '#reviewForm') {
        this.form = document.querySelector(selector);
        if (!this.form) return;

        this.nameField = this.form.elements.reviewName;
        this.commentField = this.form.elements.reviewComment;
        this.starRating = this.form.querySelector('[data-star-rating]');
        this.starButtons = this.starRating ? this.starRating.querySelectorAll('.star-btn') : [];
        this.ratingError = document.getElementById('reviewRatingError');
        this.successMessage = document.getElementById('reviewSuccessMessage');
        this.reviewList = document.querySelector('[data-review-list]');
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.defaultButtonText = this.submitButton ? this.submitButton.textContent : 'Submit Review';

        this.selectedRating = 0;
        this.MIN_NAME_LEN = 2;
        this.MIN_COMMENT_LEN = 10;

        this.bindEvents();
    }

    bindEvents() {
        this.starButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                this.setRating(Number(btn.dataset.star));
            });
        });

        [this.nameField, this.commentField].forEach((field) => {
            if (!field) return;

            field.addEventListener('input', () => this.validateField(field, false));
            field.addEventListener('blur', () => this.validateField(field, true));
        });

        this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    }

    setRating(rating) {
        this.selectedRating = rating;

        this.starButtons.forEach((btn) => {
            const value = Number(btn.dataset.star);
            btn.classList.toggle('is-filled', value <= rating);
            btn.setAttribute('aria-checked', String(value === rating));
        });

        if (this.ratingError) {
            this.ratingError.textContent = '';
        }
    }

    getFieldErrorElement(field) {
        const group = field.closest('.form-group');
        return group ? group.querySelector('.error-message') : null;
    }

    setValidationState(field, message, showSuccess) {
        const group = field.closest('.form-group');
        const errorEl = this.getFieldErrorElement(field);
        if (!group || !errorEl) return;

        const hasError = Boolean(message);
        const valuePresent = field.value.trim().length > 0;

        group.classList.toggle('is-invalid', hasError);
        group.classList.toggle('is-valid', showSuccess && !hasError && valuePresent);
        field.setAttribute('aria-invalid', String(hasError));
        errorEl.textContent = message;
    }

    clearValidationState(field) {
        const group = field.closest('.form-group');
        const errorEl = this.getFieldErrorElement(field);
        if (!group || !errorEl) return;

        group.classList.remove('is-invalid', 'is-valid');
        errorEl.textContent = '';
        field.removeAttribute('aria-invalid');
    }

    validateField(field, showSuccess = true) {
        const value = field.value.trim();
        let message = '';

        if (field === this.nameField) {
            if (!value) {
                message = 'Please enter your name.';
            } else if (value.length < this.MIN_NAME_LEN) {
                message = `Name must be at least ${this.MIN_NAME_LEN} characters.`;
            }
        }

        if (field === this.commentField) {
            if (!value) {
                message = 'Please write a review.';
            } else if (value.length < this.MIN_COMMENT_LEN) {
                message = `Review must be at least ${this.MIN_COMMENT_LEN} characters.`;
            }
        }

        this.setValidationState(field, message, showSuccess);
        return !message;
    }

    handleSubmit(event) {
        event.preventDefault();

        if (this.successMessage) {
            this.successMessage.style.display = 'none';
        }

        const nameValid = this.validateField(this.nameField, true);
        const commentValid = this.validateField(this.commentField, true);
        let ratingValid = true;

        if (!this.selectedRating) {
            ratingValid = false;
            if (this.ratingError) {
                this.ratingError.textContent = 'Please choose a rating.';
            }
        }

        if (!nameValid || !commentValid || !ratingValid) {
            return;
        }

        this.simulateSubmit();
    }

    setSubmitting(isSubmitting) {
        if (!this.submitButton) return;
        this.submitButton.disabled = isSubmitting;
        this.submitButton.textContent = isSubmitting ? 'Submitting...' : this.defaultButtonText;
    }

    simulateSubmit() {
        this.setSubmitting(true);

        const name = this.nameField.value.trim();
        const comment = this.commentField.value.trim();
        const rating = this.selectedRating;

        setTimeout(() => {
            this.addReviewToList(name, comment, rating);

            this.form.reset();
            [this.nameField, this.commentField].forEach((field) => this.clearValidationState(field));
            this.setRating(0);

            if (this.successMessage) {
                this.successMessage.style.display = 'block';
            }

            this.setSubmitting(false);
        }, 900);
    }

    addReviewToList(name, comment, rating) {
        if (!this.reviewList) return;

        const filledStars = '★'.repeat(rating);
        const emptyStars = '☆'.repeat(5 - rating);

        const li = document.createElement('li');
        li.className = 'review-card review-card-new';
        li.innerHTML = `
            <div class="review-card-head">
                <strong>${this.escapeHtml(name)}</strong>
                <span class="review-stars" aria-label="${rating} out of 5 stars">${filledStars}${emptyStars}</span>
            </div>
            <p>${this.escapeHtml(comment)}</p>
        `;

        this.reviewList.prepend(li);
    }

    escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('steamCanvas');
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (canvas && !prefersReducedMotion) {
        new SteamAnimation(canvas);
    }

    new ScrollReveal('.reveal');
    new TestimonialSlider('.testimonial-slider');
    new MobileNavbar('.nav-toggle', '.nav-links');
    new Timeline('.timeline');
    new MenuFilter();
    new ServiceFilter();
    new FormValidator('#contactForm');
    new OrderPage();
    new ReviewForm('#reviewForm');
});

