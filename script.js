/* KONDER.ONLINE — script.js v4
   Видимые линии потока холодного воздуха + pill + аккордеон
*/

// 1. ШАПКА
(function () {
    var h = document.getElementById('header');
    window.addEventListener('scroll', function () {
        h.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
})();

// 2. CANVAS — видимые линии потока холодного воздуха
(function () {
    var c = document.getElementById('heroCanvas');
    if (!c) return;
    var ctx = c.getContext('2d'), W, H;

    function resize() { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; }
    resize();

    // Линии потоков — по 12 штук с каждой стороны
    var streams = [];
    function initStreams() {
        streams = [];
        for (var i = 0; i < 12; i++) {
            // Левая сторона
            streams.push(mkStream('l', i));
            // Правая сторона
            streams.push(mkStream('r', i));
        }
    }
    function mkStream(side, idx) {
        var yBase = H * 0.1 + Math.random() * H * 0.75;
        return {
            side: side,
            y: yBase,
            speed: 0.3 + Math.random() * 0.6,
            width: W * 0.25 + Math.random() * W * 0.15,
            amp: 8 + Math.random() * 18,
            freq: 0.003 + Math.random() * 0.004,
            phase: Math.random() * Math.PI * 2,
            thick: 1 + Math.random() * 2,
            alpha: 0.06 + Math.random() * 0.1
        };
    }
    initStreams();

    // Частицы
    var pts = [];
    function initPts() {
        pts = [];
        var n = Math.min(50, Math.floor(W / 20));
        for (var i = 0; i < n; i++) {
            var p = mkPt(Math.random() < .5 ? 'l' : 'r');
            p.life = Math.random() * p.ml;
            p.x = p.side === 'l' ? Math.random() * W * 0.3 : W - Math.random() * W * 0.3;
            pts.push(p);
        }
    }
    function mkPt(side) {
        return {
            x: side === 'l' ? -5 : W + 5,
            y: H * 0.15 + Math.random() * H * 0.65,
            vx: side === 'l' ? (0.4 + Math.random() * 0.7) : -(0.4 + Math.random() * 0.7),
            vy: (Math.random() - 0.5) * 0.2,
            r: 1.5 + Math.random() * 3,
            a: 0, ma: 0.08 + Math.random() * 0.12,
            life: 0, ml: 160 + Math.random() * 180,
            side: side
        };
    }
    initPts();

    var time = 0;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        time++;

        // Рисуем линии потока воздуха
        for (var i = 0; i < streams.length; i++) {
            var s = streams[i];
            ctx.save();
            ctx.globalAlpha = s.alpha;
            ctx.strokeStyle = 'rgba(100,170,240,1)';
            ctx.lineWidth = s.thick;
            ctx.lineCap = 'round';
            ctx.beginPath();

            var startX = s.side === 'l' ? 0 : W;
            var dir = s.side === 'l' ? 1 : -1;
            var steps = 60;
            var segLen = s.width / steps;

            for (var j = 0; j <= steps; j++) {
                var x = startX + dir * j * segLen;
                var wave = Math.sin(j * s.freq * 100 + s.phase + time * 0.015 * s.speed) * s.amp;
                var wave2 = Math.sin(j * s.freq * 50 + s.phase * 1.5 + time * 0.01) * s.amp * 0.4;
                var y = s.y + wave + wave2;

                // Затухание к концу
                var fadeIn = Math.min(j / 8, 1);
                var fadeOut = Math.min((steps - j) / 8, 1);
                var fade = fadeIn * fadeOut;

                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        }

        // Частицы
        for (var i = 0; i < pts.length; i++) {
            var p = pts[i];
            p.life++;
            p.x += p.vx;
            p.y += p.vy + Math.sin(p.life * 0.025) * 0.12;

            var prog = p.life / p.ml;
            if (prog < 0.15) p.a = (prog / 0.15) * p.ma;
            else if (prog > 0.7) p.a = ((1 - prog) / 0.3) * p.ma;
            else p.a = p.ma;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
            g.addColorStop(0, 'rgba(130,190,250,' + p.a + ')');
            g.addColorStop(1, 'rgba(80,150,230,0)');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
            ctx.restore();

            if (p.life >= p.ml) pts[i] = mkPt(p.side);
        }

        requestAnimationFrame(draw);
    }
    draw();

    var rt;
    window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () { resize(); initStreams(); initPts(); }, 250);
    }, { passive: true });
})();

// 3. PILL
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

// 4. АККОРДЕОН
(function () {
    var btn = document.getElementById('accordionBtn');
    var body = document.getElementById('accordionBody');
    if (!btn || !body) return;
    btn.addEventListener('click', function () {
        var o = body.classList.contains('open');
        body.classList.toggle('open', !o);
        btn.setAttribute('aria-expanded', String(!o));
    });
})();
