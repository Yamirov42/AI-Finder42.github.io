document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://ai-finder-api-du57.onrender.com/api/v1'; 
    const user_id = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');

    // Навигация
    const authLink = document.getElementById('auth-link');
    const personalAccountLink = document.getElementById('personal-account-link');
    if (username && authLink && personalAccountLink) {
        authLink.style.display = 'none';
        personalAccountLink.style.display = 'inline-block';
        personalAccountLink.textContent = `ЛК (${username})`;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    async function fetchData(endpoint, options = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error('Ошибка API');
        return response.status === 204 ? null : await response.json();
    }

    // --- ГЛАВНАЯ СТРАНИЦА ---
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const categoryFilter = document.getElementById('category-filter');
    const saveCatBtn = document.getElementById('save-category-btn');

    if (searchForm) {
        async function loadCategories() {
            const categories = await fetchData('/categories');
            categoryFilter.innerHTML = '<option value="">Все категории</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.category_id;
                opt.textContent = cat.category_name;
                categoryFilter.appendChild(opt);
            });
        }

        function displayResults(networks) {
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
                    <p>${nn.description}</p>
                    <button class="neon-button fav-net-btn" data-id="${nn.neuro_id}">⭐ В избранное</button>
                    <a href="${nn.site_link}" target="_blank" class="neon-link">Сайт</a>`;
                searchResults.appendChild(card);
            });

            document.querySelectorAll('.fav-net-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (!user_id) return alert('Войдите!');
                    await fetchData('/favorites/networks', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ user_id, neuro_id: e.target.dataset.id })
                    });
                    e.target.textContent = '❤️ Сохранено';
                });
            });
        }

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchText = searchForm.querySelector('input[name="search"]').value;
            const catId = categoryFilter.value;
            if (!searchText && !catId) return;
            const data = await fetchData(`/networks?category_id=${catId}&search=${searchText}`);
            displayResults(data);
        });

        if (saveCatBtn) {
            saveCatBtn.addEventListener('click', async () => {
                if (!user_id || !categoryFilter.value) return alert('Выберите категорию и войдите!');
                await fetchData('/favorites/categories', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ user_id, category_id: categoryFilter.value })
                });
                alert('Категория сохранена!');
            });
        }
        loadCategories();
    }

    // --- ЛИЧНЫЙ КАБИНЕТ ---
    const favNetList = document.getElementById('fav-networks-list');
    const favCatList = document.getElementById('fav-categories-list');

    if (favNetList && user_id) {
        document.getElementById('welcome-user').textContent = `Привет, ${username}!`;
        async function loadUserData() {
            try {
                const nets = await fetchData(`/favorites/networks/${user_id}`);
                favNetList.innerHTML = nets.length ? '' : '<p>Пусто</p>';
                nets.forEach(nn => {
                    const d = document.createElement('div');
                    d.className = 'neon-box'; d.style.padding = '10px'; d.style.marginBottom = '10px';
                    d.innerHTML = `<h4 class="neon-text">${nn.name}</h4><p>${nn.category_name}</p>`;
                    favNetList.appendChild(d);
                });

                const cats = await fetchData(`/favorites/categories/${user_id}`);
                favCatList.innerHTML = cats.length ? '' : '<p>Нет категорий</p>';
                cats.forEach(c => {
                    const s = document.createElement('div');
                    s.className = 'neon-box'; s.style.display = 'inline-block'; s.style.margin = '5px';
                    s.innerHTML = `<span class="neon-text"># ${c.category_name}</span>`;
                    favCatList.appendChild(s);
                });
            } catch (e) { favNetList.innerHTML = '<p class="neon-text">Ошибка загрузки</p>'; }
        }
        loadUserData();
    }
});
