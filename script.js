/* =============================================
   KONDER.ONLINE — script.js v14
   Fixes: mobile mountain proportions (oY anchor),
          smooth air ribbons (no rain effect),
          dynamic hero-title positioned on AC body.
   ============================================= */

var rafId   = null;
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
        var g = lctx.createRadialGradient(W/2,H/2,0, W/2,H/2, W*0.7);
        g.addColorStop(0,   '#1a4a80');
        g.addColorStop(0.7, '#0e2d55');
        g.addColorStop(1,   '#071a38');
        lctx.fillStyle = g;
        lctx.beginPath(); lctx.roundRect(0,0,W,H,24); lctx.fill();
    }

    function drawLogoMtn(peakX, peakY, leftX, rightX, cL, cD) {
        lctx.fillStyle = cL;
        lctx.beginPath(); lctx.moveTo(leftX,H); lctx.lineTo(peakX,peakY); lctx.lineTo(peakX,H); lctx.fill();
        lctx.fillStyle = cD;
        lctx.beginPath(); lctx.moveTo(peakX,peakY); lctx.lineTo(rightX,H); lctx.lineTo(peakX,H); lctx.fill();
        var mH = H - peakY, sD = mH * 0.12, sBottomY = peakY + sD;
        var sLX = peakX + (sD/mH)*(leftX-peakX), sRX = peakX + (sD/mH)*(rightX-peakX);
        lctx.fillStyle = '#FFFFFF';
        lctx.beginPath(); lctx.moveTo(peakX,peakY); lctx.lineTo(sLX,sBottomY); lctx.lineTo(peakX,sBottomY); lctx.fill();
        lctx.fillStyle = '#AECDF5';
        lctx.beginPath(); lctx.moveTo(peakX,peakY); lctx.lineTo(sRX,sBottomY); lctx.lineTo(peakX,sBottomY); lctx.fill();
    }

    function drawLogoAC() {
        var acX=W*0.19, acY=H*0.54, acW=W*0.62, acH=H*0.175, acR=5;
        lctx.shadowColor='rgba(0,10,30,0.6)'; lctx.shadowBlur=8; lctx.shadowOffsetY=4;
        lctx.fillStyle='#FFFFFF';
        lctx.beginPath(); lctx.roundRect(acX,acY,acW,acH,acR); lctx.fill();
        lctx.shadowColor='transparent';
        var ventH=acH*0.18, ventX=acX+acW*0.1, ventY=acY+acH-ventH-acH*0.08, ventW=acW*0.8;
        lctx.fillStyle='#0F2B5B';
        lctx.beginPath(); lctx.roundRect(ventX,ventY,ventW,ventH,2); lctx.fill();
        var btnX=acX+acW*0.7, btnY=acY+acH*0.3;
        for (var j=0; j<3; j++) {
            var a = 0.3 + 0.7*((Math.sin(logoTime*2.5 - j*1.5)+1)/2);
            lctx.fillStyle='rgba(15,60,120,'+a+')';
            lctx.beginPath(); lctx.arc(btnX+j*6, btnY, 2, 0, Math.PI*2); lctx.fill();
        }
    }

    function drawLogoFade() {
        var g = lctx.createLinearGradient(0,H*0.5,0,H);
        g.addColorStop(0,'rgba(7,26,56,0)'); g.addColorStop(1,'rgba(7,26,56,1)');
        lctx.fillStyle=g; lctx.fillRect(0,H*0.5,W,H*0.5);
    }

    function animLogo() {
        lctx.clearRect(0,0,W,H);
        drawLogoBg();
        drawLogoMtn(W*0.7,  H*0.325, W*0.14,   W*1.49,  '#12438C','#0A2554');
        drawLogoMtn(W*0.35, H*0.275, -W*0.375, W*0.94,  '#1E63C2','#123D78');
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

// ─────────────────────────────────────────────────────────────
//  WindRibbon — silky air streams
//
//  Changes from v13:
//  • Accepts oY so Y coordinates anchor to the bottom of the
//    800×800 composition, not the canvas top — no portrait distortion
//  • Much longer trail (40-62 pts) → continuous ribbon, never a dot
//  • Slower speeds (0.001-0.0026) → graceful, floaty feel
//  • 'out' streams fan WIDE & diagonally — no vertical "rain" paths
//  • draw() uses midpoint-smoothed quadratic bezier + linear gradient
// ─────────────────────────────────────────────────────────────
function WindRibbon(source, S, oY) {
    this.source  = source;
    this.S       = S;
    this.oY      = oY || 0;
    this.history = [];
    this.reset(true);
}

WindRibbon.prototype.reset = function (isInitial) {
    var S = this.S, oY = this.oY;
    this.t           = isInitial ? Math.random() : 0;
    this.speed       = 0.0010 + Math.random() * 0.0016;
    this.history     = [];
    this.trailLength = Math.floor(40 + Math.random() * 22);
    this.baseWidth   = (5 + Math.random() * 9) * S;

    if (this.source === 'left_ridge') {
        var lerp = Math.random();
        this.startX = (280 + lerp*80)  * S;
        this.startY = (220 + lerp*70)  * S + oY;
        this.endX   = (140 + Math.random()*260) * S;
        this.endY   = 448 * S + oY;
        this.cp1X   = this.startX - 55*S;
        this.cp1Y   = this.startY + 55*S;
        this.cp2X   = this.endX   + 90*S;
        this.cp2Y   = this.endY   - 85*S;
    } else if (this.source === 'right_ridge') {
        var lerp2 = Math.random();
        this.startX = (560 - lerp2*60) * S;
        this.startY = (260 + lerp2*50) * S + oY;
        this.endX   = (400 + Math.random()*260) * S;
        this.endY   = 448 * S + oY;
        this.cp1X   = this.startX + 55*S;
        this.cp1Y   = this.startY + 55*S;
        this.cp2X   = this.endX   - 90*S;
        this.cp2Y   = this.endY   - 85*S;
    } else {
        // 'out' — cold air from AC vent fans WIDE and diagonally outward
        var xPos = 285 + Math.random() * 230;
        this.startX = xPos * S;
        this.startY = 565 * S + oY;
        var dx    = (xPos - 400) * 3.4;          // strong horizontal divergence
        var swirl = (Math.random() - 0.5) * 110;
        this.endX  = (xPos + dx + swirl) * S;
        this.endY  = (710 + Math.random() * 90)  * S + oY;
        this.cp1X  = (xPos + (Math.random()-0.5)*80) * S;
        this.cp1Y  = (598 + Math.random()*28)    * S + oY;
        this.cp2X  = (xPos + dx*0.62 + (Math.random()-0.5)*95) * S;
        this.cp2Y  = (662 + Math.random()*38)    * S + oY;
    }
};

WindRibbon.prototype.getPoint = function (time) {
    var t=this.t, u=1-t, tt=t*t, uu=u*u;
    var x = uu*u*this.startX + 3*uu*t*this.cp1X + 3*u*tt*this.cp2X + tt*t*this.endX;
    var y = uu*u*this.startY + 3*uu*t*this.cp1Y + 3*u*tt*this.cp2Y + tt*t*this.endY;
    // Horizontal-only undulation — no vertical jitter (vertical = rain)
    x += Math.sin(time*1.6 + t*Math.PI*3.5) * 5 * this.S;
    return { x:x, y:y };
};

WindRibbon.prototype.update = function (time) {
    this.t += this.speed;
    if (this.t > 1) { this.reset(false); return; }
    this.history.unshift(this.getPoint(time));
    if (this.history.length > this.trailLength) this.history.pop();
};

WindRibbon.prototype.draw = function (ctx) {
    var h = this.history;
    if (h.length < 3) return;

    var alpha = 1;
    if (this.t < 0.12) alpha = this.t / 0.12;
    if (this.t > 0.82) alpha = (1 - this.t) / 0.18;

    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    // Smooth path via midpoint averaging (catmull-rom-like)
    ctx.beginPath();
    ctx.moveTo(h[0].x, h[0].y);
    for (var i = 0; i < h.length - 1; i++) {
        var mx = (h[i].x + h[i+1].x) * 0.5;
        var my = (h[i].y + h[i+1].y) * 0.5;
        ctx.quadraticCurveTo(h[i].x, h[i].y, mx, my);
    }
    ctx.lineTo(h[h.length-1].x, h[h.length-1].y);

    // Gradient: luminous head → fully transparent tail
    var p0 = h[0], pN = h[h.length-1];
    if (Math.abs(pN.x-p0.x) + Math.abs(pN.y-p0.y) < 0.5) { ctx.restore(); return; }
    var grad = ctx.createLinearGradient(p0.x, p0.y, pN.x, pN.y);
    grad.addColorStop(0,    'rgba(195,240,255,' + (alpha*0.72) + ')');
    grad.addColorStop(0.30, 'rgba(170,225,255,' + (alpha*0.30) + ')');
    grad.addColorStop(1,    'rgba(140,200,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth   = this.baseWidth;
    ctx.stroke();
    ctx.restore();
};

// ─────────────────────────────────────────────────────────────
//  HeroCanvas
// ─────────────────────────────────────────────────────────────
function HeroCanvas() {
    this.canvas   = document.getElementById('hero-canvas');
    if (!this.canvas) return;
    this.section  = this.canvas.parentElement;
    this.ctx      = this.canvas.getContext('2d');
    this.ribbons  = [];
    this.stars    = [];
    this.w = 0; this.h = 0;
    this.S = 1; this.oX = 0; this.oY = 0;
    this.acCenterY  = 0;    // tracks AC body center for hero-content
    this.time       = 0;
    this.startTime  = performance.now();
    this.titleShown = false;
    this.heroVisible = true;
}

HeroCanvas.prototype.resize = function () {
    if (!this.canvas) return;
    var dpr   = Math.min(window.devicePixelRatio || 1, 2);
    this.w    = this.section.offsetWidth;
    this.h    = this.section.offsetHeight;
    this.canvas.width  = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width  = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Uniform scale: fit 800×800 composition inside the canvas
    this.S  = Math.min(this.h / 800, this.w / 800);
    this.oX = (this.w - 800 * this.S) / 2;

    // ── Portrait/mobile mountain fix ──────────────────────────
    // On landscape desktop: 800*S ≈ h → naturalOY ≈ 0 → no change.
    // On portrait phones: naturalOY can be 400-500 px (huge empty sky).
    // We cap the sky gap at 45 % of screen height so mountains stay
    // large, well-proportioned and visually prominent on all devices.
    var naturalOY = this.h - 800 * this.S;
    this.oY = Math.min(Math.max(naturalOY, 0), this.h * 0.45);

    // Build ribbons with updated S and oY
    this.ribbons = [];
    var S = this.S, oY = this.oY;
    for (var i=0; i<18; i++) this.ribbons.push(new WindRibbon('left_ridge',  S, oY));
    for (var j=0; j<18; j++) this.ribbons.push(new WindRibbon('right_ridge', S, oY));
    for (var k=0; k<30; k++) this.ribbons.push(new WindRibbon('out',         S, oY));

    // Stars — confined to the sky region above mountains
    this.stars = [];
    var skyH  = Math.max(this.oY, this.h * 0.30);
    var count = Math.min(Math.floor(this.w * skyH / 12000), 45);
    for (var s=0; s<count; s++) {
        this.stars.push({
            x:      Math.random() * this.w,
            y:      Math.random() * skyH,
            size:   0.4 + Math.random() * 1.6,
            speed:  0.4 + Math.random() * 1.2,
            offset: Math.random() * Math.PI * 2,
            maxA:   0.25 + Math.random() * 0.45
        });
    }
};

HeroCanvas.prototype.drawBg = function () {
    var ctx=this.ctx, w=this.w, h=this.h;
    var g = ctx.createRadialGradient(w/2, h*0.4, 0, w/2, h*0.4, Math.max(w,h)*0.85);
    g.addColorStop(0,   '#2a6595');
    g.addColorStop(0.5, '#0e2d55');
    g.addColorStop(1,   '#071a38');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
};

HeroCanvas.prototype.drawStars = function () {
    var ctx=this.ctx, t=this.time;
    for (var i=0; i<this.stars.length; i++) {
        var s=this.stars[i];
        var a = s.maxA * (0.5 + 0.5*Math.sin(t*s.speed + s.offset));
        ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#ffffff';
        if (s.size > 1.0) {
            var sz=s.size;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y-sz*1.6); ctx.lineTo(s.x+sz*0.3, s.y);
            ctx.lineTo(s.x, s.y+sz*1.6); ctx.lineTo(s.x-sz*0.3, s.y);
            ctx.closePath(); ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
};

// Mountain with slope-following snow caps.
// KEY FIX: targetPY = peakY*S + oY  (not just peakY*S)
// This anchors peaks relative to the canvas BOTTOM (like baseY),
// preserving correct proportions on portrait/mobile screens.
HeroCanvas.prototype.drawMountain = function (peakX, peakY, leftX, rightX, colorL, colorD, snowDepth, progress) {
    var ctx=this.ctx, S=this.S, oX=this.oX, oY=this.oY;
    var baseY = this.h + 10;
    var mtnH  = 800 - peakY;

    var px = peakX * S + oX;
    var lx  = leftX  * S + oX;
    var rx  = rightX * S + oX;

    var targetPY = peakY * S + oY;              // ← FIX: add oY
    var animPY   = baseY + (targetPY - baseY) * progress;

    ctx.fillStyle = colorL;
    ctx.beginPath(); ctx.moveTo(lx,baseY); ctx.lineTo(px,animPY); ctx.lineTo(px,baseY); ctx.fill();
    ctx.fillStyle = colorD;
    ctx.beginPath(); ctx.moveTo(px,animPY); ctx.lineTo(rx,baseY); ctx.lineTo(px,baseY); ctx.fill();

    if (progress > 0.7) {
        var snowAlpha = (progress - 0.7) / 0.3;
        ctx.save(); ctx.globalAlpha = snowAlpha;

        var ratio      = snowDepth / mtnH;
        var snowLeftX  = peakX + ratio*(leftX  - peakX);
        var snowRightX = peakX + ratio*(rightX - peakX);

        var snowBottomScreen = (peakY + snowDepth) * S + oY;  // ← FIX: add oY
        var animSnowBottom   = baseY + (snowBottomScreen - baseY) * progress;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(px, animPY);
        ctx.lineTo(snowLeftX*S+oX, animSnowBottom);
        ctx.lineTo(px, animSnowBottom);
        ctx.fill();

        ctx.fillStyle = '#AECDF5';
        ctx.beginPath();
        ctx.moveTo(px, animPY);
        ctx.lineTo(snowRightX*S+oX, animSnowBottom);
        ctx.lineTo(px, animSnowBottom);
        ctx.fill();

        ctx.restore();
    }
};

HeroCanvas.prototype.drawMtnFade = function (progress) {
    if (progress <= 0) return;
    var ctx=this.ctx, w=this.w, h=this.h, S=this.S;
    var fadeTop = 400*S + this.oY;              // ← FIX: add oY
    var g = ctx.createLinearGradient(0, fadeTop, 0, h);
    g.addColorStop(0, 'rgba(5,20,45,0)');
    g.addColorStop(1, 'rgba(5,20,45,' + progress + ')');
    ctx.fillStyle=g; ctx.fillRect(0, fadeTop, w, h-fadeTop);
};

HeroCanvas.prototype.drawAC = function (progress) {
    if (progress <= 0) return;
    var ctx=this.ctx, S=this.S, oX=this.oX, oY=this.oY;

    var acX = 150*S + oX;
    var acW = 500*S;
    var acH = 140*S;
    var acR = 25*S;
    var acTargetY = 430*S + oY;                 // ← FIX: add oY
    var acY = acTargetY + (1-progress)*50*S;

    // Store AC body center so animate() can position hero-content
    this.acCenterY = acY + acH/2;

    ctx.save(); ctx.globalAlpha = progress;

    ctx.shadowColor='rgba(0,10,30,0.7)'; ctx.shadowBlur=20*S; ctx.shadowOffsetY=12*S;
    ctx.fillStyle='#FFFFFF';
    ctx.beginPath(); ctx.roundRect(acX,acY,acW,acH,acR); ctx.fill();
    ctx.shadowColor='transparent';

    var bodyG = ctx.createLinearGradient(0,acY, 0,acY+acH);
    bodyG.addColorStop(0.5,'rgba(255,255,255,0)');
    bodyG.addColorStop(1,  'rgba(150,200,255,0.35)');
    ctx.fillStyle=bodyG; ctx.fill();

    var ventMargin=acW*0.1, ventX=acX+ventMargin, ventH=18*S;
    var ventY=acY+acH-ventH-8*S, ventW=acW-ventMargin*2;
    ctx.fillStyle='#0F2B5B';
    ctx.beginPath(); ctx.roundRect(ventX,ventY,ventW,ventH,6*S); ctx.fill();

    ctx.strokeStyle='#2858A6'; ctx.lineWidth=Math.max(2,3*S); ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(ventX+12*S,   ventY+ventH/2);
    ctx.lineTo(ventX+ventW-12*S, ventY+ventH/2);
    ctx.stroke();

    // Snowflake crystal
    var sfX=acX+38*S, sfY=acY+28*S, arm=10*S, br=3.5*S;
    ctx.strokeStyle='#3A82DF'; ctx.lineWidth=Math.max(1.5,2*S); ctx.lineCap='round';
    for (var i=0; i<6; i++) {
        ctx.save(); ctx.translate(sfX,sfY); ctx.rotate((Math.PI/3)*i);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(arm,0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arm*0.55,0); ctx.lineTo(arm*0.55+br*0.5,-br);
        ctx.moveTo(arm*0.55,0); ctx.lineTo(arm*0.55+br*0.5, br);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arm,0); ctx.lineTo(arm-br*0.3,-br*0.55);
        ctx.moveTo(arm,0); ctx.lineTo(arm-br*0.3, br*0.55);
        ctx.stroke();
        ctx.restore();
    }
    ctx.fillStyle='#5BBBFF'; ctx.beginPath(); ctx.arc(sfX,sfY,1.8*S,0,Math.PI*2); ctx.fill();

    var btnX=acX+acW-52*S, btnY=acY+28*S;
    for (var j=0; j<3; j++) {
        var da = 0.2 + 0.8*((Math.sin(this.time*2 - j*1.5)+1)/2);
        ctx.fillStyle='rgba(15,60,120,'+da+')';
        ctx.beginPath(); ctx.arc(btnX+j*14*S, btnY, 3.5*S, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
};

function easeOut(t) { return 1 - Math.pow(1 - Math.min(Math.max(t,0),1), 3); }

HeroCanvas.prototype.animate = function (dt) {
    if (!this.canvas) return;
    if (!this.heroVisible && this.titleShown) return;
    var ctx=this.ctx, w=this.w, h=this.h;
    ctx.clearRect(0, 0, w, h);

    this.time += 0.016;
    var elapsed  = (performance.now() - this.startTime) / 1000;

    var bgAlpha    = easeOut(elapsed / 0.5);
    var mtnProg    = easeOut((elapsed - 0.3)  / 1.2);
    var fadeProg   = easeOut((elapsed - 1.2)  / 0.6);
    var acProg     = easeOut((elapsed - 1.5)  / 0.8);
    var ridgeReady = elapsed > 1.0;
    var outReady   = elapsed > 2.2;

    ctx.save(); ctx.globalAlpha=bgAlpha; this.drawBg(); ctx.restore();

    if (bgAlpha > 0.5) {
        ctx.save();
        ctx.globalAlpha = Math.min((bgAlpha-0.5)*2, 1);
        this.drawStars();
        ctx.restore();
    }

    this.drawMountain(560, 260,  114, 1193, '#12438C','#0A2554', 65, mtnProg);
    this.drawMountain(280, 220, -300,  754, '#1E63C2','#123D78', 70, mtnProg);
    this.drawMtnFade(fadeProg);

    if (ridgeReady && this.heroVisible) {
        ctx.save(); ctx.translate(this.oX, 0);
        ctx.globalCompositeOperation = 'screen';
        for (var i=0; i<this.ribbons.length; i++) {
            var r = this.ribbons[i];
            if (r.source !== 'out') { r.update(this.time); r.draw(ctx); }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    this.drawAC(acProg);

    if (outReady && this.heroVisible) {
        ctx.save(); ctx.translate(this.oX, 0);
        ctx.globalCompositeOperation = 'screen';
        for (var j=0; j<this.ribbons.length; j++) {
            var r2 = this.ribbons[j];
            if (r2.source === 'out') { r2.update(this.time); r2.draw(ctx); }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    // ── Issue 3: position .hero-content exactly on the AC body ──
    // acCenterY is updated each frame by drawAC(), so the label tracks
    // the slide-in animation smoothly. CSS transform:translateY(-50%)
    // means setting top=acCenterY visually centres the element on the AC.
    if (acProg > 0.05 && this.acCenterY > 0) {
        var wrap = document.querySelector('.hero-content');
        if (wrap) wrap.style.top = this.acCenterY + 'px';
    }

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
    var startTs=null, suffix=el.dataset.suffix||'';
    function step(timestamp) {
        if (!startTs) startTs=timestamp;
        var progress=Math.min((timestamp-startTs)/duration, 1);
        var eased=progress*(2-progress);
        el.textContent=Math.floor(eased*(end-start)+start)+suffix;
        if (progress<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function initReveal() {
    var els=document.querySelectorAll('.reveal');
    var observer=new IntersectionObserver(function(entries,obs){
        entries.forEach(function(entry){
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            var stat=entry.target.querySelector('.stat-number');
            if (stat && !stat.dataset.animated) {
                stat.dataset.animated='true';
                animateValue(stat, 0, parseInt(stat.dataset.target,10), 2000);
            }
            setTimeout(function(){ entry.target.style.willChange='auto'; }, 1000);
            obs.unobserve(entry.target);
        });
    }, { threshold:0.1 });
    els.forEach(function(el){ observer.observe(el); });
}

// ============================================================
//  5. PILL
// ============================================================
(function(){
    var btns=document.querySelectorAll('.contact-btn');
    function closeAll(){
        btns.forEach(function(b){
            var p=document.getElementById(b.getAttribute('data-pill'));
            if(p){ p.classList.remove('open'); b.classList.remove('hidden'); }
        });
    }
    btns.forEach(function(btn){
        var pill=document.getElementById(btn.getAttribute('data-pill'));
        if (!pill) return;
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var open=pill.classList.contains('open');
            closeAll();
            if(!open){ pill.classList.add('open'); btn.classList.add('hidden'); }
        });
        pill.addEventListener('click',function(e){ e.stopPropagation(); });
    });
    document.addEventListener('click', closeAll);
})();

// ============================================================
//  6. «ЕЩЁ УСЛУГИ» — toggle
// ============================================================
(function(){
    var toggle=document.getElementById('moreToggle');
    var body=document.getElementById('moreBody');
    var label=document.getElementById('moreLabel');
    if (!toggle||!body) return;
    toggle.addEventListener('click',function(){
        var open=body.classList.contains('open');
        body.classList.toggle('open',!open);
        if(label) label.textContent=open?'Ещё услуги':'Скрыть';
    });
})();

// ============================================================
//  7. RAF LOOP
// ============================================================
function renderLoop(time){
    var dt=time-lastTime; lastTime=time;
    if(dt>100) dt=16.6;
    if(heroCanvas) heroCanvas.animate(dt);
    rafId=requestAnimationFrame(renderLoop);
}

document.addEventListener('visibilitychange',function(){
    if(document.hidden) cancelAnimationFrame(rafId);
    else { lastTime=performance.now(); rafId=requestAnimationFrame(renderLoop); }
});

var resizeTimer;
window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(function(){
        if(heroCanvas) heroCanvas.resize();
    }, 250);
});

// INIT
heroCanvas = new HeroCanvas();
heroCanvas.resize();
rafId = requestAnimationFrame(renderLoop);
initReveal();

// Pause ribbons when hero is off screen
(function(){
    if (!heroCanvas||!heroCanvas.canvas) return;
    var obs=new IntersectionObserver(function(entries){
        heroCanvas.heroVisible=entries[0].isIntersecting;
    }, { threshold:0.05 });
    obs.observe(heroCanvas.section);
})();
