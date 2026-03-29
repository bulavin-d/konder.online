// ============================================================
// boss.js — Admin Panel Logic (KONDER.ONLINE)
// ============================================================

const SUPABASE_URL = 'https://stbpdxckbautwiagzjfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnBkeGNrYmF1dHdpYWd6amZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODg5OTksImV4cCI6MjA5MDM2NDk5OX0.DEObn0CLhiXvFYz2Kc2w6n6tj3GtzTFSlFn1yxKFT1Q';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const adminEmails = ['hamzapsih@gmail.com', 'danel_mer@mail.ru'];
let currentUser = null;

// UI Elements
const authSection = document.getElementById('auth-section');
const dashSection = document.getElementById('dashboard');
const errorMsg = document.getElementById('error-msg');
const resultsDiv = document.getElementById('results');
const pageTitle = document.getElementById('page-title');
const promoToggle = document.getElementById('promo-toggle');

// ============================================================
// Авторизация и Роутинг
// ============================================================

supabase.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user && adminEmails.includes(session.user.email)) {
        currentUser = session.user;
        authSection.style.display = 'none';
        dashSection.style.display = 'block';
        pageTitle.textContent = 'BOSS: Управление';
        errorMsg.textContent = '';

        loadPromoState();
    } else {
        currentUser = null;
        authSection.style.display = 'block';
        dashSection.style.display = 'none';
        pageTitle.textContent = 'Авторизация BOSS';

        // Если кто-то левый зашел
        if (session && session.user && !adminEmails.includes(session.user.email)) {
            errorMsg.textContent = 'Доступ запрещен. Эмейл не является админским.';
            supabase.auth.signOut();
        }
    }
});

// Форма входа
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = 'Вход...';

    const email = document.getElementById('a-email').value.trim();
    const pass = document.getElementById('a-pass').value;

    if (!adminEmails.includes(email)) {
        errorMsg.textContent = 'Этот email не является адресом администратора.';
        return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
        errorMsg.textContent = error.message.includes('Invalid') ? 'Неверный email или пароль' : error.message;
    }
});

// Кнопка выхода
document.getElementById('btn-logout').addEventListener('click', () => {
    supabase.auth.signOut();
});

// ============================================================
// Настройка: Promo Toggle
// ============================================================

async function loadPromoState() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'promo_enabled').single();
    if (data) {
        promoToggle.checked = (data.value === 'true');
    }
}

promoToggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    const { error } = await supabase.rpc('toggle_promo', { enabled: enabled });
    if (error) {
        alert('Ошибка сохранения: ' + error.message);
        e.target.checked = !enabled; // revert
    }
});

// ============================================================
// Поиск и Управление Бонусами
// ============================================================

let debounceTimer;
document.getElementById('search-phone').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();
    if (q.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }

    debounceTimer = setTimeout(() => {
        searchUsers(q);
    }, 500);
});

async function searchUsers(phoneQuery) {
    resultsDiv.innerHTML = '<p style="color:#8cafd2;">Ищем...</p>';

    // Вызов RPC функции для безопасного поиска (только админы в SQL)
    const { data, error } = await supabase.rpc('search_profiles_by_phone', { search_phone: phoneQuery });

    if (error) {
        resultsDiv.innerHTML = `<p style="color:#ff5e5e;">Ошибка: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        resultsDiv.innerHTML = '<p style="color:#8cafd2;">Никто не найден по этому номеру.</p>';
        return;
    }

    renderResults(data);
}

function renderResults(users) {
    resultsDiv.innerHTML = '';

    users.forEach(u => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="user-info">
                <div class="user-name">${u.full_name || 'Без Имени'}</div>
                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">
                    📞 ${u.phone || 'Нет номера'} &nbsp;|&nbsp; ✉️ ${u.email}
                </div>
                <div>Баланс: <span class="user-balance" id="bal-${u.id}">${u.bonus_balance}</span>₸</div>
            </div>
            
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                <input type="number" id="amt-${u.id}" placeholder="Сумма" style="width: 100px; padding: 10px;">
            </div>
            
            <div class="actions">
                <button class="btn-green" onclick="updateBonus('${u.id}', true)">+ Начислить</button>
                <button class="btn-red" onclick="updateBonus('${u.id}', false)">- Списать</button>
            </div>
        `;
        resultsDiv.appendChild(card);
    });
}

// Глобальная функция для кнопок
window.updateBonus = async function (userId, isAdding) {
    const input = document.getElementById(`amt-${userId}`);
    let amt = parseInt(input.value);

    if (isNaN(amt) || amt <= 0) {
        alert('Введите корректную сумму больше нуля!');
        return;
    }

    if (!isAdding) amt = -amt; // Отрицательное число для списания

    // RPC вызов (безопасное начисление)
    const { data: newBalance, error } = await supabase.rpc('update_bonus', {
        profile_id: userId,
        amount: amt
    });

    if (error) {
        alert('Ошибка изменения баланса: ' + error.message);
        return;
    }

    // Успех — обновляем интерфейс
    document.getElementById(`bal-${userId}`).textContent = newBalance;
    input.value = '';

    alert(`Баланс успешно изменён! Новый баланс: ${newBalance}₸`);
};
