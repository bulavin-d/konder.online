/* =============================================
   KONDER.ONLINE — script.js v13
   Proper snow caps, stars, nicer snowflake
   ============================================= */

var rafId = null;
var lastTime = performance.now();

// ============================================================
//  1. HEADER — scroll effect
// ============================================================
(function () {
    var h = document.getElementById('header');
    window.addEventListener('scroll', function () {
        h.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
})();

// ============================================================
//  2. LOGO CANVAS — mini animated logo in header
// ============================================================
(function () {
    var c = document.getElementById('logo-canvas');
    if (!c) return;
    var lctx = c.getContext('2d');
    var W = c.width, H = c.height;
    var logoTime = 0;

    function drawLogoBg() {
        var g = lctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
        g.addColorStop(0, '#1a4a80');
        g.addColorStop(0.7, '#0e2d55');
        g.addColorStop(1, '#071a38');
        lctx.fillStyle = g;
        lctx.beginPath();
        lctx.roundRect(0, 0, W, H, 24);
        lctx.fill();
    }

    function drawLogoMtn(peakX, peakY, leftX, rightX, cL, cD) {
        lctx.fillStyle = cL;
        lctx.beginPath(); lctx.moveTo(leftX, H); lctx.lineTo(peakX, peakY); lctx.lineTo(peakX, H); lctx.fill();
        lctx.fillStyle = cD;
        lctx.beginPath(); lctx.moveTo(peakX, peakY); lctx.lineTo(rightX, H); lctx.lineTo(peakX, H); lctx.fill();
        // Snow
        var mH = H - peakY;
        var sD = mH * 0.12;
        var sBottomY = peakY + sD;
        var sLX = peakX + (sD / mH) * (leftX - peakX);
        var sRX = peakX + (sD / mH) * (rightX - peakX);
        lctx.fillStyle = '#FFFFFF';
        lctx.beginPath(); lctx.moveTo(peakX, peakY); lctx.lineTo(sLX, sBottomY); lctx.lineTo(peakX, sBottomY); lctx.fill();
        lctx.fillStyle = '#AECDF5';
        lctx.beginPath(); lctx.moveTo(peakX, peakY); lctx.lineTo(sRX, sBottomY); lctx.lineTo(peakX, sBottomY); lctx.fill();
    }

    function drawLogoAC() {
        var acX = W * 0.19, acY = H * 0.54, acW = W * 0.62, acH = H * 0.175, acR = 5;
        lctx.shadowColor = 'rgba(0,10,30,0.6)'; lctx.shadowBlur = 8; lctx.shadowOffsetY = 4;
        lctx.fillStyle = '#FFFFFF';
        lctx.beginPath(); lctx.roundRect(acX, acY, acW, acH, acR); lctx.fill();
        lctx.shadowColor = 'transparent';
        var ventH = acH * 0.18;
        var ventX = acX + acW * 0.1, ventY = acY + acH - ventH - acH * 0.08, ventW = acW * 0.8;
        lctx.fillStyle = '#0F2B5B';
        lctx.beginPath(); lctx.roundRect(ventX, ventY, ventW, ventH, 2); lctx.fill();
        var btnX = acX + acW * 0.7, btnY = acY + acH * 0.3;
        for (var j = 0; j < 3; j++) {
            var a = 0.3 + 0.7 * ((Math.sin(logoTime * 2.5 - j * 1.5) + 1) / 2);
            lctx.fillStyle = 'rgba(15,60,120,' + a + ')';
            lctx.beginPath(); lctx.arc(btnX + j * 6, btnY, 2, 0, Math.PI * 2); lctx.fill();
        }
    }

    function drawLogoFade() {
        var g = lctx.createLinearGradient(0, H * 0.5, 0, H);
        g.addColorStop(0, 'rgba(7,26,56,0)'); g.addColorStop(1, 'rgba(7,26,56,1)');
        lctx.fillStyle = g; lctx.fillRect(0, H * 0.5, W, H * 0.5);
    }

    function animLogo() {
        lctx.clearRect(0, 0, W, H);
        drawLogoBg();
        drawLogoMtn(W * 0.7, H * 0.325, W * 0.14, W * 1.49, '#12438C', '#0A2554');
        drawLogoMtn(W * 0.35, H * 0.275, -W * 0.375, W * 0.94, '#1E63C2', '#123D78');
        drawLogoFade();
        drawLogoAC();
        logoTime += 0.016;
        requestAnimationFrame(animLogo);
    }
    animLogo();
})();

// ============================================================
//  3. HERO CANVAS — Mountains + AC + Ribbons + Stars
// ============================================================
var heroCanvas = null;

// --- Wind Ribbon ---
function WindRibbon(source, S) {
    this.source = source;
    this.S = S;
    this.history = [];
    this.reset(true);
}

WindRibbon.prototype.reset = function (isInitial) {
    var S = this.S;
    this.t = isInitial ? Math.random() : 0;
    this.speed = 0.003 + Math.random() * 0.003;
    this.history = [];
    this.trailLength = Math.floor(12 + Math.random() * 10);
    this.baseWidth = (4 + Math.random() * 5) * S;

    if (this.source === 'left_ridge') {
        var lerp = Math.random();
        this.startX = (280 + lerp * 80) * S;
        this.startY = (220 + lerp * 70) * S;
        this.endX = (260 + Math.random() * 120) * S;
        this.endY = 440 * S;
        this.cp1X = this.startX + 60 * S;
        this.cp1Y = this.startY - 30 * S;
        this.cp2X = this.endX - 20 * S;
        this.cp2Y = this.endY - 100 * S;
    } else if (this.source === 'right_ridge') {
        var lerp2 = Math.random();
        this.startX = (560 - lerp2 * 60) * S;
        this.startY = (260 + lerp2 * 50) * S;
        this.endX = (420 + Math.random() * 120) * S;
        this.endY = 440 * S;
        this.cp1X = this.startX - 60 * S;
        this.cp1Y = this.startY - 30 * S;
        this.cp2X = this.endX + 20 * S;
        this.cp2Y = this.endY - 100 * S;
    } else {
        this.startX = (260 + Math.random() * 280) * S;
        this.startY = 560 * S;
        var spread = (this.startX / S - 400) * 1.2;
        this.endX = this.startX + spread * S + (Math.random() - 0.5) * 60 * S;
        this.endY = 850 * S;
        this.cp1X = this.startX;
        this.cp1Y = 630 * S;
        this.cp2X = this.endX - spread * 0.4 * S;
        this.cp2Y = 730 * S;
    }
};

WindRibbon.prototype.getPoint = function (time) {
    var t = this.t, u = 1 - t;
    var tt = t * t, uu = u * u;
    var x = uu * u * this.startX + 3 * uu * t * this.cp1X + 3 * u * tt * this.cp2X + tt * t * this.endX;
    var y = uu * u * this.startY + 3 * uu * t * this.cp1Y + 3 * u * tt * this.cp2Y + tt * t * this.endY;
    x += Math.sin(time * 3 + y * 0.015) * 3 * this.S;
    return { x: x, y: y };
};

WindRibbon.prototype.update = function (time) {
    this.t += this.speed;
    if (this.t > 1) { this.reset(false); return; }
    this.history.unshift(this.getPoint(time));
    if (this.history.length > this.trailLength) this.history.pop();
};

WindRibbon.prototype.draw = function (ctx) {
    if (this.history.length < 2) return;
    var alpha = 1;
    if (this.t < 0.1) alpha = this.t / 0.1;
    if (this.t > 0.9) alpha = (1 - this.t) / 0.1;
    ctx.lineCap = 'round';
    for (var i = 0; i < this.history.length - 1; i++) {
        var p1 = this.history[i], p2 = this.history[i + 1];
        var fade = 1 - (i / this.history.length);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = this.baseWidth * fade;
        ctx.strokeStyle = 'rgba(165, 225, 255, ' + (alpha * fade * 0.5) + ')';
        ctx.stroke();
    }
};

// --- HeroCanvas ---
function HeroCanvas() {
    this.canvas = document.getElementById('hero-canvas');
    if (!this.canvas) return;
    this.section = this.canvas.parentElement;
    this.ctx = this.canvas.getContext('2d');
    this.ribbons = [];
    this.stars = [];
    this.w = 0;
    this.h = 0;
    this.S = 1;
    this.oX = 0;
    this.time = 0;
    this.startTime = performance.now();
    this.titleShown = false;
    this.heroVisible = true;
}

HeroCanvas.prototype.resize = function () {
    if (!this.canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.section.offsetWidth;
    this.h = this.section.offsetHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Scale: fit 800x800 composition within BOTH width and height
    this.S = Math.min(this.h / 800, this.w / 800);
    this.oX = (this.w - 800 * this.S) / 2;
    this.oY = (this.h - 800 * this.S) / 2; // vertical offset if width-limited

    // Ribbons
    this.ribbons = [];
    var S = this.S;
    for (var i = 0; i < 18; i++) this.ribbons.push(new WindRibbon('left_ridge', S));
    for (var j = 0; j < 18; j++) this.ribbons.push(new WindRibbon('right_ridge', S));
    for (var k = 0; k < 30; k++) this.ribbons.push(new WindRibbon('out', S));

    // Stars
    this.stars = [];
    var count = Math.min(Math.floor(this.w * this.h / 14000), 45);
    for (var s = 0; s < count; s++) {
        this.stars.push({
            x: Math.random() * this.w,
            y: Math.random() * this.h * 0.32,
            size: 0.4 + Math.random() * 1.6,
            speed: 0.4 + Math.random() * 1.2,
            offset: Math.random() * Math.PI * 2,
            maxA: 0.25 + Math.random() * 0.45
        });
    }
};

HeroCanvas.prototype.drawBg = function () {
    var ctx = this.ctx, w = this.w, h = this.h;
    var g = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.max(w, h) * 0.85);
    g.addColorStop(0, '#2a6595');
    g.addColorStop(0.5, '#0e2d55');
    g.addColorStop(1, '#071a38');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
};

HeroCanvas.prototype.drawStars = function () {
    var ctx = this.ctx, t = this.time;
    for (var i = 0; i < this.stars.length; i++) {
        var s = this.stars[i];
        var a = s.maxA * (0.5 + 0.5 * Math.sin(t * s.speed + s.offset));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffffff';
        if (s.size > 1.0) {
            var sz = s.size;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y - sz * 1.6);
            ctx.lineTo(s.x + sz * 0.3, s.y);
            ctx.lineTo(s.x, s.y + sz * 1.6);
            ctx.lineTo(s.x - sz * 0.3, s.y);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
};

// Mountain with slope-following snow caps
HeroCanvas.prototype.drawMountain = function (peakX, peakY, leftX, rightX, colorL, colorD, snowDepth, progress) {
    var ctx = this.ctx, S = this.S, oX = this.oX;
    var baseY = this.h + 10;
    var mtnH = 800 - peakY;

    var px = peakX * S + oX;
    var lx = leftX * S + oX;
    var rx = rightX * S + oX;
    var targetPY = peakY * S;
    var animPY = baseY + (targetPY - baseY) * progress;

    // Light side
    ctx.fillStyle = colorL;
    ctx.beginPath();
    ctx.moveTo(lx, baseY);
    ctx.lineTo(px, animPY);
    ctx.lineTo(px, baseY);
    ctx.fill();

    // Dark side
    ctx.fillStyle = colorD;
    ctx.beginPath();
    ctx.moveTo(px, animPY);
    ctx.lineTo(rx, baseY);
    ctx.lineTo(px, baseY);
    ctx.fill();

    // Snow caps — follow exact mountain slopes
    if (progress > 0.7) {
        var snowAlpha = (progress - 0.7) / 0.3;
        ctx.save();
        ctx.globalAlpha = snowAlpha;

        var ratio = snowDepth / mtnH;
        var snowLeftX = peakX + ratio * (leftX - peakX);
        var snowRightX = peakX + ratio * (rightX - peakX);
        var snowBottomY = peakY + snowDepth;
        var animSnowBottom = baseY + (snowBottomY * S - baseY) * progress;

        // White on left face
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(px, animPY);
        ctx.lineTo(snowLeftX * S + oX, animSnowBottom);
        ctx.lineTo(px, animSnowBottom);
        ctx.fill();

        // Blue on right face
        ctx.fillStyle = '#AECDF5';
        ctx.beginPath();
        ctx.moveTo(px, animPY);
        ctx.lineTo(snowRightX * S + oX, animSnowBottom);
        ctx.lineTo(px, animSnowBottom);
        ctx.fill();

        ctx.restore();
    }
};

HeroCanvas.prototype.drawMtnFade = function (progress) {
    if (progress <= 0) return;
    var ctx = this.ctx, w = this.w, h = this.h, S = this.S;
    var fadeTop = 400 * S;
    var g = ctx.createLinearGradient(0, fadeTop, 0, h);
    g.addColorStop(0, 'rgba(5, 20, 45, 0)');
    g.addColorStop(1, 'rgba(5, 20, 45, ' + progress + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, fadeTop, w, h - fadeTop);
};

HeroCanvas.prototype.drawAC = function (progress) {
    if (progress <= 0) return;
    var ctx = this.ctx, S = this.S, oX = this.oX;

    var acX = 150 * S + oX;
    var acW = 500 * S;
    var acH = 140 * S;
    var acR = 25 * S;
    var acTargetY = 430 * S;
    var acY = acTargetY + (1 - progress) * 50 * S;

    ctx.save();
    ctx.globalAlpha = progress;

    // Shadow
    ctx.shadowColor = 'rgba(0, 10, 30, 0.7)';
    ctx.shadowBlur = 20 * S;
    ctx.shadowOffsetY = 12 * S;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(acX, acY, acW, acH, acR);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Body gradient
    var bodyG = ctx.createLinearGradient(0, acY, 0, acY + acH);
    bodyG.addColorStop(0.5, 'rgba(255,255,255,0)');
    bodyG.addColorStop(1, 'rgba(150,200,255,0.35)');
    ctx.fillStyle = bodyG;
    ctx.fill();

    // Vent inside body
    var ventMargin = acW * 0.1;
    var ventX = acX + ventMargin;
    var ventH = 18 * S;
    var ventY = acY + acH - ventH - 8 * S;
    var ventW = acW - ventMargin * 2;
    ctx.fillStyle = '#0F2B5B';
    ctx.beginPath();
    ctx.roundRect(ventX, ventY, ventW, ventH, 6 * S);
    ctx.fill();

    ctx.strokeStyle = '#2858A6';
    ctx.lineWidth = Math.max(2, 3 * S);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ventX + 12 * S, ventY + ventH / 2);
    ctx.lineTo(ventX + ventW - 12 * S, ventY + ventH / 2);
    ctx.stroke();

    // ❄ Snowflake — 6-arm crystal, top-left corner
    var sfX = acX + 38 * S;
    var sfY = acY + 28 * S;
    var arm = 10 * S;
    var br = 3.5 * S;
    ctx.strokeStyle = '#3A82DF';
    ctx.lineWidth = Math.max(1.5, 2 * S);
    ctx.lineCap = 'round';
    for (var i = 0; i < 6; i++) {
        ctx.save();
        ctx.translate(sfX, sfY);
        ctx.rotate((Math.PI / 3) * i);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arm, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arm * 0.55, 0);
        ctx.lineTo(arm * 0.55 + br * 0.5, -br);
        ctx.moveTo(arm * 0.55, 0);
        ctx.lineTo(arm * 0.55 + br * 0.5, br);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arm, 0);
        ctx.lineTo(arm - br * 0.3, -br * 0.55);
        ctx.moveTo(arm, 0);
        ctx.lineTo(arm - br * 0.3, br * 0.55);
        ctx.stroke();
        ctx.restore();
    }
    ctx.fillStyle = '#5BBBFF';
    ctx.beginPath();
    ctx.arc(sfX, sfY, 1.8 * S, 0, Math.PI * 2);
    ctx.fill();

    // Dots — top-right corner
    var btnX = acX + acW - 52 * S;
    var btnY = acY + 28 * S;
    for (var j = 0; j < 3; j++) {
        var da = 0.2 + 0.8 * ((Math.sin(this.time * 2 - j * 1.5) + 1) / 2);
        ctx.fillStyle = 'rgba(15, 60, 120, ' + da + ')';
        ctx.beginPath();
        ctx.arc(btnX + j * 14 * S, btnY, 3.5 * S, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

function easeOut(t) { return 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3); }

HeroCanvas.prototype.animate = function (dt) {
    if (!this.canvas) return;
    // Skip rendering entirely when hero is off screen (mobile perf)
    if (!this.heroVisible && this.titleShown) return;
    var ctx = this.ctx, w = this.w, h = this.h;
    ctx.clearRect(0, 0, w, h);

    this.time += 0.016;
    var elapsed = (performance.now() - this.startTime) / 1000;

    var bgAlpha = easeOut(elapsed / 0.5);
    var mtnProg = easeOut((elapsed - 0.3) / 1.2);
    var fadeProg = easeOut((elapsed - 1.2) / 0.6);
    var acProg = easeOut((elapsed - 1.5) / 0.8);
    var ridgeReady = elapsed > 1.0;
    var outReady = elapsed > 2.2;

    // Background
    ctx.save(); ctx.globalAlpha = bgAlpha;
    this.drawBg();
    ctx.restore();

    // Stars (fade in after bg)
    if (bgAlpha > 0.5) {
        ctx.save();
        ctx.globalAlpha = Math.min((bgAlpha - 0.5) * 2, 1);
        this.drawStars();
        ctx.restore();
    }

    // Mountains: snowDepth in 800-space units
    this.drawMountain(560, 260, 114, 1193, '#12438C', '#0A2554', 65, mtnProg);
    this.drawMountain(280, 220, -300, 754, '#1E63C2', '#123D78', 70, mtnProg);

    // Mountain fade
    this.drawMtnFade(fadeProg);

    // Ridge ribbons (only update when visible)
    if (ridgeReady && this.heroVisible) {
        ctx.save();
        ctx.translate(this.oX, 0);
        ctx.globalCompositeOperation = 'screen';
        for (var i = 0; i < this.ribbons.length; i++) {
            var r = this.ribbons[i];
            if (r.source !== 'out') { r.update(this.time); r.draw(ctx); }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    // AC unit
    this.drawAC(acProg);

    // Out ribbons (only update when visible)
    if (outReady && this.heroVisible) {
        ctx.save();
        ctx.translate(this.oX, 0);
        ctx.globalCompositeOperation = 'screen';
        for (var j = 0; j < this.ribbons.length; j++) {
            var r2 = this.ribbons[j];
            if (r2.source === 'out') { r2.update(this.time); r2.draw(ctx); }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    // Title reveal
    if (elapsed > 2.0 && !this.titleShown) {
        this.titleShown = true;
        var el = document.querySelector('.hero-title');
        if (el) el.classList.add('visible');
    }
};

// ============================================================
//  4. REVEAL + COUNTERS
// ============================================================
function animateValue(el, start, end, duration) {
    var startTs = null, suffix = el.dataset.suffix || '';
    function step(timestamp) {
        if (!startTs) startTs = timestamp;
        var progress = Math.min((timestamp - startTs) / duration, 1);
        var eased = progress * (2 - progress);
        el.textContent = Math.floor(eased * (end - start) + start) + suffix;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function initReveal() {
    var els = document.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            var stat = entry.target.querySelector('.stat-number');
            if (stat && !stat.dataset.animated) {
                stat.dataset.animated = 'true';
                animateValue(stat, 0, parseInt(stat.dataset.target, 10), 2000);
            }
            setTimeout(function () { entry.target.style.willChange = 'auto'; }, 1000);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.1 });
    els.forEach(function (el) { observer.observe(el); });
}

// ============================================================
//  5. PILL
// ============================================================
(function () {
    var btns = document.querySelectorAll('.contact-btn');
    function closeAll() {
        btns.forEach(function (b) {
            var p = document.getElementById(b.getAttribute('data-pill'));
            if (p) { p.classList.remove('open'); b.classList.remove('hidden'); }
        });
    }
    btns.forEach(function (btn) {
        var pill = document.getElementById(btn.getAttribute('data-pill'));
        if (!pill) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = pill.classList.contains('open');
            closeAll();
            if (!open) { pill.classList.add('open'); btn.classList.add('hidden'); }
        });
        pill.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    document.addEventListener('click', closeAll);
})();

// ============================================================
//  6. «ЕЩЁ УСЛУГИ» — toggle
// ============================================================
(function () {
    var toggle = document.getElementById('moreToggle');
    var body = document.getElementById('moreBody');
    var label = document.getElementById('moreLabel');
    if (!toggle || !body) return;
    toggle.addEventListener('click', function () {
        var open = body.classList.contains('open');
        body.classList.toggle('open', !open);
        if (label) label.textContent = open ? 'Ещё услуги' : 'Скрыть';
    });
})();

// ============================================================
//  7. RAF LOOP
// ============================================================
function renderLoop(time) {
    var dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 16.6;
    if (heroCanvas) heroCanvas.animate(dt);
    rafId = requestAnimationFrame(renderLoop);
}

document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(rafId);
    else { lastTime = performance.now(); rafId = requestAnimationFrame(renderLoop); }
});

var resizeTimer;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        if (heroCanvas) heroCanvas.resize();
    }, 250);
});

// INIT
heroCanvas = new HeroCanvas();
heroCanvas.resize();
rafId = requestAnimationFrame(renderLoop);
initReveal();

// Pause ribbons when hero scrolled off screen
(function () {
    if (!heroCanvas || !heroCanvas.canvas) return;
    var obs = new IntersectionObserver(function (entries) {
        heroCanvas.heroVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    obs.observe(heroCanvas.section);
})();
