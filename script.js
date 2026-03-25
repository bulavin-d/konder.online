/* =============================================
   KONDER.ONLINE — script.js v15
   - Thin elegant wind lines (no more fat ribbons)
   - Correct air flow: mountains → AC intake → out of vent
   - Portrait mobile: S scales to HEIGHT so mountains fill screen
   - Touch scroll glitch fixed (overscroll, rAF guard)
   ============================================= */

var rafId    = null;
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
//  3. HERO CANVAS — Mountains + AC + Air Streams + Stars
// ============================================================
var heroCanvas = null;

/* ─────────────────────────────────────────────────────────────
   WindStream — thin, elegant air lines (like the wind icon)

   Concept: "The same fresh mountain air — inside your home"
   • 'in_left'  : flows FROM left mountain slopes → INTO AC intake
   • 'in_right' : flows FROM right mountain slopes → INTO AC intake
   • 'out'      : blows OUT of AC vent, fanning downward/sideways

   Visual style: thin single-pixel-ish lines, smooth catmull-rom,
   slight undulation — matching the provided wind icon aesthetic.
───────────────────────────────────────────────────────────── */
function WindStream(source, S, oY) {
    this.source  = source;
    this.S       = S;
    this.oY      = oY || 0;
    this.history = [];
    this.reset(true);
}

WindStream.prototype.reset = function (isInitial) {
    var S = this.S, oY = this.oY;
    this.t           = isInitial ? Math.random() : 0;
    this.history     = [];

    if (this.source === 'in_left') {
        /* Air gathered off left-mountain ridge, swept into AC top/left */
        this.speed       = 0.0012 + Math.random() * 0.0014;
        this.trailLength = Math.floor(50 + Math.random() * 30);
        this.lineWidth   = (0.8 + Math.random() * 0.9) * S;

        var lerp = Math.random();
        /* Start: somewhere along the left-mountain slope */
        this.startX = (210 + lerp * 130) * S;
        this.startY = (230 + lerp * 80)  * S + oY;
        /* End: near the AC body — top-center area */
        this.endX   = (220 + Math.random() * 180) * S;
        this.endY   = (438 + Math.random() * 30)  * S + oY;
        /* Control points: sweep in a wide concave arc — no sharp angles */
        this.cp1X   = this.startX - (20 + Math.random() * 40) * S;
        this.cp1Y   = this.startY + (60 + Math.random() * 50) * S;
        this.cp2X   = this.endX   - (30 + Math.random() * 50) * S;
        this.cp2Y   = this.endY   - (80 + Math.random() * 40) * S;

    } else if (this.source === 'in_right') {
        /* Mirror: air off right mountain, sweeps left into AC */
        this.speed       = 0.0012 + Math.random() * 0.0014;
        this.trailLength = Math.floor(50 + Math.random() * 30);
        this.lineWidth   = (0.8 + Math.random() * 0.9) * S;

        var lerp2 = Math.random();
        this.startX = (490 + lerp2 * 100) * S;
        this.startY = (250 + lerp2 * 60)  * S + oY;
        this.endX   = (400 + Math.random() * 190) * S;
        this.endY   = (438 + Math.random() * 30)  * S + oY;
        this.cp1X   = this.startX + (20 + Math.random() * 40) * S;
        this.cp1Y   = this.startY + (60 + Math.random() * 50) * S;
        this.cp2X   = this.endX   + (30 + Math.random() * 50) * S;
        this.cp2Y   = this.endY   - (80 + Math.random() * 40) * S;

    } else {
        /* 'out' — cold air ejected from vent, fans wide and soft */
        this.speed       = 0.0014 + Math.random() * 0.0018;
        this.trailLength = Math.floor(55 + Math.random() * 35);
        this.lineWidth   = (0.7 + Math.random() * 0.8) * S;

        var xPos  = 260 + Math.random() * 280;   /* across the vent width */
        var dx    = (xPos - 400) * 2.8;           /* diverge from center */
        var swirl = (Math.random() - 0.5) * 120;

        this.startX = xPos * S;
        this.startY = (568 + Math.random() * 10) * S + oY;
        this.endX   = (xPos + dx + swirl) * S;
        this.endY   = (700 + Math.random() * 80)  * S + oY;
        /* Lazy S-curve — strong horizontal spread, gentle vertical drop */
        this.cp1X   = (xPos + dx * 0.15 + (Math.random()-0.5)*60) * S;
        this.cp1Y   = (600  + Math.random() * 20) * S + oY;
        this.cp2X   = (xPos + dx * 0.70 + (Math.random()-0.5)*80) * S;
        this.cp2Y   = (655  + Math.random() * 30) * S + oY;
    }
};

