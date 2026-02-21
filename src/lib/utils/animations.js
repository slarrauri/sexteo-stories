/**
 * Animation helpers for screen transitions
 */

/** Typewriter effect — reveals text character by character */
export function typewriter(element, text, speed = 40) {
    return new Promise(resolve => {
        element.textContent = '';
        let i = 0;
        const interval = setInterval(() => {
            element.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });
}

/** Stagger entrance — animates children one by one */
export function staggerIn(container, selector = ':scope > *', delayMs = 100) {
    const items = container.querySelectorAll(selector);
    items.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = `all 400ms ease ${i * delayMs}ms`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });
        });
    });
}

/** Wait for a timeout and resolve */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Animate a number counting up */
export function countUp(element, target, duration = 1000) {
    const start = performance.now();
    const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}

/** Create confetti burst */
export function confettiBurst(count = 30) {
    const colors = ['#E91E63', '#9C27B0', '#FFC107', '#FF5C8D', '#6F7CFF', '#4ADE80'];
    const container = document.body;

    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width = Math.random() * 8 + 4 + 'px';
        piece.style.height = Math.random() * 12 + 6 + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animationDuration = Math.random() * 2 + 2 + 's';
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(piece);

        setTimeout(() => piece.remove(), 5000);
    }
}

/** Smooth scroll into view */
export function scrollIntoView(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
