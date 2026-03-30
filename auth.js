/* =============================================
   KONDER.ONLINE - auth.js
   Supabase Auth + Promo Popups
   ============================================= */

var SUPABASE_URL      = 'https://stbpdxckbautwiagzjfo.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnBkeGNrYmF1dHdpYWd6amZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODg5OTksImV4cCI6MjA5MDM2NDk5OX0.DEObn0CLhiXvFYz2Kc2w6n6tj3GtzTFSlFn1yxKFT1Q';

var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Modal state */
var _activeModal = null;

function resetPromoContactState() {
    document.querySelectorAll('.promo-pill.open').forEach(function(pill) {
        pill.classList.remove('open');
    });
    document.querySelectorAll('.promo-contact-btn.hidden').forEach(function(btn) {
        btn.classList.remove('hidden');
    });
}


function openModal(id) {
    var overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    var boxes = overlay.querySelectorAll('.modal-box');
    boxes.forEach(function(b) { b.style.display = 'none'; });
    resetPromoContactState();

    var target = document.getElementById(id);
    if (!target) return;

    target.style.display = 'block';
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    _activeModal = id;
}

function closeModal() {
    var overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
    resetPromoContactState();
    document.body.style.overflow = '';
    _activeModal = null;
}

function switchTo(id) {
    document.querySelectorAll('.modal-box').forEach(function(b) { b.style.display = 'none'; });
    var target = document.getElementById(id);
    if (target) {
        target.style.display = 'block';
        _activeModal = id;
    }
}

function showAlert(msg, onOk) {
    var textEl = document.getElementById('alert-text');
    var okBtn = document.getElementById('alert-ok-btn');
    if (!textEl || !okBtn) return;

    textEl.textContent = msg;
    okBtn.onclick = function() {
        closeModal();
        if (typeof onOk === 'function') onOk();
    };
    openModal('modal-alert');
}

function setProfileUI(loggedIn, profile) {
    var btn = document.getElementById('profile-icon-btn');
    if (!btn) return;

    if (loggedIn && profile) {
        var initials = (profile.full_name || 'К').trim().charAt(0).toUpperCase();
        btn.innerHTML = '<span style="font-size:0.95rem;font-weight:800;letter-spacing:0">' + initials + '</span>';
        btn.classList.add('logged-in');
        btn.title = profile.full_name || 'Кабинет';
    } else {
        btn.innerHTML = '<svg width="20" height="20"><use href="#i-user"/></svg>';
        btn.classList.remove('logged-in');
        btn.title = 'Войти / Регистрация';
    }
}

function loadProfile(userId, callback) {
    sb.from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(function(res) {
          callback(res.error ? null : res.data);
      });
}

function doSignUp() {
    var name = document.getElementById('reg-name').value.trim();
    var email = document.getElementById('reg-email').value.trim();
    var pass = document.getElementById('reg-pass').value;
    var rawPhone = document.getElementById('reg-phone').value.trim();
    var phone = rawPhone ? '+' + rawPhone.replace(/\D/g, '').replace(/^8/, '7') : '';

    if (!name || !email || !pass) {
        showAlert('Заполните обязательные поля (имя, email, пароль).');
        return;
    }
    if (pass.length < 6) {
        showAlert('Пароль должен быть не менее 6 символов.');
        return;
    }

    var btn = document.getElementById('reg-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    sb.auth.signUp({
        email: email,
        password: pass,
        options: { data: { full_name: name, phone: phone } }
    }).then(function(res) {
        btn.disabled = false;
        btn.textContent = 'Зарегистрироваться';

        if (res.error) {
            var msg = res.error.message;
            if (msg.indexOf('already registered') !== -1 || msg.indexOf('already been registered') !== -1) {
                msg = 'Этот email уже зарегистрирован. Попробуйте войти.';
            }
            showAlert(msg);
            return;
        }

        showAlert('Письмо с подтверждением отправлено на:\n' + email + '\n\nЕсли письма нет, проверьте папку Спам.');
    });
}

