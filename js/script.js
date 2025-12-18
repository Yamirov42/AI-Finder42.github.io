document.addEventListener('DOMContentLoaded', function() {
    // Убедитесь, что этот URL ведет на ваш рабочий бэкенд на Render
    const API_BASE_URL = 'https://ai-finder-api-du57.onrender.com/api/v1'; 
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('username');

    // --- ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ---
    const authLink = document.getElementById('auth-link');
    const personalAccountLink = document.getElementById('personal-account-link');
    const welcomeTitle = document.getElementById('welcome-user');
    const logoutBtn = document.getElementById('logout-btn');

    // Настройка навигации в зависимости от входа
    if (userName && authLink && personalAccountLink) {
        authLink.style.display = 'none';
        personalAccountLink.style.display = 'inline-block';
        personalAccountLink.textContent = `ЛК (${userName})`;
    }
    if (welcomeTitle && userName) welcomeTitle.textContent = `Привет, ${userName}!`;

    // Функция для запросов к API
    async function fetchData(endpoint, options = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Ошибка сервера: ${response.status}`);
        }
        return response.status === 204 ? null : await response.json();
    }

    // --- ГЛАВНАЯ СТРАНИЦА: ПОИСК И КАТЕГОРИИ ---
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const categoryFilter = document.getElementById('category-filter');

    if (searchForm) {
        // Загрузка списка категорий в выпадающее меню
        fetchData('/categories').then(categories => {
            categoryFilter.innerHTML = '<option value="">Все категории</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.category_id;
                opt.textContent = cat.category_name;
                categoryFilter.appendChild(opt);
            });
        }).catch(e => console.error('Ошибка категорий:', e));

        // Обработка поиска
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchText = searchForm.querySelector('input[name="search"]').value;
            const catId = categoryFilter.value;
            
            try {
                const data = await fetchData(`/networks?category_id=${catId}&search=${searchText}`);
                renderNetworks(data);
            } catch (err) {
                console.error('Ошибка поиска:', err);
                searchResults.innerHTML = `<p class="neon-text">Ошибка при поиске</p>`;
            }
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
        // Округляем рейтинг для отображения
        const displayRating = nn.average_rating ? parseFloat(nn.average_rating).toFixed(1) : "0.0";
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="neon-text">${nn.name}</h3>
                <span class="rating-badge">⭐ ${displayRating}</span>
            </div>
            <p class="category-tag">${nn.category_name || 'Нейросеть'}</p>
            <p class="price-tag">💰 ${nn.price_info || 'Бесплатно'}</p>
            <p>${nn.description}</p>
            
            <div class="rating-select" data-id="${nn.neuro_id}">
                <span>Оценить:</span>
                <button class="rate-btn" data-val="1">1</button>
                <button class="rate-btn" data-val="2">2</button>
                <button class="rate-btn" data-val="3">3</button>
                <button class="rate-btn" data-val="4">4</button>
                <button class="rate-btn" data-val="5">5</button>
            </div>

            <div class="card-actions">
                <button class="neon-button fav-btn" data-id="${nn.neuro_id}">⭐ В избранное</button>
                <a href="${nn.site_link}" target="_blank" class="neon-link">Сайт</a>
            </div>`;
        searchResults.appendChild(card);
    });

    // Обработка клика по оценке
    document.querySelectorAll('.rate-btn').forEach(btn => {
        btn.onclick = async (e) => {
            if (!userId) return alert('Войдите, чтобы ставить оценки!');
            const neuroId = e.target.parentElement.dataset.id;
            const ratingValue = e.target.dataset.val;

            try {
                const res = await fetchData(`/networks/${neuroId}/rate`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ user_id: userId, rating: ratingValue })
                });
                alert(`Ваша оценка (${ratingValue}) принята! Новый рейтинг: ${res.newAverage}`);
                location.reload(); // Перезагружаем для обновления цифр
            } catch (err) {
                alert(err.message);
            }
        };
    });
    
    // (Код для кнопок избранного остается прежним)
}

            // Логика кнопок "В избранное"
            document.querySelectorAll('.fav-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    if (!userId) return alert('Пожалуйста, войдите в аккаунт!');
                    try {
                        await fetchData('/favorites/networks', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ user_id: userId, neuro_id: e.target.dataset.id })
                        });
                        e.target.textContent = '❤️ Сохранено';
                        e.target.disabled = true;
                    } catch (err) {
                        alert('Уже в избранном или ошибка сервера');
                        console.error(err);
                    }
                };
            });
        }

        // Сохранение избранной категории
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
                    alert('Категория добавлена в ЛК!');
                } catch (e) { alert(e.message); }
            };
        }
    }

    // --- ЛИЧНЫЙ КАБИНЕТ ---
    const favNetList = document.getElementById('fav-networks-list');
    const favCatList = document.getElementById('fav-categories-list');

    if (favNetList && userId) {
        async function loadUserData() {
            try {
                // Загружаем избранные нейросети
                const nets = await fetchData(`/favorites/networks/${userId}`);
                favNetList.innerHTML = nets.length ? '' : '<p>Список пуст</p>';
                nets.forEach(n => {
                    const div = document.createElement('div');
                    div.className = 'neon-box';
                    div.style.padding = '10px';
                    div.style.marginBottom = '10px';
                    div.innerHTML = `<h4 class="neon-text" style="margin:0">${n.name}</h4><small>${n.category_name}</small>`;
                    favNetList.appendChild(div);
                });

                // Загружаем избранные категории
                const cats = await fetchData(`/favorites/categories/${userId}`);
                favCatList.innerHTML = cats.length ? '' : '<p>Нет сохраненных категорий</p>';
                cats.forEach(c => {
                    const span = document.createElement('div');
                    span.className = 'neon-box';
                    span.style.display = 'inline-block';
                    span.style.margin = '5px';
                    span.innerHTML = `<span class="neon-text"># ${c.category_name}</span>`;
                    favCatList.appendChild(span);
                });
            } catch (e) {
                favNetList.innerHTML = '<p class="neon-text">Ошибка загрузки данных</p>';
                console.error('Ошибка ЛК:', e);
            }
        }
        loadUserData();
    }

    // --- ФОРМА ВХОДА ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            try {
                const res = await fetchData('/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password })
                });
                // Сохраняем данные пользователя
                localStorage.setItem('user_id', res.user_id);
                localStorage.setItem('username', res.username);
                window.location.href = 'index.html';
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        };
    }

    // --- ФОРМА РЕГИСТРАЦИИ ---
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = regForm.querySelector('input[type="email"]').value;
            // Берем значения по порядку, если ID могут не совпадать
            const inputs = regForm.querySelectorAll('input');
            const username = inputs[1].value; 
            const password = inputs[2].value;

            try {
                await fetchData('/auth/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, username, password })
                });
                alert('Регистрация прошла успешно!');
                window.location.href = 'login.html';
            } catch (err) {
                alert('Ошибка регистрации: ' + err.message);
            }
        };
    }

    // --- ВЫХОД ---
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'index.html';
        };
    }
});
