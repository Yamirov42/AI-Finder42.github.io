document.addEventListener('DOMContentLoaded', function() {
    
    const API_BASE_URL = 'https://ai-finder-api-du57.onrender.com/api/v1'; 
    const user_id = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');

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
        const url = `${API_BASE_URL}${endpoint}`;
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error('Ошибка сервера');
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const categoryFilter = document.getElementById('category-filter');
    const saveCatBtn = document.getElementById('save-category-btn');

    if (searchForm) {
   
        async function loadCategories() {
            try {
                const categories = await fetchData('/categories');
                categoryFilter.innerHTML = '<option value="">Все категории</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.category_id;
                    option.textContent = cat.category_name;
                    categoryFilter.appendChild(option);
                });
            } catch (e) { console.error('Ошибка категорий'); }
        }

        function displayResults(networks) {
            searchResults.innerHTML = '';
            if (networks.length === 0) {
                searchResults.innerHTML = '<p class="neon-text">Ничего не найдено.</p>';
                return;
            }
            networks.forEach(nn => {
                const card = document.createElement('div');
                card.className = 'network-card neon-box';
                card.style.marginBottom = '20px';
                card.innerHTML = `
                    <h3 class="neon-text">${nn.name}</h3>
                    <p><strong>Категория:</strong> ${nn.category_name}</p>
                    <p>${nn.description}</p>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <button class="neon-button fav-net-btn" data-id="${nn.neuro_id}">⭐ В избранное</button>
                        <a href="${nn.site_link}" target="_blank" class="neon-link">Сайт</a>
                    </div>
                `;
                searchResults.appendChild(card);
            });

            document.querySelectorAll('.fav-net-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (!user_id) return alert('Войдите, чтобы сохранять нейросети!');
                    const neuro_id = e.target.dataset.id;
                    try {
                        await fetchData('/favorites/networks', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ user_id, neuro_id })
                        });
                        e.target.textContent = '❤️ В избранном';
                        e.target.style.borderColor = '#ff0055';
                    } catch (err) { alert('Уже в избранном или ошибка сервера'); }
                });
            });
        }

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchText = searchForm.querySelector('input[name="search"]').value;
            const catId = categoryFilter.value;
            
            if (!searchText && !catId) return;

            let url = `/networks?`;
            if (catId) url += `category_id=${catId}&`;
            if (searchText) url += `search=${searchText}`;

            const data = await fetchData(url);
            displayResults(data);
        });

        if (saveCatBtn) {
            saveCatBtn.addEventListener('click', async () => {
                const category_id = categoryFilter.value;
                if (!user_id) return alert('Войдите в аккаунт!');
                if (!category_id) return alert('Сначала выберите категорию!');
                
                try {
                    await fetchData('/favorites/categories', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ user_id, category_id })
                    });
                    alert('Категория сохранена в ЛК!');
                } catch (e) { alert('Ошибка или уже сохранено'); }
            });
        }

        loadCategories(); 
    }

    const favNetList = document.getElementById('fav-networks-list');
    const favCatList = document.getElementById('fav-categories-list');

    if (favNetList && user_id) {
        document.getElementById('welcome-user').textContent = `Привет, ${username}!`;

        async function loadUserData() {
            try {
                // Загружаем избранные сети
                const favNetworks = await fetchData(`/favorites/networks/${user_id}`);
                favNetList.innerHTML = favNetworks.length ? '' : '<p>У вас пока нет избранных нейросетей.</p>';
                favNetworks.forEach(nn => {
                    const div = document.createElement('div');
                    div.className = 'neon-box';
                    div.style.padding = '10px';
                    div.style.marginBottom = '10px';
                    div.innerHTML = `<h4 class="neon-text">${nn.name}</h4><p>${nn.category_name}</p>`;
                    favNetList.appendChild(div);
                });

            } catch (e) { favNetList.innerHTML = 'Ошибка загрузки'; }
        }
        loadUserData();
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                const result = await fetchData('/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password })
                });
                localStorage.setItem('user_id', result.user_id);
                localStorage.setItem('username', result.username);
                window.location.href = 'index.html';
            } catch (e) { alert('Неверный логин или пароль'); }
        });
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const usernameReg = document.getElementById('username').value;
            const passwordReg = document.getElementById('password').value;
            try {
                await fetchData('/auth/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, username: usernameReg, password: passwordReg })
                });
                alert('Успех! Войдите в аккаунт.');
                window.location.href = 'login.html';
            } catch (e) { alert('Ошибка регистрации'); }
        });
    }
});
