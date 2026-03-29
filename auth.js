// ============================================================
// auth.js — Supabase Integration & Profile Management
// ============================================================

// 1. Инициализация Supabase
const SUPABASE_URL = 'https://stbpdxckbautwiagzjfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnBkeGNrYmF1dHdpYWd6amZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODg5OTksImV4cCI6MjA5MDM2NDk5OX0.DEObn0CLhiXvFYz2Kc2w6n6tj3GtzTFSlFn1yxKFT1Q';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;

// ============================================================
// Управление модальными окнами
// ============================================================

function openModal(id) {
    document.querySelectorAll('.modal-box').forEach(el => el.classList.remove('active'));
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById(id).classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.querySelectorAll('.modal-box').forEach(el => el.classList.remove('active'));
    document.getElementById('modal-bonus').classList.remove('active');
}

function showAlert(text) {
    document.getElementById('alert-text').textContent = text;
    openModal('modal-alert');
}

// Закрытие по клику вне модалки
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
});

// Кнопки "Закрыть" и "Назад"
document.querySelectorAll('.modal-close, .js-close-modal').forEach(btn => {
    btn.addEventListener('click', () => closeModal());
});

document.querySelectorAll('.js-open-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(btn.dataset.target);
    });
});

// ============================================================
// Слушатель состояния авторизации
// ============================================================

supabase.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
        currentUser = session.user;
        await loadProfile(currentUser.id);

        // Меняем логику иконки в хедере - теперь она открывает профиль
        const headerIcon = document.getElementById('header-profile-btn');
        if (headerIcon) {
            headerIcon.onclick = (e) => { e.preventDefault(); openModal('modal-profile'); };
            headerIcon.classList.add('logged-in'); // Опционально: стиль активного юзера
        }

        // Если открыто окно логина/регистрации — закрываем
        const activeModal = document.querySelector('.modal-box.active');
        if (activeModal && (activeModal.id === 'modal-login' || activeModal.id === 'modal-register')) {
            closeModal();
            openModal('modal-profile');
        }
    } else {
        currentUser = null;
        currentProfile = null;

        // Иконка в хедере открывает окно входа
        const headerIcon = document.getElementById('header-profile-btn');
        if (headerIcon) {
            headerIcon.onclick = (e) => { e.preventDefault(); openModal('modal-login'); };
            headerIcon.classList.remove('logged-in');
        }
    }
});

// ============================================================
// Профиль и Баланс
// ============================================================

async function loadProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, bonus_balance, phone')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Ошибка загрузки профиля:", error);
        return;
    }

    currentProfile = data;

    // Обновляем текст в кабинете
    const nameEl = document.getElementById('profile-name');
    const balanceEl = document.getElementById('profile-balance');

    if (nameEl) nameEl.textContent = data.full_name || 'Клиент';
    if (balanceEl) balanceEl.textContent = data.bonus_balance || '0';
}

// ============================================================
// Регистрация, Вход, Сброс
// ============================================================

// Регистрация
document.getElementById('form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Обработка...';

    const fullname = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { full_name: fullname, phone: phone }
        }
    });

    btn.disabled = false;
    btn.textContent = 'Зарегистрироваться';

    if (error) {
        showAlert(error.message);
    } else {
        showAlert('Письмо с ссылкой для подтверждения аккаунта отправлено на почту. Проверьте также папку спам.');
    }
});

// Вход
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Вход...';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    btn.disabled = false;
    btn.textContent = 'Войти';

    if (error) {
        if (error.message.includes('Invalid login')) showAlert('Неверный Email или пароль.');
        else if (error.message.includes('Email not confirmed')) showAlert('Пожалуйста, подтвердите вашу почту (проверьте письмо от нас).');
        else showAlert(error.message);
    }
});

// Сброс пароля
document.getElementById('form-forgot')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправка...';

    const email = document.getElementById('forgot-email').value.trim();

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/index.html'
    });

    btn.disabled = false;
    btn.textContent = 'Отправить ссылку';

    if (error) {
        showAlert(error.message);
    } else {
        showAlert('Ссылка для восстановления отправлена на вашу почту.');
    }
});

// Выход
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) showAlert(error.message);
    else {
        closeModal();
        showAlert('Вы успешно вышли из аккаунта.');
    }
});

// ============================================================
// Lead Magnet Popup (2000₸ Бонусов)
// ============================================================

setTimeout(async () => {
    // 1. Проверяем, залогинен ли уже пользователь
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return; // Уже залогинен, скрываем акцию

    // 2. Проверяем, закрывал ли он попап ранее
    if (localStorage.getItem('konder_bonus_closed')) return;

    // 3. Проверяем глобальную настройку в Supabase (включена ли акция)
    const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'promo_enabled')
        .single();

    if (settings && settings.value === 'false') return;

    // 4. Показываем Canvas и Попап
    const popup = document.getElementById('modal-bonus');
    const overlay = document.getElementById('modal-overlay');
    if (popup && overlay) {
        overlay.classList.add('active');
        popup.classList.add('active');
        initBonusCanvas();
    }
}, 7000);

// Закрытие Lead Magnet
document.getElementById('btn-close-bonus')?.addEventListener('click', () => {
    localStorage.setItem('konder_bonus_closed', 'true');
    closeModal();
});

// Переход к регистрации из бонуса
document.getElementById('btn-claim-bonus')?.addEventListener('click', () => {
    localStorage.setItem('konder_bonus_closed', 'true'); // Больше не показываем
    closeModal();
    openModal('modal-register');
});


// Простой Canvas эффект для бонусного попапа (монетки/снежинки)
function initBonusCanvas() {
    const canvas = document.getElementById('bonus-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = canvas.parentElement.offsetWidth;
    let h = canvas.parentElement.offsetHeight;
    canvas.width = w; canvas.height = h;

    const particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 2 + Math.random() * 4,
            speedY: 0.5 + Math.random() * 1.5,
            speedX: (Math.random() - 0.5) * 1,
            op: Math.random()
        });
    }

    function draw() {
        if (!document.getElementById('modal-bonus').classList.contains('active')) return;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
        });

        requestAnimationFrame(draw);
    }
    draw();
}