function doSignIn() {
    var email = document.getElementById('login-email').value.trim();
    var pass = document.getElementById('login-pass').value;

    if (!email || !pass) {
        showAlert('Введите email и пароль.');
        return;
    }

    var btn = document.getElementById('login-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Входим...';

    sb.auth.signInWithPassword({ email: email, password: pass }).then(function(res) {
        btn.disabled = false;
        btn.textContent = 'Войти';

        if (res.error) {
            showAlert('Неверный email или пароль. Проверьте данные и попробуйте снова.');
        } else {
            closeModal();
        }
    });
}

function doResetPassword() {
    var email = document.getElementById('forgot-email').value.trim();
    if (!email) {
        showAlert('Введите ваш email.');
        return;
    }

    var btn = document.getElementById('forgot-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
    }).then(function(res) {
        btn.disabled = false;
        btn.textContent = 'Отправить ссылку';

        if (res.error) {
            showAlert('Ошибка: ' + res.error.message);
        } else {
            showAlert('Ссылка для сброса пароля отправлена на:\n' + email);
        }
    });
}

function doSignOut() {
    sb.auth.signOut().then(function() {
        closeModal();
        setProfileUI(false, null);
    });
}

function doProfileReset() {
    sb.auth.getSession().then(function(res) {
        var session = res.data && res.data.session;
        if (!session) return;

        sb.auth.resetPasswordForEmail(session.user.email, {
            redirectTo: window.location.origin + window.location.pathname
        }).then(function(r) {
            showAlert(r.error
                ? 'Ошибка: ' + r.error.message
                : 'Ссылка для сброса пароля отправлена на вашу почту.');
        });
    });
}

function doUpdatePassword() {
    var newPass = document.getElementById('new-pass-input').value;
    var confirmPass = document.getElementById('new-pass-confirm').value;

    if (!newPass || newPass.length < 6) {
        showAlert('Пароль должен быть не менее 6 символов.');
        return;
    }
    if (newPass !== confirmPass) {
        showAlert('Пароли не совпадают. Попробуйте еще раз.');
        return;
    }

    var btn = document.getElementById('new-pass-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Сохраняем...';

    sb.auth.updateUser({ password: newPass }).then(function(res) {
        btn.disabled = false;
        btn.textContent = 'Сохранить';

        if (res.error) {
            showAlert('Ошибка: ' + res.error.message);
            return;
        }

        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
        }

        showAlert('Пароль успешно обновлен. Теперь можно войти.', function() {
            openModal('modal-login');
        });
    });
}

function renderProfileModal(profile) {
    document.getElementById('profile-name').textContent = profile.full_name || 'Клиент';
    document.getElementById('profile-balance').textContent = (profile.bonus_balance || 0).toLocaleString('ru-RU');
    document.getElementById('profile-phone').textContent = profile.phone || 'не указан';
    openModal('modal-profile');
}

/* Promo popup settings */
var PROMO_POPUP_TYPES = ['bonus', 'weather', 'service'];

function normalizePopupType(value) {
    var v = String(value || '').toLowerCase();
    return PROMO_POPUP_TYPES.indexOf(v) !== -1 ? v : 'bonus';
}

function getPromoCloseKey(type) {
    return 'konder_promo_closed_' + normalizePopupType(type);
}

function markPromoClosed(type) {
    var popupType = normalizePopupType(type);
    localStorage.setItem(getPromoCloseKey(popupType), '1');
    if (popupType === 'bonus') localStorage.setItem('konder_bonus_closed', '1');
}

function isPromoClosed(type) {
    var popupType = normalizePopupType(type);
    if (localStorage.getItem(getPromoCloseKey(popupType))) return true;
    if (popupType === 'bonus' && localStorage.getItem('konder_bonus_closed')) return true;
    return false;
}

function openPromoPopup(type) {
    var popupType = normalizePopupType(type);

    if (popupType === 'weather') {
        openModal('modal-weather');
        startWeatherCanvas('sunny');
        loadAlmatyWeather();
        return;
    }
    if (popupType === 'service') {
        openModal('modal-service');
        return;
    }

    openModal('modal-bonus');
    startBonusCanvas();
}

