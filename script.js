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

/* ──────────────────────────────────────────────────────────
   WindRibbon — thin continuous line, no gradient sperm effect

   Rendering principle:
   • NO head-to-tail gradient (that's what made it look like sperm)
   • Uniform thin stroke with constant alpha
   • Long trail → looks like a flowing line, not a blob
   • Paths revert to v13 coordinates — those swept nicely off ridges

   Sources:
   • 'left_ridge'  — air lifts off left mountain, curves into AC
   • 'right_ridge' — mirror of left
   • 'out'         — icy air fans out from AC vent
────────────────────────────────────────────────────────── */
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
    this.speed       = 0.003 + Math.random() * 0.005;         /* slightly faster */
    this.history     = [];
    this.trailLength = Math.floor(6 + Math.random() * 9);     /* short: 6-15 pts — ice crystal, not snake */
    this.pSize       = (0.55 + Math.random() * 1.1) * S;      /* particle base size */

    if (this.source === 'left_ridge') {
        /* ── v13 coordinates — proven to look great ── */
        var lerp = Math.random();
        this.startX = (280 + lerp * 80) * S;
        this.startY = (220 + lerp * 70) * S + oY;
        this.endX   = (260 + Math.random() * 120) * S;
        this.endY   = 440 * S + oY;
        /* cp1 goes RIGHT & slightly UP off the ridge — lift-off feel */
        this.cp1X   = this.startX + 60 * S;
        this.cp1Y   = this.startY - 30 * S;
        this.cp2X   = this.endX - 20 * S;
        this.cp2Y   = this.endY - 100 * S;

    } else if (this.source === 'right_ridge') {
        var lerp2 = Math.random();
        this.startX = (560 - lerp2 * 60) * S;
        this.startY = (260 + lerp2 * 50) * S + oY;
        this.endX   = (420 + Math.random() * 120) * S;
        this.endY   = 440 * S + oY;
        /* cp1 goes LEFT & slightly UP */
        this.cp1X   = this.startX - 60 * S;
        this.cp1Y   = this.startY - 30 * S;
        this.cp2X   = this.endX + 20 * S;
        this.cp2Y   = this.endY - 100 * S;

    } else {
        /* 'out' — cold air fans wide from vent */
        this.startX = (260 + Math.random() * 280) * S;
        this.startY = 560 * S + oY;
        var spread  = (this.startX / S - 400) * 1.2;
        this.endX   = this.startX + spread * S + (Math.random() - 0.5) * 60 * S;
        this.endY   = 850 * S + oY;
        this.cp1X   = this.startX;
        this.cp1Y   = 630 * S + oY;
        this.cp2X   = this.endX - spread * 0.4 * S;
        this.cp2Y   = 730 * S + oY;
    }
};

