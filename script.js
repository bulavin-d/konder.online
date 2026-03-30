/* =============================================
   KONDER.ONLINE — script.js v16
   - Reverted to v13 ridge paths (they were correct)
   - Fixed draw(): uniform thin line, NO gradient = no sperm
   - Portrait mobile: AC fits screen width via capped S
   ============================================= */

var rafId    = null;
var lastTime = performance.now();

// ============================================================
//  1. HEADER
// ============================================================
(function () {
    var h = document.getElementById('header');
    window.addEventListener('scroll', function () {
        h.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
})();

// ============================================================
//  2. LOGO CANVAS
// ============================================================
(function () {
    var c = document.getElementById('logo-canvas');
    if (!c) return;
    var lctx = c.getContext('2d');
    var W = c.width, H = c.height, logoTime = 0;

    function drawLogoBg() {
        var g = lctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
        g.addColorStop(0,'#1a4a80'); g.addColorStop(0.7,'#0e2d55'); g.addColorStop(1,'#071a38');
        lctx.fillStyle=g; lctx.beginPath(); lctx.roundRect(0,0,W,H,24); lctx.fill();
    }
    function drawLogoMtn(px,py,lx,rx,cL,cD){
        lctx.fillStyle=cL; lctx.beginPath(); lctx.moveTo(lx,H); lctx.lineTo(px,py); lctx.lineTo(px,H); lctx.fill();
        lctx.fillStyle=cD; lctx.beginPath(); lctx.moveTo(px,py); lctx.lineTo(rx,H); lctx.lineTo(px,H); lctx.fill();
        var mH=H-py, sD=mH*0.12, sBy=py+sD;
        var sLX=px+(sD/mH)*(lx-px), sRX=px+(sD/mH)*(rx-px);
        lctx.fillStyle='#FFFFFF'; lctx.beginPath(); lctx.moveTo(px,py); lctx.lineTo(sLX,sBy); lctx.lineTo(px,sBy); lctx.fill();
        lctx.fillStyle='#AECDF5'; lctx.beginPath(); lctx.moveTo(px,py); lctx.lineTo(sRX,sBy); lctx.lineTo(px,sBy); lctx.fill();
    }
    function drawLogoAC(){
        var acX=W*0.19,acY=H*0.54,acW=W*0.62,acH=H*0.175,acR=5;
        lctx.shadowColor='rgba(0,10,30,0.6)'; lctx.shadowBlur=8; lctx.shadowOffsetY=4;
        lctx.fillStyle='#FFFFFF'; lctx.beginPath(); lctx.roundRect(acX,acY,acW,acH,acR); lctx.fill();
        lctx.shadowColor='transparent';
        var vH=acH*0.18,vX=acX+acW*0.1,vY=acY+acH-vH-acH*0.08,vW=acW*0.8;
        lctx.fillStyle='#0F2B5B'; lctx.beginPath(); lctx.roundRect(vX,vY,vW,vH,2); lctx.fill();
        var btnX=acX+acW*0.7,btnY=acY+acH*0.3;
        for(var j=0;j<3;j++){
            var a=0.3+0.7*((Math.sin(logoTime*2.5-j*1.5)+1)/2);
            lctx.fillStyle='rgba(15,60,120,'+a+')';
            lctx.beginPath(); lctx.arc(btnX+j*6,btnY,2,0,Math.PI*2); lctx.fill();
        }
    }
    function drawLogoFade(){
        var g=lctx.createLinearGradient(0,H*0.5,0,H);
        g.addColorStop(0,'rgba(7,26,56,0)'); g.addColorStop(1,'rgba(7,26,56,1)');
        lctx.fillStyle=g; lctx.fillRect(0,H*0.5,W,H*0.5);
    }
    function animLogo(){
        lctx.clearRect(0,0,W,H);
        drawLogoBg();
        drawLogoMtn(W*0.7,H*0.325,W*0.14,W*1.49,'#12438C','#0A2554');
        drawLogoMtn(W*0.35,H*0.275,-W*0.375,W*0.94,'#1E63C2','#123D78');
        drawLogoFade(); drawLogoAC();
        logoTime+=0.016; requestAnimationFrame(animLogo);
    }
    animLogo();
})();

// ============================================================
//  3. HERO CANVAS
// ============================================================
var heroCanvas = null;
var lastHeroViewportWidth = window.innerWidth;

class SnowParticle {
    constructor(source, S, oY) {
        this.source = source;
        this.S = S;
        this.oY = oY || 0;
        this.history = [];
        this.reset(true);
    }

    reset(isInitial) {
        var S = this.S;
        var oY = this.oY;

        this.t = isInitial ? Math.random() : 0;
        this.speed = 0.0015 + Math.random() * 0.002;
        this.history = [];
        this.trailLength = Math.floor(10 + Math.random() * 15);
        this.pSize = (0.5 + Math.random() * 1.5) * S;

        if (this.source === 'left_ridge') {
            var lerp = Math.random();
            this.startX = (280 + lerp * 80) * S;
            this.startY = (220 + lerp * 70) * S + oY;
            this.endX = (260 + Math.random() * 120) * S;
            this.endY = 440 * S + oY;
            this.cp1X = this.startX + 60 * S;
            this.cp1Y = this.startY - 30 * S;
            this.cp2X = this.endX - 20 * S;
            this.cp2Y = this.endY - 100 * S;
        } else if (this.source === 'right_ridge') {
            var lerp2 = Math.random();
            this.startX = (560 - lerp2 * 60) * S;
            this.startY = (260 + lerp2 * 50) * S + oY;
            this.endX = (420 + Math.random() * 120) * S;
            this.endY = 440 * S + oY;
            this.cp1X = this.startX - 60 * S;
            this.cp1Y = this.startY - 30 * S;
            this.cp2X = this.endX + 20 * S;
            this.cp2Y = this.endY - 100 * S;
        } else {
            var baseStartX = 205 + Math.random() * 390;
            this.startX = baseStartX * S;
            this.startY = 553 * S + oY;
            var spread = (baseStartX - 400) * 1.2;
            this.endX = this.startX + spread * S + (Math.random() - 0.5) * 80 * S;
            this.endY = 900 * S + oY;
            this.cp1X = this.startX;
            this.cp1Y = 620 * S + oY;
            this.cp2X = this.endX - spread * 0.4 * S;
            this.cp2Y = 720 * S + oY;
        }
    }

    getPoint(time, windOffset) {
        var t = this.t;
        var u = 1 - t;
        var tt = t * t;
        var uu = u * u;
        var x = uu * u * this.startX + 3 * uu * t * this.cp1X + 3 * u * tt * this.cp2X + tt * t * this.endX;
        var y = uu * u * this.startY + 3 * uu * t * this.cp1Y + 3 * u * tt * this.cp2Y + tt * t * this.endY;

        x += Math.sin(time * 3 + y * 0.015) * 4 * this.S;

        if (this.source === 'out') {
            x += windOffset * (t * t * 150 * this.S);
        }

        return { x: x, y: y };
    }

    update(time, windOffset) {
        this.t += this.speed;
        if (this.t > 1) {
            this.reset(false);
            return;
        }
        this.history.unshift(this.getPoint(time, windOffset || 0));
        if (this.history.length > this.trailLength) this.history.pop();
    }

    draw(ctx) {
        var h = this.history;
        if (h.length < 1) return;

        var alpha = 1;
        if (this.t < 0.15) alpha = this.t / 0.15;
        if (this.t > 0.85) alpha = (1 - this.t) / 0.15;

        var head = h[0];
        var sz = this.pSize;

        ctx.save();

        for (var i = 2; i < h.length; i += 3) {
            var ta = alpha * (1 - i / h.length) * 0.6;
            ctx.fillStyle = 'rgba(180, 220, 255, ' + ta + ')';
            ctx.beginPath();
            ctx.arc(h[i].x, h[i].y, sz * 0.8 * (1 - i / h.length), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(head.x, head.y);
        ctx.rotate(this.t * 10);

        ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
        ctx.beginPath();
        ctx.arc(0, 0, sz * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.8) + ')';
        ctx.lineWidth = Math.max(0.5, sz * 0.5);
        for (var j = 0; j < 6; j++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(sz * 3.5, 0);
            ctx.stroke();
            ctx.rotate(Math.PI / 3);
        }

        ctx.restore();
    }
}

class Cloud {
    constructor(w, h, S) {
        this.w = w;
        this.h = h;
        this.S = S;
        this.reset(true);
    }

    reset(randomizeX) {
        this.size = (Math.random() * 150 + 100) * this.S;
        this.y = Math.random() * (this.h * 0.5);
        this.x = randomizeX ? Math.random() * this.w : -this.size;
        this.speed = (Math.random() * 0.2 + 0.1) * this.S;
        this.alpha = Math.random() * 0.15 + 0.05;
    }

    update() {
        this.x += this.speed;
        if (this.x > this.w + this.size) this.reset(false);
    }

    draw(ctx) {
        ctx.save();
        var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        grad.addColorStop(0, 'rgba(200, 220, 255, ' + this.alpha + ')');
        grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ShootingStar {
    constructor(w, h, S) {
        this.w = w;
        this.h = h;
        this.S = S;
        this.active = false;
    }

    spawn() {
        this.active = true;
        this.x = Math.random() * this.w * 0.8 + this.w * 0.2;
        this.y = -50;
        this.length = (Math.random() * 80 + 40) * this.S;
        this.speedX = -(Math.random() * 1.5 + 2) * this.S;
        this.speedY = (Math.random() * 1 + 1) * this.S;
        this.opacity = 1;
    }

    update() {
        if (!this.active) {
            if (Math.random() < 0.0003) this.spawn();
            return;
        }

        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= 0.005;
        if (this.opacity <= 0 || this.y > this.h) this.active = false;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        var grad = ctx.createLinearGradient(this.x, this.y, this.x - this.speedX * 4, this.y - this.speedY * 4);
        grad.addColorStop(0, 'rgba(255, 255, 255, ' + this.opacity + ')');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 * this.S;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length * (this.speedX / 10), this.y - this.length * (this.speedY / 10));
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, ' + this.opacity + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2 * this.S, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class HeroCanvas {
    constructor() {
        this.canvas = document.getElementById('hero-canvas');
        this.section = document.getElementById('hero');
        this.titleEl = document.getElementById('hero-title') || document.querySelector('.hero-title');

        if (!this.canvas || !this.section) return;

        this.ctx = this.canvas.getContext('2d', { alpha: false });

        this.particles = [];
        this.stars = [];
        this.clouds = [];
        this.shootingStars = [];

        this.w = 0;
        this.h = 0;
        this.S = 1;
        this.oX = 0;
        this.oY = 0;
        this.acCenterY = 0;

        this.mouseX = -1000;
        this.targetWind = 0;
        this.currentWind = 0;

        this.time = 0;
        this.startTime = performance.now();
        this.titleShown = false;
        this.heroVisible = true;

        this.bindEvents();
    }

    bindEvents() {
        var self = this;

        function updateMouse(e) {
            var source = e;
            if (e.touches && e.touches[0]) source = e.touches[0];
            if (!source || typeof source.clientX !== 'number') return;

            var rect = self.canvas.getBoundingClientRect();
            self.mouseX = source.clientX - rect.left;
        }

        window.addEventListener('mousemove', updateMouse);
        window.addEventListener('touchmove', updateMouse, { passive: true });
        window.addEventListener('mouseleave', function () { self.mouseX = -1000; });
        window.addEventListener('touchend', function () { self.mouseX = -1000; });
    }

    resize() {
        if (!this.canvas) return;

        var dpr = window.devicePixelRatio || 1;
        this.w = this.section.offsetWidth;
        this.h = this.section.offsetHeight;

        this.canvas.width = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var wFit = this.w < 600 ? this.w * 0.86 : this.w;
        this.S = Math.min(this.h * 0.82 / 800, wFit / 500);
        this.oX = (this.w - 800 * this.S) / 2;
        var naturalOY = this.h - 800 * this.S;
        this.oY = Math.max(naturalOY, 0);

        if (this.titleEl) {
            this.titleEl.style.fontSize = Math.max(14, Math.floor(42 * this.S)) + 'px';
            this.titleEl.style.letterSpacing = Math.max(0, Math.floor(1.5 * this.S)) + 'px';
        }

        this.initElements();
    }

    initElements() {
        this.particles = [];
        var S = this.S;
        var oY = this.oY;

        for (var i = 0; i < 22; i++) this.particles.push(new SnowParticle('left_ridge', S, oY));
        for (var j = 0; j < 22; j++) this.particles.push(new SnowParticle('right_ridge', S, oY));
        for (var k = 0; k < 45; k++) this.particles.push(new SnowParticle('out', S, oY));

        this.stars = [];
        var skyH = Math.max(this.oY + 250 * this.S, this.h * 0.4);
        var count = Math.min(Math.floor(this.w * skyH / 10000), 60);
        for (var s = 0; s < count; s++) {
            this.stars.push({
                x: Math.random() * this.w,
                y: Math.random() * skyH,
                size: 0.5 + Math.random() * 1.5,
                speed: 0.2 + Math.random() * 0.8,
                offset: Math.random() * Math.PI * 2,
                maxA: 0.2 + Math.random() * 0.5
            });
        }

        this.clouds = [];
        for (var c = 0; c < 5; c++) this.clouds.push(new Cloud(this.w, this.h, this.S));

        this.shootingStars = [new ShootingStar(this.w, this.h, this.S), new ShootingStar(this.w, this.h, this.S)];
    }

    drawBg() {
        var ctx = this.ctx;
        var g = ctx.createRadialGradient(this.w / 2, this.h * 0.4, 0, this.w / 2, this.h * 0.4, Math.max(this.w, this.h) * 0.8);
        g.addColorStop(0, '#0c2445');
        g.addColorStop(0.5, '#051124');
        g.addColorStop(1, '#02060d');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.w, this.h);
    }

    drawMoon() {
        var ctx = this.ctx;
        var mX = this.w * 0.75;
        var mY = this.h * 0.25;
        var mR = 40 * this.S;

        ctx.save();
        ctx.shadowColor = 'rgba(180, 220, 255, 0.4)';
        ctx.shadowBlur = 50 * this.S;

        var grad = ctx.createRadialGradient(mX, mY, 0, mX, mY, mR);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.8, '#e0f0ff');
        grad.addColorStop(1, '#aaccff');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mX, mY, mR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawStars() {
        var ctx = this.ctx;
        var t = this.time;

        for (var i = 0; i < this.stars.length; i++) {
            var s = this.stars[i];
            var a = s.maxA * (0.5 + 0.5 * Math.sin(t * s.speed + s.offset));
            ctx.save();
            ctx.globalAlpha = a;
            var rad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2);
            rad.addColorStop(0, '#ffffff');
            rad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawMountain(peakX, peakY, leftX, rightX, colorLightTop, colorLightBot, colorDarkTop, colorDarkBot, snowDepth, progress) {
        if (progress <= 0) return;

        var ctx = this.ctx;
        var S = this.S;
        var oX = this.oX;
        var oY = this.oY;
        var baseY = this.h + 10;
        var mtnH = 800 - peakY;
        var px = peakX * S + oX;
        var lx = leftX * S + oX;
        var rx = rightX * S + oX;
        var tPY = peakY * S + oY;
        var animPY = baseY + (tPY - baseY) * progress;

        var gradL = ctx.createLinearGradient(lx, animPY, px, baseY);
        gradL.addColorStop(0, colorLightTop);
        gradL.addColorStop(1, colorLightBot);
        ctx.fillStyle = gradL;
        ctx.beginPath();
        ctx.moveTo(lx, baseY);
        ctx.lineTo(px, animPY);
        ctx.lineTo(px, baseY);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(lx + (px - lx) * 0.45, baseY);
        ctx.lineTo(px, animPY);
        ctx.lineTo(px, baseY);
        ctx.fill();

        var gradD = ctx.createLinearGradient(px, animPY, rx, baseY);
        gradD.addColorStop(0, colorDarkTop);
        gradD.addColorStop(1, colorDarkBot);
        ctx.fillStyle = gradD;
        ctx.beginPath();
        ctx.moveTo(px, animPY);
        ctx.lineTo(rx, baseY);
        ctx.lineTo(px, baseY);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(px, animPY);
        ctx.lineTo(px + (rx - px) * 0.35, baseY);
        ctx.lineTo(px, baseY);
        ctx.fill();

        if (progress > 0.5) {
            var sa = (progress - 0.5) / 0.5;
            ctx.save();
            ctx.globalAlpha = sa;

            var ratio = snowDepth / mtnH;
            var snowLX = peakX + ratio * (leftX - peakX);
            var snowRX = peakX + ratio * (rightX - peakX);
            var snowBotScr = (peakY + snowDepth) * S + oY;
            var animSnow = baseY + (snowBotScr - baseY) * progress;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(px, animPY);
            ctx.lineTo(snowLX * S + oX, animSnow);
            ctx.lineTo(px, animSnow);
            ctx.fill();

            ctx.fillStyle = 'rgba(200, 230, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(px, animPY);
            ctx.lineTo(snowLX * S + oX + (px - snowLX * S - oX) * 0.5, animSnow);
            ctx.lineTo(px, animSnow);
            ctx.fill();

            ctx.fillStyle = '#c0d6f0';
            ctx.beginPath();
            ctx.moveTo(px, animPY);
            ctx.lineTo(snowRX * S + oX, animSnow);
            ctx.lineTo(px, animSnow);
            ctx.fill();

            ctx.fillStyle = 'rgba(10, 30, 60, 0.1)';
            ctx.beginPath();
            ctx.moveTo(px, animPY);
            ctx.lineTo(px + (snowRX * S + oX - px) * 0.4, animSnow);
            ctx.lineTo(px, animSnow);
            ctx.fill();

            ctx.restore();
        }
    }

    drawMtnFade(progress) {
        if (progress <= 0) return;
        var ctx = this.ctx;
        var fadeTop = 350 * this.S + this.oY;
        var g = ctx.createLinearGradient(0, fadeTop, 0, this.h);
        g.addColorStop(0, 'rgba(3, 10, 20, 0)');
        g.addColorStop(1, 'rgba(3, 10, 20, ' + progress + ')');
        ctx.fillStyle = g;
        ctx.fillRect(0, fadeTop, this.w, this.h - fadeTop);
    }

    drawAC(progress) {
        if (progress <= 0) return;

        var ctx = this.ctx;
        var S = this.S;
        var oX = this.oX;
        var oY = this.oY;

        var acX = 150 * S + oX;
        var acW = 500 * S;
        var acH = 140 * S;
        var acR = 25 * S;
        var acTargetY = 430 * S + oY;
        var acY = acTargetY + (1 - progress) * 80 * S;

        this.acCenterY = acY + acH / 2;

        ctx.save();
        ctx.globalAlpha = progress;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 35 * S;
        ctx.shadowOffsetY = 20 * S;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(acX, acY, acW, acH, acR);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        var bodyG = ctx.createLinearGradient(0, acY, 0, acY + acH);
        bodyG.addColorStop(0, 'rgba(255, 255, 255, 1)');
        bodyG.addColorStop(0.7, 'rgba(235, 242, 250, 1)');
        bodyG.addColorStop(1, 'rgba(215, 225, 235, 1)');
        ctx.fillStyle = bodyG;
        ctx.fill();

        var vM = acW * 0.06;
        var vX = acX + vM;
        var vH = 20 * S;
        var vY = acY + acH - vH - 12 * S;
        var vW = acW - vM * 2;

        var ventGrad = ctx.createLinearGradient(0, vY, 0, vY + vH);
        ventGrad.addColorStop(0, '#02060f');
        ventGrad.addColorStop(1, '#0a172e');
        ctx.fillStyle = ventGrad;
        ctx.beginPath();
        ctx.roundRect(vX, vY, vW, vH, 8 * S);
        ctx.fill();

        ctx.strokeStyle = '#050c17';
        ctx.lineWidth = 3 * S;
        for (var i = 1; i < 18; i++) {
            var finX = vX + (vW / 18) * i;
            ctx.beginPath();
            ctx.moveTo(finX, vY + 2 * S);
            ctx.lineTo(finX, vY + vH - 2 * S);
            ctx.stroke();
        }

        var swing = Math.sin(this.time * 0.6) * 1.5 * S;

        ctx.fillStyle = '#112240';
        ctx.beginPath();
        ctx.roundRect(vX + 6 * S, vY + vH * 0.25 + swing, vW - 12 * S, 3.5 * S, 2 * S);
        ctx.fill();

        var louverGrad = ctx.createLinearGradient(0, vY + vH * 0.65, 0, vY + vH * 0.65 + 4 * S);
        louverGrad.addColorStop(0, '#112240');
        louverGrad.addColorStop(1, '#203a63');
        ctx.fillStyle = louverGrad;
        ctx.beginPath();
        ctx.roundRect(vX + 6 * S, vY + vH * 0.65 + swing * 1.2, vW - 12 * S, 3.5 * S, 2 * S);
        ctx.fill();

        var sfR = 14 * S;
        var sfX = acX + 32 * S;
        var sfY = acY + 28 * S;

        ctx.fillStyle = '#030a14';
        ctx.beginPath();
        ctx.arc(sfX, sfY, sfR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 3 * S;
        ctx.beginPath();
        ctx.arc(sfX, sfY, sfR - 1 * S, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(sfX, sfY);
        ctx.rotate(this.time * 1.5);

        ctx.fillStyle = '#1e3c66';
        for (var b = 0; b < 3; b++) {
            ctx.rotate((Math.PI * 2) / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(sfR * 0.8, -sfR * 0.4, sfR * 0.85, 0);
            ctx.quadraticCurveTo(sfR * 0.5, sfR * 0.4, 0, 0);
            ctx.fill();
        }

        ctx.fillStyle = '#b1c4d9';
        ctx.beginPath();
        ctx.arc(0, 0, 3 * S, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#061326';
        ctx.beginPath();
        ctx.arc(0, 0, 1 * S, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        var btnX = acX + acW - 75 * S;
        var btnY = acY + 25 * S;
        var ledSpacing = 16 * S;

        for (var led = 0; led < 3; led++) {
            var phase = this.time * 0.8 - led * 1.5;
            var ledAlpha = 0.1 + 0.9 * Math.max(0, Math.sin(phase));

            if (ledAlpha > 0.3) {
                ctx.shadowColor = 'rgba(59, 158, 237, ' + ledAlpha + ')';
                ctx.shadowBlur = 10 * S * ledAlpha;
                ctx.fillStyle = 'rgba(59, 158, 237, ' + ledAlpha + ')';
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#0f1f38';
            }

            ctx.beginPath();
            ctx.arc(btnX + led * ledSpacing, btnY, 3.5 * S, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    easeOut(t) {
        return 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
    }

    animate(dt) {
        if (!this.canvas) return;
        if (!this.heroVisible && this.titleShown) return;

        var ctx = this.ctx;
        var w = this.w;
        var h = this.h;
        ctx.clearRect(0, 0, w, h);
        this.time += 0.016;

        if (this.mouseX > -1000) {
            this.targetWind = (this.mouseX - this.w / 2) / (this.w / 2);
        } else {
            this.targetWind = 0;
        }
        this.currentWind += (this.targetWind - this.currentWind) * 0.05;

        var elapsed = (performance.now() - this.startTime) / 1000;
        var bgAlpha = Math.min(elapsed / 0.5, 1);
        var bgAssetsProg = this.easeOut((elapsed - 0.5) / 1.0);
        var mtnProg = this.easeOut((elapsed - 0.2) / 1.0);
        var acProg = this.easeOut((elapsed - 0.8) / 1.0);
        var ridgeReady = elapsed > 1.4;
        var outReady = elapsed > 1.8;

        ctx.save();
        ctx.globalAlpha = bgAlpha;
        this.drawBg();
        ctx.restore();

        if (bgAlpha > 0.5) {
            ctx.save();
            ctx.globalAlpha = Math.min((bgAlpha - 0.5) * 2, 1);
            this.drawStars();
            ctx.restore();
        }

        if (bgAssetsProg > 0) {
            ctx.save();
            ctx.globalAlpha = bgAssetsProg;
            this.drawMoon();
            this.clouds.forEach(function (c) { c.update(); c.draw(ctx); });
            this.shootingStars.forEach(function (ss) { ss.update(); ss.draw(ctx); });
            ctx.restore();
        }

        this.drawMountain(560, 260, 114, 1193, '#1a4e99', '#0b2654', '#11356b', '#071838', 65, mtnProg);
        this.drawMountain(280, 220, -300, 754, '#246bcf', '#113a78', '#184b94', '#0a224a', 70, mtnProg);
        this.drawMtnFade(Math.min(mtnProg * 1.5, 1));

        if (ridgeReady && this.heroVisible) {
            ctx.save();
            ctx.translate(this.oX, 0);
            ctx.globalCompositeOperation = 'screen';
            for (var i = 0; i < this.particles.length; i++) {
                var p = this.particles[i];
                if (p.source !== 'out') { p.update(this.time, 0); p.draw(ctx); }
            }
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }

        this.drawAC(acProg);

        if (outReady && this.heroVisible) {
            ctx.save();
            ctx.translate(this.oX, 0);
            ctx.globalCompositeOperation = 'screen';
            for (var j = 0; j < this.particles.length; j++) {
                var p2 = this.particles[j];
                if (p2.source === 'out') { p2.update(this.time, this.currentWind); p2.draw(ctx); }
            }
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }

        if (acProg > 0.05 && this.acCenterY > 0) {
            var wrap = document.querySelector('.hero-content');
            if (wrap) wrap.style.top = this.acCenterY + 'px';
        }

        if (elapsed > 2.0 && !this.titleShown) {
            this.titleShown = true;
            if (this.titleEl) this.titleEl.classList.add('visible');
        }
    }
}

// ============================================================
//  4. REVEAL + COUNTERS
// ============================================================
function animateValue(el,start,end,duration){
    var startTs=null, suffix=el.dataset.suffix||'';
    function step(ts){
        if(!startTs) startTs=ts;
        var p=Math.min((ts-startTs)/duration,1), e=p*(2-p);
        el.textContent=Math.floor(e*(end-start)+start)+suffix;
        if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
function initReveal(){
    var els=document.querySelectorAll('.reveal');
    var obs=new IntersectionObserver(function(entries,ob){
        entries.forEach(function(entry){
            if(!entry.isIntersecting) return;
            entry.target.classList.add('active');
            var stat=entry.target.querySelector('.stat-number');
            if(stat&&!stat.dataset.animated){
                stat.dataset.animated='true';
                animateValue(stat,0,parseInt(stat.dataset.target,10),2000);
            }
            setTimeout(function(){entry.target.style.willChange='auto';},1000);
            ob.unobserve(entry.target);
        });
    },{threshold:0.1});
    els.forEach(function(el){obs.observe(el);});
}

// ============================================================
//  5. PILL
// ============================================================
(function(){
    var btns=document.querySelectorAll('.contact-btn');
    function closeAll(){
        btns.forEach(function(b){
            var p=document.getElementById(b.getAttribute('data-pill'));
            if(p){p.classList.remove('open');b.classList.remove('hidden');}
        });
    }
    btns.forEach(function(btn){
        var pill=document.getElementById(btn.getAttribute('data-pill'));
        if(!pill) return;
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var open=pill.classList.contains('open');
            closeAll();
            if(!open){pill.classList.add('open');btn.classList.add('hidden');}
        });
        pill.addEventListener('click',function(e){e.stopPropagation();});
    });
    document.addEventListener('click',closeAll);
})();

// ============================================================
//  6. «ЕЩЁ УСЛУГИ» — toggle
// ============================================================
(function(){
    var toggle=document.getElementById('moreToggle');
    var body=document.getElementById('moreBody');
    var label=document.getElementById('moreLabel');
    if(!toggle||!body) return;
    toggle.addEventListener('click',function(){
        var open=body.classList.contains('open');
        body.classList.toggle('open',!open);
        if(label) label.textContent=open?'Ещё услуги':'Скрыть';
    });
})();

// ============================================================
//  7. FAQ — accordion cards
// ============================================================
(function(){
    var toggles=document.querySelectorAll('#faq .faq-toggle');
    if(!toggles.length) return;

    function setCardState(card,open){
        if(!card) return;
        card.classList.toggle('open',open);
        var btn=card.querySelector('.faq-toggle');
        if(btn) btn.setAttribute('aria-expanded',open?'true':'false');
    }

    toggles.forEach(function(btn){
        btn.addEventListener('click',function(){
            var card=btn.closest('.faq-card');
            var shouldOpen=card && !card.classList.contains('open');

            toggles.forEach(function(otherBtn){
                setCardState(otherBtn.closest('.faq-card'),false);
            });

            if(shouldOpen){
                setCardState(card,true);
            }
        });
    });
})();

// ============================================================
//  8. RAF LOOP
// ============================================================
function renderLoop(time){
    var dt=time-lastTime; lastTime=time;
    if(dt>100) dt=16.6;
    if(heroCanvas) heroCanvas.animate(dt);
    rafId=requestAnimationFrame(renderLoop);
}

document.addEventListener('visibilitychange',function(){
    if(document.hidden) cancelAnimationFrame(rafId);
    else{lastTime=performance.now(); rafId=requestAnimationFrame(renderLoop);}
});

var resizeTimer;
window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(function(){
        if(!heroCanvas) return;
        /* Ignore mobile browser chrome height jumps; repaint on real layout width change. */
        if(window.innerWidth !== lastHeroViewportWidth){
            lastHeroViewportWidth = window.innerWidth;
            heroCanvas.resize();
        }
    },220);
},{passive:true});

// INIT
heroCanvas=new HeroCanvas();
heroCanvas.resize();
rafId=requestAnimationFrame(renderLoop);
initReveal();

/* Pause ribbons when hero off screen */
(function(){
    if(!heroCanvas||!heroCanvas.canvas) return;
    var obs=new IntersectionObserver(function(entries){
        heroCanvas.heroVisible=entries[0].isIntersecting;
    },{threshold:0.05});
    obs.observe(heroCanvas.section);
})();