function tryShowBonusPopup() {
    sb.auth.getSession().then(function(res) {
        if (res.data && res.data.session) return;

        sb.rpc('get_promo_settings').then(function(cfg) {
            if (cfg.error || !cfg.data) {
                /* Fallback на старую схему, если RPC еще не установлен */
                sb.from('settings').select('key,value').in('key', ['promo_enabled', 'promo_popup_type']).then(function(legacy) {
                    if (legacy.error || !legacy.data) return;

                    var enabledLegacy = false;
                    var typeLegacy = 'bonus';
                    legacy.data.forEach(function(item) {
                        if (item.key === 'promo_enabled') enabledLegacy = item.value === 'true';
                        if (item.key === 'promo_popup_type') typeLegacy = normalizePopupType(item.value);
                    });

                    if (!enabledLegacy) return;
                    if (isPromoClosed(typeLegacy)) return;
                    openPromoPopup(typeLegacy);
                });
                return;
            }

            var row = Array.isArray(cfg.data) ? cfg.data[0] : cfg.data;
            if (!row) return;

            var enabled = !!row.promo_enabled;
            var popupType = normalizePopupType(row.promo_popup_type);

            if (!enabled) return;
            if (isPromoClosed(popupType)) return;
            openPromoPopup(popupType);
        });
    });
}

/* Weather helpers */
function getWeatherKind(code) {
    var c = Number(code);
    if (c === 0 || c === 1) return 'sunny';
    if (c === 95 || c === 96 || c === 99) return 'storm';
    if ([71, 73, 75, 77, 85, 86].indexOf(c) !== -1) return 'snow';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].indexOf(c) !== -1) return 'rain';
    return 'cloudy';
}

function getWeatherText(code) {
    var c = Number(code);
    if (c === 0) return 'Ясно';
    if (c === 1) return 'Преимущественно ясно';
    if (c === 2) return 'Переменная облачность';
    if (c === 3) return 'Пасмурно';
    if (c === 45 || c === 48) return 'Туман';
    if ([51, 53, 55, 56, 57].indexOf(c) !== -1) return 'Морось';
    if ([61, 63, 65, 66, 67, 80, 81, 82].indexOf(c) !== -1) return 'Дождь';
    if ([71, 73, 75, 77, 85, 86].indexOf(c) !== -1) return 'Снег';
    if (c === 95 || c === 96 || c === 99) return 'Гроза';
    return 'Погода в Алматы';
}

function getWeatherSlogan(tempC) {
    var t = Math.round(tempC);
    if (t >= 34) return 'На улице сильная жара. Проверьте кондиционер, чтобы дома было комфортно.';
    if (t >= 28) return 'Жаркий день в Алматы — кондиционер должен работать без сбоев.';
    if (t >= 25) return 'На улице жара. Ваш кондиционер готов к нагрузке?';
    if (t >= 19) return 'Проверьте кондиционер сейчас, чтобы летом не ждать сервис.';
    return 'Сделайте профилактику заранее — в жару техника должна работать уверенно.';
}

function loadAlmatyWeather() {
    var tempEl = document.getElementById('weather-temp');
    var descEl = document.getElementById('weather-desc');
    var windEl = document.getElementById('weather-wind');
    var sloganEl = document.getElementById('weather-slogan');
    var weatherBox = document.getElementById('modal-weather');

    if (!tempEl || !descEl || !windEl || !sloganEl || !weatherBox) return;

    var url = 'https://api.open-meteo.com/v1/forecast?latitude=43.25&longitude=76.95&current=temperature_2m,wind_speed_10m,weather_code&timezone=Asia%2FAlmaty';

    fetch(url, { cache: 'no-store' })
        .then(function(r) {
            if (!r.ok) throw new Error('weather HTTP ' + r.status);
            return r.json();
        })
        .then(function(data) {
            var current = data && data.current ? data.current : null;
            if (!current) throw new Error('empty weather payload');

            var temp = Number(current.temperature_2m);
            var wind = Number(current.wind_speed_10m);
            var code = Number(current.weather_code);
            if (!isFinite(temp)) throw new Error('bad temperature');

            var kind = getWeatherKind(code);
            weatherBox.setAttribute('data-weather', kind);
            startWeatherCanvas(kind);

            tempEl.textContent = String(Math.round(temp));
            descEl.textContent = getWeatherText(code);
            windEl.textContent = 'Ветер: ' + (isFinite(wind) ? wind.toFixed(1) : '--') + ' км/ч';
            sloganEl.textContent = getWeatherSlogan(temp);
        })
        .catch(function() {
            weatherBox.setAttribute('data-weather', 'cloudy');
            startWeatherCanvas('cloudy');
            tempEl.textContent = '--';
            descEl.textContent = 'Не удалось обновить погоду';
            windEl.textContent = 'Показываем fallback-режим';
            sloganEl.textContent = 'Сделаем стабильную прохладу дома при любой погоде.';
        });
}