WindRibbon.prototype.getPoint = function (time) {
    var t=this.t, u=1-t, tt=t*t, uu=u*u;
    var x = uu*u*this.startX + 3*uu*t*this.cp1X + 3*u*tt*this.cp2X + tt*t*this.endX;
    var y = uu*u*this.startY + 3*uu*t*this.cp1Y + 3*u*tt*this.cp2Y + tt*t*this.endY;
    /* horizontal-only wiggle, same amplitude as v13 */
    x += Math.sin(time * 3 + y * 0.015) * 3 * this.S;
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
    if (h.length < 1) return;

    /* Fade in/out at journey edges */
    var alpha = 1;
    if (this.t < 0.10) alpha = this.t / 0.10;
    if (this.t > 0.88) alpha = (1 - this.t) / 0.12;

    var head = h[0];
    var sz   = this.pSize;  /* base particle size */

    ctx.save();

    /* ── Short wispy vapour trail ──
       Only a handful of segments, each fading rapidly toward the tail.
       Looks like a faint breath of air, not a streak or a blob.        */
    if (h.length > 1) {
        var trailMax = Math.min(h.length, this.trailLength);
        for (var i = 0; i < trailMax - 1; i++) {
            var frac = 1 - (i / trailMax);
            var ta   = alpha * frac * frac * 0.22;
            ctx.strokeStyle = 'rgba(210, 242, 255, ' + ta + ')';
            ctx.lineWidth   = Math.max(0.3, sz * frac * 0.85);
            ctx.lineCap     = 'round';
            ctx.beginPath();
            ctx.moveTo(h[i].x,     h[i].y);
            ctx.lineTo(h[i+1].x,   h[i+1].y);
            ctx.stroke();
        }
    }

    /* ── Ice-crystal head ──
       Marketing concept: "воздух прямо с хребтов гор" —
       so each particle looks like a tiny airborne ice crystal:
       bright glowing core + soft ethereal halo + sparkle cross arms.   */
    var r = sz * 2.4;

    /* Soft outer halo — like the glow of ice in sunlight */
    var grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, r * 3.2);
    grd.addColorStop(0,    'rgba(235, 252, 255, ' + (alpha * 0.50) + ')');
    grd.addColorStop(0.40, 'rgba(175, 228, 255, ' + (alpha * 0.16) + ')');
    grd.addColorStop(1,    'rgba(140, 210, 255, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(head.x, head.y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    /* Bright crystalline core */
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.95) + ')';
    ctx.beginPath();
    ctx.arc(head.x, head.y, r * 0.36, 0, Math.PI * 2);
    ctx.fill();

    /* Sparkle cross arms — only on bigger particles, keeps density natural */
    if (sz > 0.75 * this.S) {
        var arm = r * 1.05;
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.52) + ')';
        ctx.lineWidth   = Math.max(0.35, sz * 0.32);
        ctx.lineCap     = 'round';
        ctx.beginPath(); ctx.moveTo(head.x - arm, head.y); ctx.lineTo(head.x + arm, head.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(head.x, head.y - arm); ctx.lineTo(head.x, head.y + arm); ctx.stroke();
        /* 45° secondary arms — half-length, makes it a proper 8-point snowflake speck */
        var arm2 = arm * 0.6;
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.28) + ')';
        ctx.beginPath(); ctx.moveTo(head.x - arm2, head.y - arm2); ctx.lineTo(head.x + arm2, head.y + arm2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(head.x + arm2, head.y - arm2); ctx.lineTo(head.x - arm2, head.y + arm2); ctx.stroke();
    }

    ctx.restore();
};

// ──────────────────────────────────────────────────────────────
//  HeroCanvas
// ──────────────────────────────────────────────────────────────
function HeroCanvas() {
    this.canvas      = document.getElementById('hero-canvas');
    if (!this.canvas) return;
    this.section     = this.canvas.parentElement;
    this.ctx         = this.canvas.getContext('2d');
    this.ribbons     = [];
    this.stars       = [];
    this.w=0; this.h=0; this.S=1; this.oX=0; this.oY=0;
    this.acCenterY   = 0;
    this.time        = 0;
    this.startTime   = performance.now();
    this.titleShown  = false;
    this.heroVisible = true;
}

