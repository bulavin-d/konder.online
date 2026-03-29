/* =============================================
   KONDER.ONLINE — auth.js v1
   Supabase Auth + Bonus System
   Anon key безопасен на клиенте при наличии RLS
   ============================================= */

var SUPABASE_URL     = 'https://stbpdxckbautwiagzjfo.supabase.co';
var SUPABASE_ANON_KEY= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnBkeGNrYmF1dHdpYWd6amZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODg5OTksImV4cCI6MjA5MDM2NDk5OX0.DEObn0CLhiXvFYz2Kc2w6n6tj3GtzTFSlFn1yxKFT1Q';

var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─────────────────────────────────────────────
   MODAL MANAGEMENT
───────────────────────────────────────────── */
var _activeModal = null;

function openModal(id) {
    var overlay = document.getElementById('modal-overlay');
    var boxes   = overlay.querySelectorAll('.modal-box');
    boxes.forEach(function(b) { b.style.display = 'none'; });
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
    document.body.style.overflow = '';
    _activeModal = null;
}

function switchTo(id) {
    var boxes = document.querySelectorAll('.modal-box');
    boxes.forEach(function(b) { b.style.display = 'none'; });
    var target = document.getElementById(id);
    if (target) { target.style.display = 'block'; _activeModal = id; }
}

function showAlert(msg, onOk) {
    document.getElementById('alert-text').textContent = msg;
    document.getElementById('alert-ok-btn').onclick = function() {
        closeModal();
        if (typeof onOk === 'function') onOk();
    };
    openModal('modal-alert');
}

/* ─────────────────────────────────────────────
   HEADER PROFILE ICON
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   DATABASE — load profile
───────────────────────────────────────────── */
function loadProfile(userId, callback) {
    sb.from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(function(res) {
          callback(res.error ? null : res.data);
      });
}

/* ─────────────────────────────────────────────
   AUTH ACTIONS
───────────────────────────────────────────── */
function doSignUp() {
    var name  = document.getElementById('reg-name').value.trim();
    var email = document.getElementById('reg-email').value.trim();
    var pass  = document.getElementById('reg-pass').value;
    var phone = document.getElementById('reg-phone').value.trim();

    if (!name || !email || !pass) { showAlert('Заполните обязательные поля (имя, email, пароль).'); return; }
    if (pass.length < 6)          { showAlert('Пароль должен быть не менее 6 символов.'); return; }

    var btn = document.getElementById('reg-submit-btn');
    btn.disabled = true; btn.textContent = 'Отправляем…';

    sb.auth.signUp({
        email: email,
        password: pass,
        options: { data: { full_name: name, phone: phone } }
    }).then(function(res) {
        btn.disabled = false; btn.textContent = 'Зарегистрироваться';
        if (res.error) {
            var msg = res.error.message;
            if (msg.indexOf('already registered') !== -1 || msg.indexOf('already been registered') !== -1) {
                msg = 'Этот email уже зарегистрирован. Попробуйте войти.';
            }
            showAlert(msg);
        } else {
            showAlert('✉️ Письмо с подтверждением отправлено на:\n' + email + '\n\nЕсли письмо не пришло — проверьте папку «Спам».');
        }
    });
}

function doSignIn() {
    var email = document.getElementById('login-email').value.trim();
    var pass  = document.getElementById('login-pass').value;
    if (!email || !pass) { showAlert('Введите email и пароль.'); return; }

    var btn = document.getElementById('login-submit-btn');
    btn.disabled = true; btn.textContent = 'Входим…';

    sb.auth.signInWithPassword({ email: email, password: pass }).then(function(res) {
        btn.disabled = false; btn.textContent = 'Войти';
        if (res.error) {
            showAlert('Неверный email или пароль.\nПроверьте данные и попробуйте снова.');
        } else {
            closeModal();
        }
    });
}

function doResetPassword() {
    var email = document.getElementById('forgot-email').value.trim();
    if (!email) { showAlert('Введите ваш email.'); return; }

    var btn = document.getElementById('forgot-submit-btn');
    btn.disabled = true; btn.textContent = 'Отправляем…';

    sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
    }).then(function(res) {
        btn.disabled = false; btn.textContent = 'Отправить ссылку';
        if (res.error) {
            showAlert('Ошибка: ' + res.error.message);
        } else {
            showAlert('✉️ Ссылка для сброса пароля отправлена на:\n' + email);
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
            showAlert(r.error ? 'Ошибка: ' + r.error.message
                : '✉️ Ссылка для сброса пароля отправлена на вашу почту.');
        });
    });
}

function doUpdatePassword() {
    var newPass    = document.getElementById('new-pass-input').value;
    var confirmPass = document.getElementById('new-pass-confirm').value;

    if (!newPass || newPass.length < 6) { showAlert('Пароль должен быть не менее 6 символов.'); return; }
    if (newPass !== confirmPass)        { showAlert('Пароли не совпадают. Попробуйте ещё раз.'); return; }

    var btn = document.getElementById('new-pass-submit-btn');
    btn.disabled = true; btn.textContent = 'Сохраняем…';

    sb.auth.updateUser({ password: newPass }).then(function(res) {
        btn.disabled = false; btn.textContent = 'Сохранить';
        if (res.error) {
            showAlert('Ошибка: ' + res.error.message);
        } else {
            /* Чистим хэш из URL, чтобы не триггерить recovery повторно */
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname);
            }
            showAlert('✅ Пароль успешно обновлён! Теперь вы можете войти.', function() {
                openModal('modal-login');
            });
        }
    });
}

