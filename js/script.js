

document.addEventListener('DOMContentLoaded', function() {
    
    const authLink = document.getElementById('auth-link');
    const personalAccountLink = document.getElementById('personal-account-link');
    const storedUsername = localStorage.getItem('username');

    if (storedUsername && authLink && personalAccountLink) {
        authLink.style.display = 'none'; 
        personalAccountLink.style.display = 'inline-block'; 
        personalAccountLink.textContent = `ЛК (${storedUsername})`; 
    }

    const API_BASE_URL = 'https://ai-finder-api-du57.onrender.com/api/v1'; 

    async function fetchData(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка сервера' }));
                throw new Error(errorData.error || `Ошибка сети: ${response.status}`);
            }
            if (response.status === 204) return null;
            return await response.json();
        } catch (error) {
            console.error('Ошибка запроса к API:', error.message);
            throw error; 
        }
    }
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchForm || searchResults || categoryFilter) { 

        async function loadCategories() {
            try {
                const categories = await fetchData('/categories');
                if (categoryFilter) {
                    categoryFilter.innerHTML = '<option value="">Все категории</option>'; 
                    categories.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat.category_id;
                        option.textContent = cat.category_name;
                        categoryFilter.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Не удалось загрузить категории');
            }
        }

        function displayResults(networks) {
            if (searchResults) {
                searchResults.innerHTML = '';
                if (networks.length === 0) {
                    searchResults.innerHTML = '<p class="neon-text">По вашему запросу ничего не найдено.</p>';
                    return;
                }

                networks.forEach(nn => {
                    const card = document.createElement('div');
                    card.className = 'network-card neon-box'; 
                    card.style.marginBottom = '20px';
                    card.style.padding = '15px';
                    card.innerHTML = `
                        <h3 class="neon-text">${nn.name}</h3>
                        <p><strong>Категория:</strong> ${nn.category_name}</p>
                        <p>${nn.description}</p>
                        <p><strong>Рейтинг:</strong> ${nn.rating} / 5.0</p>
                        <a href="${nn.site_link}" target="_blank" class="neon-link">Перейти на сайт</a>
                    `;
                    searchResults.appendChild(card);
                });
            }
        }

        async function handleSearch(event) {
            if (event) event.preventDefault();
            
            const searchText = searchForm ? searchForm.querySelector('input[name="search"]').value : '';
            const categoryId = categoryFilter ? categoryFilter.value : '';

            let endpoint = '/networks';
            const params = new URLSearchParams();

            if (categoryId) params.append('category_id', categoryId);
            if (searchText) params.append('search', searchText);

            if (params.toString()) endpoint += `?${params.toString()}`;

            try {
                const networks = await fetchData(endpoint);
                displayResults(networks);
            } catch (error) {
                displayResults([]); 
            }
        }
        
        if (searchForm) searchForm.addEventListener('submit', handleSearch);
        if (categoryFilter) categoryFilter.addEventListener('change', handleSearch); 

        loadCategories(); 
        handleSearch(null); 
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;

            try {
                const result = await fetchData('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                // Сохраняем данные в localStorage
                localStorage.setItem('user_id', result.user_id);
                localStorage.setItem('username', result.username);
                
                alert('Вход успешен! Добро пожаловать, ' + result.username);
                
                // Перенаправляем на главную
                window.location.href = 'index.html';

            } catch (error) {
                alert('Ошибка входа: ' + error.message);
            }
        });
    }
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = registerForm.querySelector('#email').value;
            const password = registerForm.querySelector('#password').value;
            const username = registerForm.querySelector('#username').value;
            const confirmPass = registerForm.querySelector('#reg-confirm').value;

            if (password !== confirmPass) {
                alert('Пароли не совпадают!');
                return;
            }

            try {
                const result = await fetchData('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, username })
                });

                alert('Регистрация успешна! Теперь вы можете войти.');
                window.location.href = 'login.html'; 

            } catch (error) {
                alert('Ошибка регистрации: ' + error.message);
            }
        });
    }
});