function startWeatherCanvas(kind) {
    var canvas = document.getElementById('weather-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var mode = kind || 'sunny';

    if (canvas._weatherAnimId) {
        cancelAnimationFrame(canvas._weatherAnimId);
        canvas._weatherAnimId = null;
    }

    function resize() {
        var w = canvas.offsetWidth || 380;
        var h = canvas.offsetHeight || 300;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    }
    resize();

    function createParticle(w, h, m) {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            size: m === 'rain' ? (1 + Math.random() * 1.2) : (1.4 + Math.random() * 2.8),
            speed: m === 'rain' ? (4.2 + Math.random() * 3.6) : (0.35 + Math.random() * 1.15),
            drift: (Math.random() - 0.5) * (m === 'rain' ? 0.6 : 0.3),
            opacity: 0.2 + Math.random() * 0.6
        };
    }

    var particles = [];
    var count = mode === 'rain' ? 42 : (mode === 'snow' ? 32 : 26);
    for (var i = 0; i < count; i++) particles.push(createParticle(canvas.width, canvas.height, mode));

    function drawBackdrop(m) {
        var g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (m === 'sunny') {
            g.addColorStop(0, 'rgba(255, 214, 136, 0.22)');
            g.addColorStop(1, 'rgba(89, 168, 255, 0.10)');
        } else if (m === 'rain') {
            g.addColorStop(0, 'rgba(116, 152, 184, 0.22)');
            g.addColorStop(1, 'rgba(28, 54, 82, 0.16)');
        } else if (m === 'snow') {
            g.addColorStop(0, 'rgba(210, 235, 255, 0.2)');
            g.addColorStop(1, 'rgba(95, 142, 182, 0.12)');
        } else if (m === 'storm') {
            g.addColorStop(0, 'rgba(121, 131, 164, 0.22)');
            g.addColorStop(1, 'rgba(42, 49, 80, 0.15)');
        } else {
            g.addColorStop(0, 'rgba(187, 213, 235, 0.18)');
            g.addColorStop(1, 'rgba(88, 134, 176, 0.11)');
        }

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (m === 'sunny') {
            var glow = ctx.createRadialGradient(canvas.width * 0.82, canvas.height * 0.2, 0, canvas.width * 0.82, canvas.height * 0.2, canvas.width * 0.3);
            glow.addColorStop(0, 'rgba(255, 230, 164, 0.42)');
            glow.addColorStop(1, 'rgba(255, 230, 164, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (m === 'storm') {
            var pulse = 0.08 + Math.abs(Math.sin(Date.now() / 700)) * 0.08;
            ctx.fillStyle = 'rgba(225, 232, 255, ' + pulse.toFixed(3) + ')';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    function drawParticles(m) {
        particles.forEach(function(p) {
            p.y += p.speed;
            p.x += p.drift;

            if (p.y > canvas.height + 8) {
                p.y = -8;
                p.x = Math.random() * canvas.width;
            }
            if (p.x > canvas.width + 8) p.x = -8;
            if (p.x < -8) p.x = canvas.width + 8;

            ctx.globalAlpha = p.opacity;
            if (m === 'rain') {
                ctx.strokeStyle = 'rgba(186, 225, 255, 0.85)';
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - 2.6, p.y + 11);
                ctx.stroke();
            } else {
                ctx.fillStyle = m === 'sunny' ? 'rgba(255, 238, 182, 0.95)' : 'rgba(226, 243, 255, 0.95)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
    }

    function draw() {
        if (_activeModal !== 'modal-weather') {
            if (canvas._weatherAnimId) cancelAnimationFrame(canvas._weatherAnimId);
            canvas._weatherAnimId = null;
            return;
        }

        resize();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackdrop(mode);
        drawParticles(mode);
        canvas._weatherAnimId = requestAnimationFrame(draw);
    }

    draw();
}

function startBonusCanvas() {
    var canvas = document.getElementById('bonus-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas._bonusAnimId) {
        cancelAnimationFrame(canvas._bonusAnimId);
        canvas._bonusAnimId = null;
    }

    function resize() {
        var w = canvas.offsetWidth || 390;
        var h = canvas.offsetHeight || 320;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    }
    resize();

    function makeParticle(w, h, initial) {
        var isCoin = Math.random() > 0.48;
        return {
            x: Math.random() * w,
            y: initial ? Math.random() * h : h + 20,
            size: isCoin ? (2.5 + Math.random() * 3.5) : (1.8 + Math.random() * 3),
            speed: 0.55 + Math.random() * 1.15,
            opacity: 0.25 + Math.random() * 0.65,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpd: 0.018 + Math.random() * 0.028,
            isCoin: isCoin,
            rotation: Math.random() * Math.PI * 2,
            rotSpd: (Math.random() - 0.5) * 0.06
        };
    }

    var particles = [];
    for (var i = 0; i < 32; i++) particles.push(makeParticle(canvas.width, canvas.height, true));

    function draw() {
        if (_activeModal !== 'modal-bonus') {
            if (canvas._bonusAnimId) cancelAnimationFrame(canvas._bonusAnimId);
            canvas._bonusAnimId = null;
            return;
        }

        resize();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(function(p) {
            p.y -= p.speed;
            p.wobble += p.wobbleSpd;
            p.x += Math.sin(p.wobble) * 0.7;
            p.rotation += p.rotSpd;

            if (p.y < -24) {
                var np = makeParticle(canvas.width, canvas.height, false);
                p.x = np.x;
                p.y = np.y;
                p.size = np.size;
                p.speed = np.speed;
                p.opacity = np.opacity;
                p.isCoin = np.isCoin;
                p.rotation = np.rotation;
                p.wobble = np.wobble;
            }

            ctx.save();
            ctx.globalAlpha = p.opacity;

            if (p.isCoin) {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);

                var grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3.2);
                grd.addColorStop(0, 'rgba(255,215,0,0.45)');
                grd.addColorStop(0.5, 'rgba(255,185,0,0.12)');
                grd.addColorStop(1, 'rgba(255,160,0,0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 3.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(255,255,255,0.28)';
                ctx.beginPath();
                ctx.arc(-p.size * 0.28, -p.size * 0.28, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();

                if (p.size > 3.2) {
                    ctx.fillStyle = '#7a5800';
                    ctx.font = 'bold ' + Math.round(p.size * 1.05) + 'px Inter,sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('₸', 0, 0.5);
                }
            } else {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.strokeStyle = 'rgba(185,232,255,' + p.opacity + ')';
                ctx.lineWidth = Math.max(0.4, p.size * 0.28);
                ctx.lineCap = 'round';
                var arm = p.size * 1.9;

                for (var a = 0; a < 6; a++) {
                    ctx.save();
                    ctx.rotate((Math.PI / 3) * a);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(arm, 0);
                    ctx.stroke();

                    if (p.size > 2.5) {
                        var b = arm * 0.55;
                        ctx.beginPath();
                        ctx.moveTo(b, 0);
                        ctx.lineTo(b + arm * 0.22, -arm * 0.22);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(b, 0);
                        ctx.lineTo(b + arm * 0.22, arm * 0.22);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                ctx.fillStyle = 'rgba(220,245,255,0.9)';
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.28, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });

        canvas._bonusAnimId = requestAnimationFrame(draw);
    }

    draw();
}

document.addEventListener('DOMContentLoaded', function() {
    var iconBtn = document.getElementById('profile-icon-btn');
    if (iconBtn) {
        iconBtn.addEventListener('click', function() {
            sb.auth.getSession().then(function(res) {
                var session = res.data && res.data.session;
                if (session) {
                    loadProfile(session.user.id, function(profile) {
                        if (profile) renderProfileModal(profile);
                    });
                } else {
                    openModal('modal-login');
                }
            });
        });
    }

    var overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });

    document.querySelectorAll('.modal-close-btn').forEach(function(btn) {
        btn.addEventListener('click', closeModal);
    });

    document.querySelectorAll('[data-switch]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            switchTo(el.getAttribute('data-switch'));
        });
    });

    var regPhone = document.getElementById('reg-phone');
    if (regPhone) {
        regPhone.addEventListener('focus', function() {
            if (!this.value) this.value = '+7 ';
        });
        regPhone.addEventListener('input', function() {
            var val = this.value.replace(/\D/g, '');
            if (val.startsWith('8')) val = '7' + val.slice(1);
            if (!val.startsWith('7')) val = '7' + val;
            val = val.slice(0, 11);

            var d = val.slice(1);
            var fmt = '+7';
            if (d.length > 0) fmt += ' ' + d.slice(0, 3);
            if (d.length > 3) fmt += ' ' + d.slice(3, 6);
            if (d.length > 6) fmt += ' ' + d.slice(6, 8);
            if (d.length > 8) fmt += ' ' + d.slice(8, 10);
            this.value = fmt;
        });
        regPhone.addEventListener('keydown', function(e) {
            if ((e.key === 'Backspace' || e.key === 'Delete') && this.value === '+7 ') {
                e.preventDefault();
            }
        });
    }

    var regBtn = document.getElementById('reg-submit-btn');
    if (regBtn) regBtn.addEventListener('click', doSignUp);
    var regPass = document.getElementById('reg-pass');
    if (regPass) regPass.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSignUp(); });

    var loginBtn = document.getElementById('login-submit-btn');
    if (loginBtn) loginBtn.addEventListener('click', doSignIn);
    var loginPass = document.getElementById('login-pass');
    if (loginPass) loginPass.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSignIn(); });

    var forgotBtn = document.getElementById('forgot-submit-btn');
    if (forgotBtn) forgotBtn.addEventListener('click', doResetPassword);

    var signoutBtn = document.getElementById('profile-signout-btn');
    if (signoutBtn) signoutBtn.addEventListener('click', doSignOut);

    var resetBtn = document.getElementById('profile-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', doProfileReset);

    var tooltipBtn = document.getElementById('bonus-tooltip-btn');
    var tooltipBubble = document.getElementById('bonus-tooltip-bubble');
    if (tooltipBtn && tooltipBubble) {
        tooltipBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            tooltipBubble.classList.toggle('visible');
        });
        document.addEventListener('click', function() {
            tooltipBubble.classList.remove('visible');
        });
    }

    document.querySelectorAll('.promo-cta-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            closeModal();
            openModal('modal-register');
        });
    });
    document.querySelectorAll('.promo-contact-btn').forEach(function(btn) {
        var pillId = btn.getAttribute('data-pill');
        var pill = pillId ? document.getElementById(pillId) : null;
        if (!pill) return;

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var isOpen = pill.classList.contains('open');
            resetPromoContactState();
            if (!isOpen) {
                pill.classList.add('open');
                btn.classList.add('hidden');
            }
        });

        pill.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    document.addEventListener('click', function() {
        resetPromoContactState();
    });

    document.querySelectorAll('.promo-close-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var popupType = btn.getAttribute('data-promo-close') || 'bonus';
            markPromoClosed(popupType);
        });
    });

    sb.auth.onAuthStateChange(function(event, session) {
        if (event === 'PASSWORD_RECOVERY') {
            openModal('modal-reset-password');
            return;
        }

        if (session && session.user) {
            loadProfile(session.user.id, function(profile) {
                setProfileUI(true, profile || { full_name: session.user.email || 'Клиент' });
                if (_activeModal === 'modal-profile' && profile) {
                    document.getElementById('profile-balance').textContent =
                        (profile.bonus_balance || 0).toLocaleString('ru-RU');
                }
            });
        } else {
            setProfileUI(false, null);
        }
    });

    var newPassBtn = document.getElementById('new-pass-submit-btn');
    if (newPassBtn) newPassBtn.addEventListener('click', doUpdatePassword);

    var newPassInput = document.getElementById('new-pass-input');
    if (newPassInput) newPassInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doUpdatePassword(); });

    var newPassConfirm = document.getElementById('new-pass-confirm');
    if (newPassConfirm) newPassConfirm.addEventListener('keydown', function(e) { if (e.key === 'Enter') doUpdatePassword(); });

    (function checkHashRecovery() {
        var hash = window.location.hash;
        if (!hash) return;

        var params = {};
        hash.replace(/^#/, '').split('&').forEach(function(pair) {
            var kv = pair.split('=');
            params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });

        if (params.type === 'recovery' && params.access_token) {
            sb.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token || ''
            }).then(function() {
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
                openModal('modal-reset-password');
            });
        }
    })();

    setTimeout(tryShowBonusPopup, 7000);
});