/* ─────────────────────────────────────────────
   PROFILE MODAL — render
───────────────────────────────────────────── */
function renderProfileModal(profile) {
    document.getElementById('profile-name').textContent    = profile.full_name || 'Клиент';
    document.getElementById('profile-balance').textContent = (profile.bonus_balance || 0).toLocaleString('ru-RU');
    document.getElementById('profile-phone').textContent   = profile.phone || 'не указан';
    openModal('modal-profile');
}

/* ─────────────────────────────────────────────
   LEAD MAGNET POPUP
───────────────────────────────────────────── */
function tryShowBonusPopup() {
    /* Уже закрывал — не показываем */
    if (localStorage.getItem('konder_bonus_closed')) return;

    /* Проверяем сессию и настройку промо */
    sb.auth.getSession().then(function(res) {
        if (res.data && res.data.session) return; /* залогинен — не нужно */
        sb.from('settings').select('value').eq('key', 'promo_enabled').single().then(function(cfg) {
            if (cfg.data && cfg.data.value === 'true') {
                openModal('modal-bonus');
                startBonusCanvas();
            }
        });
    });
}

/* ─────────────────────────────────────────────
   BONUS CANVAS ANIMATION
───────────────────────────────────────────── */
function startBonusCanvas() {
    var canvas = document.getElementById('bonus-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = canvas.offsetWidth  || 390;
        canvas.height = canvas.offsetHeight || 320;
    }
    resize();

    var particles = [];
    for (var i = 0; i < 32; i++) {
        particles.push(makeParticle(canvas.width, canvas.height, true));
    }

    function makeParticle(w, h, initial) {
        var isCoin = Math.random() > 0.48;
        return {
            x:          Math.random() * w,
            y:          initial ? Math.random() * h : h + 20,
            size:       isCoin ? (2.5 + Math.random() * 3.5) : (1.8 + Math.random() * 3),
            speed:      0.55 + Math.random() * 1.15,
            opacity:    0.25 + Math.random() * 0.65,
            wobble:     Math.random() * Math.PI * 2,
            wobbleSpd:  0.018 + Math.random() * 0.028,
            isCoin:     isCoin,
            rotation:   Math.random() * Math.PI * 2,
            rotSpd:     (Math.random() - 0.5) * 0.06
        };
    }

    var animId;
    function draw() {
        if (!canvas.isConnected) { cancelAnimationFrame(animId); return; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(function(p) {
            p.y        -= p.speed;
            p.wobble   += p.wobbleSpd;
            p.x        += Math.sin(p.wobble) * 0.7;
            p.rotation += p.rotSpd;
            if (p.y < -24) {
                var np  = makeParticle(canvas.width, canvas.height, false);
                p.x     = np.x; p.y = np.y; p.size = np.size;
                p.speed = np.speed; p.opacity = np.opacity;
                p.isCoin = np.isCoin; p.rotation = np.rotation;
                p.wobble = np.wobble;
            }

            ctx.save();
            ctx.globalAlpha = p.opacity;

            if (p.isCoin) {
                /* Монета ₸ */
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                /* Glow */
                var grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3.2);
                grd.addColorStop(0,   'rgba(255,215,0,0.45)');
                grd.addColorStop(0.5, 'rgba(255,185,0,0.12)');
                grd.addColorStop(1,   'rgba(255,160,0,0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(0, 0, p.size * 3.2, 0, Math.PI * 2); ctx.fill();
                /* Coin face */
                ctx.fillStyle = '#FFD700';
                ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.28)';
                ctx.beginPath(); ctx.arc(-p.size * 0.28, -p.size * 0.28, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
                /* ₸ symbol */
                if (p.size > 3.2) {
                    ctx.fillStyle = '#7a5800';
                    ctx.font = 'bold ' + Math.round(p.size * 1.05) + 'px Inter,sans-serif';
                    ctx.textAlign    = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('₸', 0, 0.5);
                }
            } else {
                /* Ice crystal */
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.strokeStyle = 'rgba(185,232,255,' + p.opacity + ')';
                ctx.lineWidth   = Math.max(0.4, p.size * 0.28);
                ctx.lineCap     = 'round';
                var arm = p.size * 1.9;
                for (var a = 0; a < 6; a++) {
                    ctx.save();
                    ctx.rotate((Math.PI / 3) * a);
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(arm, 0); ctx.stroke();
                    /* side barbs */
                    if (p.size > 2.5) {
                        var b = arm * 0.55;
                        ctx.beginPath(); ctx.moveTo(b, 0); ctx.lineTo(b + arm * 0.22, -arm * 0.22); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(b, 0); ctx.lineTo(b + arm * 0.22,  arm * 0.22); ctx.stroke();
                    }
                    ctx.restore();
                }
                /* center dot */
                ctx.fillStyle = 'rgba(220,245,255,0.9)';
                ctx.beginPath(); ctx.arc(0, 0, p.size * 0.28, 0, Math.PI * 2); ctx.fill();
            }

            ctx.restore();
        });

        animId = requestAnimationFrame(draw);
    }
    draw();
}

/* ─────────────────────────────────────────────
   INIT — DOMContentLoaded
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {

    /* ── Profile icon click ── */
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

    /* ── Close on overlay background click ── */
    var overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });
    }

    /* ── ESC closes ── */
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });

    /* ── Close buttons (×) ── */
    document.querySelectorAll('.modal-close-btn').forEach(function(btn) {
        btn.addEventListener('click', closeModal);
    });

    /* ── Switch links (data-switch) ── */
    document.querySelectorAll('[data-switch]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            switchTo(el.getAttribute('data-switch'));
        });
    });

    /* ── Register ── */
    var regBtn = document.getElementById('reg-submit-btn');
    if (regBtn) regBtn.addEventListener('click', doSignUp);
    document.getElementById('reg-pass') && document.getElementById('reg-pass').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doSignUp();
    });

    /* ── Login ── */
    var loginBtn = document.getElementById('login-submit-btn');
    if (loginBtn) loginBtn.addEventListener('click', doSignIn);
    document.getElementById('login-pass') && document.getElementById('login-pass').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doSignIn();
    });

    /* ── Forgot ── */
    var forgotBtn = document.getElementById('forgot-submit-btn');
    if (forgotBtn) forgotBtn.addEventListener('click', doResetPassword);

    /* ── Sign out ── */
    var signoutBtn = document.getElementById('profile-signout-btn');
    if (signoutBtn) signoutBtn.addEventListener('click', doSignOut);

    /* ── Reset password from profile ── */
    var resetBtn = document.getElementById('profile-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', doProfileReset);

    /* ── Tooltip ── */
    var tooltipBtn    = document.getElementById('bonus-tooltip-btn');
    var tooltipBubble = document.getElementById('bonus-tooltip-bubble');
    if (tooltipBtn && tooltipBubble) {
        tooltipBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            tooltipBubble.classList.toggle('visible');
        });
        document.addEventListener('click', function() {
            tooltipBubble && tooltipBubble.classList.remove('visible');
        });
    }

    /* ── Bonus popup buttons ── */
    var bonusGetBtn = document.getElementById('bonus-get-btn');
    if (bonusGetBtn) {
        bonusGetBtn.addEventListener('click', function() {
            closeModal();
            openModal('modal-register');
        });
    }
    /* Крестик бонус-попапа — помимо закрытия запоминаем, что юзер уже видел */
    var bonusCloseBtn = document.getElementById('bonus-close-btn');
    if (bonusCloseBtn) {
        bonusCloseBtn.addEventListener('click', function() {
            localStorage.setItem('konder_bonus_closed', '1');
            /* closeModal() вызовется через общий обработчик .modal-close-btn */
        });
    }

    /* ── Auth state change ── */
    sb.auth.onAuthStateChange(function(event, session) {
        if (event === 'PASSWORD_RECOVERY') {
            /* Пользователь перешёл по ссылке из письма — показываем модалку смены пароля */
            openModal('modal-reset-password');
            return;
        }
        if (session && session.user) {
            loadProfile(session.user.id, function(profile) {
                setProfileUI(true, profile);
                /* Refresh profile modal if it's open */
                if (_activeModal === 'modal-profile' && profile) {
                    document.getElementById('profile-balance').textContent =
                        (profile.bonus_balance || 0).toLocaleString('ru-RU');
                }
            });
        } else {
            setProfileUI(false, null);
        }
    });

    /* ── New password submit ── */
    var newPassBtn = document.getElementById('new-pass-submit-btn');
    if (newPassBtn) newPassBtn.addEventListener('click', doUpdatePassword);
    var newPassInput = document.getElementById('new-pass-input');
    if (newPassInput) newPassInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doUpdatePassword();
    });
    var newPassConfirm = document.getElementById('new-pass-confirm');
    if (newPassConfirm) newPassConfirm.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doUpdatePassword();
    });

    /* ── Hash recovery fallback: #type=recovery ── */
    /* На случай если Supabase передаёт токен через hash вместо события PASSWORD_RECOVERY */
    (function checkHashRecovery() {
        var hash = window.location.hash;
        if (!hash) return;
        var params = {};
        hash.replace(/^#/, '').split('&').forEach(function(pair) {
            var kv = pair.split('=');
            params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        if (params['type'] === 'recovery' && params['access_token']) {
            /* Устанавливаем сессию вручную и открываем модалку смены пароля */
            sb.auth.setSession({
                access_token:  params['access_token'],
                refresh_token: params['refresh_token'] || ''
            }).then(function() {
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
                openModal('modal-reset-password');
            });
        }
    })();

    /* ── Lead Magnet: show after 7 seconds ── */
    setTimeout(tryShowBonusPopup, 7000);
});