WindStream.prototype.getPoint = function (time) {
    var t=this.t, u=1-t, tt=t*t, uu=u*u;
    var x = uu*u*this.startX + 3*uu*t*this.cp1X + 3*u*tt*this.cp2X + tt*t*this.endX;
    var y = uu*u*this.startY + 3*uu*t*this.cp1Y + 3*u*tt*this.cp2Y + tt*t*this.endY;
    /* Gentle horizontal undulation only — no vertical jitter */
    x += Math.sin(time * 1.8 + t * Math.PI * 4.0) * 3.5 * this.S;
    return { x:x, y:y };
};

WindStream.prototype.update = function (time) {
    this.t += this.speed;
    if (this.t > 1) { this.reset(false); return; }
    this.history.unshift(this.getPoint(time));
    if (this.history.length > this.trailLength) this.history.pop();
};

WindStream.prototype.draw = function (ctx) {
    var h = this.history;
    if (h.length < 3) return;

    /* Fade in at start, fade out at end of journey */
    var alpha = 1;
    if (this.t < 0.10) alpha = this.t / 0.10;
    if (this.t > 0.85) alpha = (1 - this.t) / 0.15;

    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    /* Smooth path via midpoint catmull-rom */
    ctx.beginPath();
    ctx.moveTo(h[0].x, h[0].y);
    for (var i = 0; i < h.length - 1; i++) {
        var mx = (h[i].x + h[i+1].x) * 0.5;
        var my = (h[i].y + h[i+1].y) * 0.5;
        ctx.quadraticCurveTo(h[i].x, h[i].y, mx, my);
    }
    ctx.lineTo(h[h.length-1].x, h[h.length-1].y);

    /* Gradient: bright head → transparent tail */
    var p0 = h[0], pN = h[h.length-1];
    var gdx = pN.x - p0.x, gdy = pN.y - p0.y;
    if (Math.abs(gdx) + Math.abs(gdy) < 0.5) { ctx.restore(); return; }
    var grad = ctx.createLinearGradient(p0.x, p0.y, pN.x, pN.y);
    /* 'in' streams are slightly warmer blue; 'out' streams are cooler/icy */
    if (this.source !== 'out') {
        grad.addColorStop(0,    'rgba(180, 225, 255, ' + (alpha * 0.85) + ')');
        grad.addColorStop(0.35, 'rgba(160, 210, 255, ' + (alpha * 0.35) + ')');
        grad.addColorStop(1,    'rgba(140, 200, 255, 0)');
    } else {
        grad.addColorStop(0,    'rgba(210, 245, 255, ' + (alpha * 0.90) + ')');
        grad.addColorStop(0.35, 'rgba(185, 235, 255, ' + (alpha * 0.35) + ')');
        grad.addColorStop(1,    'rgba(165, 225, 255, 0)');
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth   = this.lineWidth;
    ctx.stroke();
    ctx.restore();
};

// ─────────────────────────────────────────────────────────────
//  HeroCanvas
// ─────────────────────────────────────────────────────────────
function HeroCanvas() {
    this.canvas  = document.getElementById('hero-canvas');
    if (!this.canvas) return;
    this.section = this.canvas.parentElement;
    this.ctx     = this.canvas.getContext('2d');
    this.streams  = [];
    this.stars    = [];
    this.w = 0; this.h = 0;
    this.S = 1; this.oX = 0; this.oY = 0;
    this.acCenterY   = 0;
    this.time        = 0;
    this.startTime   = performance.now();
    this.titleShown  = false;
    this.heroVisible = true;
    this._scrolling  = false;
}

HeroCanvas.prototype.resize = function () {
    if (!this.canvas) return;
    var dpr  = Math.min(window.devicePixelRatio || 1, 2);
    this.w   = this.section.offsetWidth;
    this.h   = this.section.offsetHeight;
    this.canvas.width  = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width  = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* ── Scale strategy ────────────────────────────────────────
       Portrait (mobile) : S = h/800  → composition fills screen HEIGHT
                           oY = 0     → mountains anchor to canvas bottom
                           oX centers the 800-wide composition (may clip
                           slightly on narrow screens, that's fine — the
                           important elements, mountains + AC, are centered)

       Landscape / Desktop: S = min(h/800, w/800), oY ≥ 0 as before
    ──────────────────────────────────────────────────────────── */
    var isPortrait = this.h > this.w;
    if (isPortrait) {
        this.S  = this.h / 800;
        this.oX = (this.w - 800 * this.S) / 2;
        this.oY = 0;
    } else {
        this.S  = Math.min(this.h / 800, this.w / 800);
        this.oX = (this.w - 800 * this.S) / 2;
        var naturalOY = this.h - 800 * this.S;
        this.oY = Math.min(Math.max(naturalOY, 0), this.h * 0.40);
    }

    /* Build streams with updated S and oY */
    this.streams = [];
    var S = this.S, oY = this.oY;
    for (var i=0; i<16; i++) this.streams.push(new WindStream('in_left',  S, oY));
    for (var j=0; j<16; j++) this.streams.push(new WindStream('in_right', S, oY));
    for (var k=0; k<28; k++) this.streams.push(new WindStream('out',      S, oY));

    /* Stars in sky region */
    this.stars = [];
    var skyH  = isPortrait ? this.h * 0.38 : Math.max(this.oY + 200*this.S, this.h * 0.35);
    var count = Math.min(Math.floor(this.w * skyH / 13000), 42);
    for (var s=0; s<count; s++) {
        this.stars.push({
            x:      Math.random() * this.w,
            y:      Math.random() * skyH,
            size:   0.4 + Math.random() * 1.5,
            speed:  0.4 + Math.random() * 1.2,
            offset: Math.random() * Math.PI * 2,
            maxA:   0.22 + Math.random() * 0.42
        });
    }
};

HeroCanvas.prototype.drawBg = function () {
    var ctx=this.ctx, w=this.w, h=this.h;
    var g = ctx.createRadialGradient(w/2,h*0.4,0,w/2,h*0.4,Math.max(w,h)*0.85);
    g.addColorStop(0,'#2a6595'); g.addColorStop(0.5,'#0e2d55'); g.addColorStop(1,'#071a38');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
};

HeroCanvas.prototype.drawStars = function () {
    var ctx=this.ctx, t=this.time;
    for(var i=0;i<this.stars.length;i++){
        var s=this.stars[i];
        var a=s.maxA*(0.5+0.5*Math.sin(t*s.speed+s.offset));
        ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#ffffff';
        if(s.size>1.0){
            var sz=s.size;
            ctx.beginPath();
            ctx.moveTo(s.x,s.y-sz*1.6); ctx.lineTo(s.x+sz*0.3,s.y);
            ctx.lineTo(s.x,s.y+sz*1.6); ctx.lineTo(s.x-sz*0.3,s.y);
            ctx.closePath(); ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
};

/* Mountain rendering — oY anchors peaks relative to canvas bottom */
HeroCanvas.prototype.drawMountain = function (peakX,peakY,leftX,rightX,colorL,colorD,snowDepth,progress) {
    var ctx=this.ctx, S=this.S, oX=this.oX, oY=this.oY;
    var baseY  = this.h + 10;
    var mtnH   = 800 - peakY;
    var px     = peakX*S + oX;
    var lx     = leftX*S  + oX;
    var rx     = rightX*S + oX;
    var tPY    = peakY*S + oY;
    var animPY = baseY + (tPY - baseY) * progress;

    ctx.fillStyle=colorL;
    ctx.beginPath(); ctx.moveTo(lx,baseY); ctx.lineTo(px,animPY); ctx.lineTo(px,baseY); ctx.fill();
    ctx.fillStyle=colorD;
    ctx.beginPath(); ctx.moveTo(px,animPY); ctx.lineTo(rx,baseY); ctx.lineTo(px,baseY); ctx.fill();

    if(progress>0.7){
        var sa=(progress-0.7)/0.3;
        ctx.save(); ctx.globalAlpha=sa;
        var ratio      = snowDepth/mtnH;
        var snowLX     = peakX + ratio*(leftX  - peakX);
        var snowRX     = peakX + ratio*(rightX - peakX);
        var snowBotScr = (peakY+snowDepth)*S + oY;
        var animSnow   = baseY + (snowBotScr - baseY) * progress;
        ctx.fillStyle='#FFFFFF';
        ctx.beginPath(); ctx.moveTo(px,animPY); ctx.lineTo(snowLX*S+oX,animSnow); ctx.lineTo(px,animSnow); ctx.fill();
        ctx.fillStyle='#AECDF5';
        ctx.beginPath(); ctx.moveTo(px,animPY); ctx.lineTo(snowRX*S+oX,animSnow); ctx.lineTo(px,animSnow); ctx.fill();
        ctx.restore();
    }
};

HeroCanvas.prototype.drawMtnFade = function (progress) {
    if(progress<=0) return;
    var ctx=this.ctx, w=this.w, h=this.h;
    var fadeTop = 400*this.S + this.oY;
    var g = ctx.createLinearGradient(0,fadeTop,0,h);
    g.addColorStop(0,'rgba(5,20,45,0)');
    g.addColorStop(1,'rgba(5,20,45,'+progress+')');
    ctx.fillStyle=g; ctx.fillRect(0,fadeTop,w,h-fadeTop);
};

HeroCanvas.prototype.drawAC = function (progress) {
    if(progress<=0) return;
    var ctx=this.ctx, S=this.S, oX=this.oX, oY=this.oY;
    var acX       = 150*S + oX;
    var acW       = 500*S;
    var acH       = 140*S;
    var acR       = 25*S;
    var acTargetY = 430*S + oY;
    var acY       = acTargetY + (1-progress)*50*S;

    this.acCenterY = acY + acH/2;

    ctx.save(); ctx.globalAlpha=progress;
    ctx.shadowColor='rgba(0,10,30,0.7)'; ctx.shadowBlur=20*S; ctx.shadowOffsetY=12*S;
    ctx.fillStyle='#FFFFFF';
    ctx.beginPath(); ctx.roundRect(acX,acY,acW,acH,acR); ctx.fill();
    ctx.shadowColor='transparent';

    var bodyG=ctx.createLinearGradient(0,acY,0,acY+acH);
    bodyG.addColorStop(0.5,'rgba(255,255,255,0)');
    bodyG.addColorStop(1,'rgba(150,200,255,0.35)');
    ctx.fillStyle=bodyG; ctx.fill();

    var vM=acW*0.1, vX=acX+vM, vH=18*S, vY=acY+acH-vH-8*S, vW=acW-vM*2;
    ctx.fillStyle='#0F2B5B';
    ctx.beginPath(); ctx.roundRect(vX,vY,vW,vH,6*S); ctx.fill();
    ctx.strokeStyle='#2858A6'; ctx.lineWidth=Math.max(2,3*S); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(vX+12*S,vY+vH/2); ctx.lineTo(vX+vW-12*S,vY+vH/2); ctx.stroke();

    var sfX=acX+38*S, sfY=acY+28*S, arm=10*S, br=3.5*S;
    ctx.strokeStyle='#3A82DF'; ctx.lineWidth=Math.max(1.5,2*S); ctx.lineCap='round';
    for(var i=0;i<6;i++){
        ctx.save(); ctx.translate(sfX,sfY); ctx.rotate((Math.PI/3)*i);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(arm,0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arm*0.55,0); ctx.lineTo(arm*0.55+br*0.5,-br);
        ctx.moveTo(arm*0.55,0); ctx.lineTo(arm*0.55+br*0.5,br);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arm,0); ctx.lineTo(arm-br*0.3,-br*0.55);
        ctx.moveTo(arm,0); ctx.lineTo(arm-br*0.3,br*0.55);
        ctx.stroke();
        ctx.restore();
    }
    ctx.fillStyle='#5BBBFF'; ctx.beginPath(); ctx.arc(sfX,sfY,1.8*S,0,Math.PI*2); ctx.fill();

    var btnX=acX+acW-52*S, btnY=acY+28*S;
    for(var j=0;j<3;j++){
        var da=0.2+0.8*((Math.sin(this.time*2-j*1.5)+1)/2);
        ctx.fillStyle='rgba(15,60,120,'+da+')';
        ctx.beginPath(); ctx.arc(btnX+j*14*S,btnY,3.5*S,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
};

function easeOut(t){return 1-Math.pow(1-Math.min(Math.max(t,0),1),3);}

HeroCanvas.prototype.animate = function (dt) {
    if(!this.canvas) return;
    /* Skip when off screen AND title already shown (perf) */
    if(!this.heroVisible && this.titleShown) return;

    var ctx=this.ctx, w=this.w, h=this.h;
    ctx.clearRect(0,0,w,h);
    this.time += 0.016;

    var elapsed    = (performance.now() - this.startTime)/1000;
    var bgAlpha    = easeOut(elapsed/0.5);
    var mtnProg    = easeOut((elapsed-0.3)/1.2);
    var fadeProg   = easeOut((elapsed-1.2)/0.6);
    var acProg     = easeOut((elapsed-1.5)/0.8);
    var inReady    = elapsed > 1.0;   /* mountain→AC streams */
    var outReady   = elapsed > 2.2;   /* AC→out streams */

    ctx.save(); ctx.globalAlpha=bgAlpha; this.drawBg(); ctx.restore();

    if(bgAlpha>0.5){
        ctx.save(); ctx.globalAlpha=Math.min((bgAlpha-0.5)*2,1);
        this.drawStars(); ctx.restore();
    }

    this.drawMountain(560,260, 114,1193,'#12438C','#0A2554',65,mtnProg);
    this.drawMountain(280,220,-300, 754,'#1E63C2','#123D78',70,mtnProg);
    this.drawMtnFade(fadeProg);

    /* IN streams: mountain ridges → AC intake */
    if(inReady && this.heroVisible){
        ctx.save(); ctx.translate(this.oX,0);
        ctx.globalCompositeOperation='screen';
        for(var i=0;i<this.streams.length;i++){
            var r=this.streams[i];
            if(r.source!=='out'){ r.update(this.time); r.draw(ctx); }
        }
        ctx.globalCompositeOperation='source-over'; ctx.restore();
    }

    this.drawAC(acProg);

    /* OUT streams: AC vent → room */
    if(outReady && this.heroVisible){
        ctx.save(); ctx.translate(this.oX,0);
        ctx.globalCompositeOperation='screen';
        for(var j=0;j<this.streams.length;j++){
            var r2=this.streams[j];
            if(r2.source==='out'){ r2.update(this.time); r2.draw(ctx); }
        }
        ctx.globalCompositeOperation='source-over'; ctx.restore();
    }

    /* Keep .hero-content centred on the AC body */
    if(acProg>0.05 && this.acCenterY>0){
        var wrap=document.querySelector('.hero-content');
        if(wrap) wrap.style.top=this.acCenterY+'px';
    }

    if(elapsed>2.0 && !this.titleShown){
        this.titleShown=true;
        var el=document.querySelector('.hero-title');
        if(el) el.classList.add('visible');
    }
};

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
    else{lastTime=performance.now(); rafId=requestAnimationFrame(renderLoop);}
});

var resizeTimer;
window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(function(){
        if(heroCanvas) heroCanvas.resize();
    },300);
},{passive:true});

// ============================================================
//  INIT
// ============================================================
heroCanvas=new HeroCanvas();
heroCanvas.resize();
rafId=requestAnimationFrame(renderLoop);
initReveal();

/* Pause streams when hero is scrolled off screen */
(function(){
    if(!heroCanvas||!heroCanvas.canvas) return;
    var obs=new IntersectionObserver(function(entries){
        heroCanvas.heroVisible=entries[0].isIntersecting;
    },{threshold:0.05});
    obs.observe(heroCanvas.section);
})();