HeroCanvas.prototype.resize = function () {
    if (!this.canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w  = this.section.offsetWidth;
    this.h  = this.section.offsetHeight;
    this.canvas.width  = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width  = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* ── Scale strategy ─────────────────────────────────────────────
       The 800×800 composition has the AC spanning x=150…650 (500 units).
       For it to fit the screen: S ≤ w / 500.
       We also want mountains tall: S ≤ h * 0.82 / 800.
       Take the min so BOTH constraints are satisfied on any device.

       On desktop landscape: h*0.82/800 ≈ 0.82, w/500 ≈ 2.4+ → height wins ✓
       On iPhone 390×844:    h*0.82/800 = 0.865, w/500 = 0.78 → width wins ✓
         → Apply 0.86 factor on narrow screens so AC has side breathing room.
    ─────────────────────────────────────────────────────────────── */
    var wFit = this.w < 600 ? this.w * 0.86 : this.w;
    this.S  = Math.min(this.h * 0.82 / 800, wFit / 500);
    this.oX = (this.w - 800 * this.S) / 2;
    /* anchor composition bottom to canvas bottom */
    var naturalOY = this.h - 800 * this.S;
    this.oY = Math.max(naturalOY, 0);

    /* Ribbons */
    this.ribbons = [];
    var S = this.S, oY = this.oY;
    for (var i=0; i<18; i++) this.ribbons.push(new WindRibbon('left_ridge',  S, oY));
    for (var j=0; j<18; j++) this.ribbons.push(new WindRibbon('right_ridge', S, oY));
    for (var k=0; k<30; k++) this.ribbons.push(new WindRibbon('out',         S, oY));

    /* Stars — upper region */
    this.stars = [];
    var skyH  = Math.max(this.oY + 180*this.S, this.h * 0.32);
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

HeroCanvas.prototype.drawMountain = function (peakX,peakY,leftX,rightX,colorL,colorD,snowDepth,progress) {
    var ctx=this.ctx, S=this.S, oX=this.oX, oY=this.oY;
    var baseY  = this.h + 10;
    var mtnH   = 800 - peakY;
    var px=peakX*S+oX, lx=leftX*S+oX, rx=rightX*S+oX;
    var tPY    = peakY*S + oY;
    var animPY = baseY + (tPY - baseY) * progress;

    ctx.fillStyle=colorL;
    ctx.beginPath(); ctx.moveTo(lx,baseY); ctx.lineTo(px,animPY); ctx.lineTo(px,baseY); ctx.fill();
    ctx.fillStyle=colorD;
    ctx.beginPath(); ctx.moveTo(px,animPY); ctx.lineTo(rx,baseY); ctx.lineTo(px,baseY); ctx.fill();

    if(progress>0.7){
        var sa=(progress-0.7)/0.3;
        ctx.save(); ctx.globalAlpha=sa;
        var ratio=snowDepth/mtnH;
        var snowLX=peakX+ratio*(leftX-peakX);
        var snowRX=peakX+ratio*(rightX-peakX);
        var snowBotScr=(peakY+snowDepth)*S+oY;
        var animSnow=baseY+(snowBotScr-baseY)*progress;
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
    var fadeTop=400*this.S+this.oY;
    var g=ctx.createLinearGradient(0,fadeTop,0,h);
    g.addColorStop(0,'rgba(5,20,45,0)');
    g.addColorStop(1,'rgba(5,20,45,'+progress+')');
    ctx.fillStyle=g; ctx.fillRect(0,fadeTop,w,h-fadeTop);
};

HeroCanvas.prototype.drawAC = function (progress) {
    if(progress<=0) return;
    var ctx=this.ctx, S=this.S, oX=this.oX, oY=this.oY;
    var acX=150*S+oX, acW=500*S, acH=140*S, acR=25*S;
    var acTargetY=430*S+oY;
    var acY=acTargetY+(1-progress)*50*S;

    this.acCenterY=acY+acH/2;

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
    if(!this.heroVisible && this.titleShown) return;

    var ctx=this.ctx, w=this.w, h=this.h;
    ctx.clearRect(0,0,w,h);
    this.time+=0.016;

    var elapsed    = (performance.now()-this.startTime)/1000;
    var bgAlpha    = easeOut(elapsed/0.5);
    var mtnProg    = easeOut((elapsed-0.3)/1.2);
    var fadeProg   = easeOut((elapsed-1.2)/0.6);
    var acProg     = easeOut((elapsed-1.5)/0.8);
    var ridgeReady = elapsed > 1.0;
    var outReady   = elapsed > 2.2;

    ctx.save(); ctx.globalAlpha=bgAlpha; this.drawBg(); ctx.restore();

    if(bgAlpha>0.5){
        ctx.save(); ctx.globalAlpha=Math.min((bgAlpha-0.5)*2,1);
        this.drawStars(); ctx.restore();
    }

    this.drawMountain(560,260, 114,1193,'#12438C','#0A2554',65,mtnProg);
    this.drawMountain(280,220,-300, 754,'#1E63C2','#123D78',70,mtnProg);
    this.drawMtnFade(fadeProg);

    if(ridgeReady && this.heroVisible){
        ctx.save(); ctx.translate(this.oX,0);
        ctx.globalCompositeOperation='screen';
        for(var i=0;i<this.ribbons.length;i++){
            var r=this.ribbons[i];
            if(r.source!=='out'){ r.update(this.time); r.draw(ctx); }
        }
        ctx.globalCompositeOperation='source-over'; ctx.restore();
    }

    this.drawAC(acProg);

    if(outReady && this.heroVisible){
        ctx.save(); ctx.translate(this.oX,0);
        ctx.globalCompositeOperation='screen';
        for(var j=0;j<this.ribbons.length;j++){
            var r2=this.ribbons[j];
            if(r2.source==='out'){ r2.update(this.time); r2.draw(ctx); }
        }
        ctx.globalCompositeOperation='source-over'; ctx.restore();
    }

    /* Keep title centred on AC body */
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
