document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://ai-finder-api-du57.onrender.com/api/v1'; 
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('username');

    // Навигация и приветствие
    const authLink = document.getElementById('auth-link');
    const personalAccountLink = document.getElementById('personal-account-link');
    const welcomeTitle = document.getElementById('welcome-user');

    if (userName && authLink && personalAccountLink) {
        authLink.style.display = 'none';
        personalAccountLink.style.display = 'inline-block';
        personalAccountLink.textContent = `ЛК (${userName})`;
    }
    if (welcomeTitle && userName) welcomeTitle.textContent = `Привет, ${userName}!`;

    async function fetchData(endpoint, options = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Ошибка сервера');
        }
        return response.status === 204 ? null : await response.json();
    }

    // --- ГЛАВНАЯ СТРАНИЦА: ПОИСК ---
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const categoryFilter = document.getElementById('category-filter');

    if (searchForm) {
        // Загрузка категорий
        fetchData('/categories').then(categories => {
            categoryFilter.innerHTML = '<option value="">Все категории</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.category_id;
                opt.textContent = cat.category_name;
                categoryFilter.appendChild(opt);
            });
        }).catch(e => console.error('Ошибка загрузки категорий', e));

        // Поиск
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchText = searchForm.querySelector('input[name="search"]').value;
            const catId = categoryFilter.value;
            if (!searchText && !catId) return;

            try {
                const data = await fetchData(`/networks?category_id=${catId}&search=${searchText}`);
                renderNetworks(data);
            } catch (err) { console.error(err); }
        });

        function renderNetworks(networks) {
            searchResults.innerHTML = '';
            if (!networks.length) {
                searchResults.innerHTML = '<p class="neon-text">Ничего не найдено.</p>';
                return;
            }
            networks.forEach(nn => {
                const card = document.createElement('div');
                card.className = 'network-card neon-box';
                card.innerHTML = `
                    <h3 class="neon-text">${nn.name}</h3>
                    <p class="category-tag">${nn.category_name}</p>
                    <p>${nn.description}</p>
                    <div class="card-actions">
                        <button class="neon-button fav-btn" data-id="${nn.neuro_id}">⭐ В избранное</button>
                        <a href="${nn.site_link}" target="_blank" class="neon-link">Сайт</a>
                    </div>`;
                searchResults.appendChild(card);
            });

            // Кнопки избранного
            document.querySelectorAll('.fav-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    if (!userId) return alert('Войдите в аккаунт!');
                    try {
                        await fetchData('/favorites/networks', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ user_id: userId, neuro_id: e.target.dataset.id })
                        });
                        e.target.textContent = '❤️ Сохранено';
                        e.target.disabled = true;
                    } catch (err) { alert('Ошибка при сохранении: ' + err.message); }
                };
            });
        }

        // Кнопка сохранения категории
        const saveCatBtn = document.getElementById('save-category-btn');
        if (saveCatBtn) {
            saveCatBtn.onclick = async () => {
                if (!userId || !categoryFilter.value) return alert('Выберите категорию и войдите!');
                try {
                    await fetchData('/favorites/categories', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ user_id: userId, category_id: categoryFilter.value })
                    });
                    alert('Категория сохранена!');
                } catch (e) { alert(e.message); }
            };
        }
    }

    // --- ЛИЧНЫЙ КАБИНЕТ ---
    const favNetList = document.getElementById('fav-networks-list');
    const favCatList = document.getElementById('fav-categories-list');

    if (favNetList && userId) {
        async function loadAccount() {
            try {
                const nets = await fetchData(`/favorites/networks/${userId}`);
                favNetList.innerHTML = nets.length ? '' : '<p>Нет избранных нейросетей</p>';
                nets.forEach(n => {
                    const d = document.createElement('div');
                    d.className = 'neon-box'; d.style.padding = '10px'; d.style.marginBottom = '10px';
                    d.innerHTML = `<h4 class="neon-text" style="margin:0">${n.name}</h4><small>${n.category_name}</small>`;
                    favNetList.appendChild(d);
                });

                const cats = await fetchData(`/favorites/categories/${userId}`);
                favCatList.innerHTML = cats.length ? '' : '<p>Нет сохраненных категорий</p>';
                cats.forEach(c => {
                    const s = document.createElement('div');
                    s.className = 'neon-box'; s.style.display = 'inline-block'; s.style.margin = '5px';
                    s.innerHTML = `<span class="neon-text"># ${c.category_name}</span>`;
                    favCatList.appendChild(s);
                });
            } catch (e) { 
                favNetList.innerHTML = '<p class="neon-text">Ошибка загрузки данных</p>';
                console.error(e);
            }
        }
        loadAccount();
    }

    // --- ФОРМЫ ВХОДА И РЕГИСТРАЦИИ ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;
            try {
                const res = await fetchData('/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password })
                });
                localStorage.setItem('user_id', res.user_id);
                localStorage.setItem('username', res.username);
                window.location.href = 'index.html';
            } catch (err) { alert('Ошибка: ' + err.message); }
        };
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = regForm.querySelector('#email').value;
            const username = regForm.querySelector('#username').value;
            const password = regForm.querySelector('#password').value;
            try {
                await fetchData('/auth/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, username, password })
                });
                alert('Регистрация успешна!');
                window.location.href = 'login.html';
            } catch (err) { alert('Ошибка регистрации: ' + err.message); }
        };
    }

    // Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'index.html';
        };
    }
});
