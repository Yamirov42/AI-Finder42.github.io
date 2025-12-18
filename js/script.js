document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://ai-finder-api-du57.onrender.com/api/v1'; 
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('username');

    // Настройка элементов навигации
    const authLink = document.getElementById('auth-link');
    const personalAccountLink = document.getElementById('personal-account-link');
    const welcomeTitle = document.getElementById('welcome-user');
    const logoutBtn = document.getElementById('logout-btn');

    if (userName && authLink && personalAccountLink) {
        authLink.style.display = 'none';
        personalAccountLink.style.display = 'inline-block';
        personalAccountLink.textContent = `ЛК (${userName})`;
    }
    if (welcomeTitle && userName) welcomeTitle.textContent = `Привет, ${userName}!`;

    async function fetchData(endpoint, options = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Ошибка: ${response.status}`);
        }
        return response.status === 204 ? null : await response.json();
    }

    // --- ПОИСК И ОТОБРАЖЕНИЕ ---
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
        }).catch(e => console.error('Ошибка категорий:', e));

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchText = searchForm.querySelector('input[name="search"]').value;
            const catId = categoryFilter.value;
            
            try {
                const data = await fetchData(`/networks?category_id=${catId}&search=${searchText}`);
                renderNetworks(data);
            } catch (err) {
                searchResults.innerHTML = `<p class="neon-text">Ошибка поиска</p>`;
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
                
                // Форматируем рейтинг (если 0 или null, пишем 0.0)
                const rating = nn.average_rating ? parseFloat(nn.average_rating).toFixed(1) : "0.0";
                
                card.innerHTML = `
                    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 class="neon-text">${nn.name}</h3>
                        <span class="rating-badge">⭐ ${rating}</span>
                    </div>
                    <p class="category-tag">${nn.category_name || 'Нейросеть'}</p>
                    <p class="price-tag" style="color:#ffde00; margin: 5px 0;">💰 ${nn.price_info || 'Бесплатно'}</p>
                    <p>${nn.description}</p>
                    
                    <div class="rating-section" style="margin: 10px 0;">
                        <span style="font-size:0.8em; opacity:0.8;">Ваша оценка:</span>
                        <div class="stars" data-id="${nn.neuro_id}">
                            ${[1,2,3,4,5].map(v => `<button class="rate-btn" data-val="${v}">${v}</button>`).join('')}
                        </div>
                    </div>

                    <div class="card-actions">
                        <button class="neon-button fav-btn" data-id="${nn.neuro_id}">⭐ В избранное</button>
                        <a href="${nn.site_link}" target="_blank" class="neon-link">Сайт</a>
                    </div>`;
                searchResults.appendChild(card);
            });

            // Логика оценки (Рейтинг)
            document.querySelectorAll('.rate-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    if (!userId) return alert('Войдите в аккаунт, чтобы ставить оценки!');
                    const neuroId = e.target.parentElement.dataset.id;
                    const val = e.target.dataset.val;

                    try {
                        const res = await fetchData(`/networks/${neuroId}/rate`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ user_id: userId, rating: val })
                        });
                        alert(`Оценка сохранена! Текущий рейтинг: ${res.newAverage}`);
                        // Обновляем список, чтобы увидеть новый рейтинг
                        searchForm.dispatchEvent(new Event('submit'));
                    } catch (err) {
                        alert('Ошибка при оценке: ' + err.message);
                    }
                };
            });

            // Логика избранного
            document.querySelectorAll('.fav-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    if (!userId) return alert('Пожалуйста, войдите!');
                    try {
                        await fetchData('/favorites/networks', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ user_id: userId, neuro_id: e.target.dataset.id })
                        });
                        e.target.textContent = '❤️ В избранном';
                        e.target.disabled = true;
                    } catch (err) {
                        alert('Уже в избранном или ошибка сервера');
                    }
                };
            });
        }
    }

    // --- ЛИЧНЫЙ КАБИНЕТ ---
    const favNetList = document.getElementById('fav-networks-list');
    if (favNetList && userId) {
        fetchData(`/favorites/networks/${userId}`).then(nets => {
            favNetList.innerHTML = nets.length ? '' : '<p>Список пуст</p>';
            nets.forEach(n => {
                const div = document.createElement('div');
                div.className = 'neon-box';
                div.style.padding = '10px';
                div.style.marginBottom = '10px';
                div.innerHTML = `<h4 class="neon-text" style="margin:0">${n.name}</h4><small>⭐ ${n.average_rating || '0.0'}</small>`;
                favNetList.appendChild(div);
            });
        }).catch(() => {
            favNetList.innerHTML = '<p class="neon-text">Ошибка загрузки</p>';
        });
    }

    // --- ВХОД ---
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
                localStorage.setItem('user_id', res.user_id);
                localStorage.setItem('username', res.username);
                window.location.href = 'index.html';
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        };
    }

    // --- РЕГИСТРАЦИЯ ---
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const inputs = regForm.querySelectorAll('input');
            const email = regForm.querySelector('input[type="email"]').value;
            const username = inputs[1].value; 
            const password = inputs[2].value;
            try {
                await fetchData('/auth/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, username, password })
                });
                alert('Регистрация успешна!');
                window.location.href = 'login.html';
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'index.html';
        };
    }
});
