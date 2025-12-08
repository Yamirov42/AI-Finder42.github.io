document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://api.neurofinder.local/v1';

    // Вспомогательная функция для имитации асинхронного запроса
    async function fetchMock(url, options = {}) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Задержка для имитации сети
        const token = localStorage.getItem('authToken');
        const isLoggedIn = !!token;
        const method = options.method || 'GET';

        // Имитация базы данных (пока для примера)
        const mockData = {
            'ChatGPT': { name: "ChatGPT", category: "chat", price: "$20/месяц", link: "#", isFavorite: true },
            'MidJourney': { name: "MidJourney", category: "image generation", price: "$10/месяц", link: "#", isFavorite: false },
        };

        if (url.startsWith(`${API_BASE_URL}/search`)) {
            // ИМИТАЦИЯ ПОИСКА: всегда возвращает статический список для демонстрации
            return {
                ok: true,
                json: async () => ([
                    { name: "ChatGPT", description: "Чат-бот от OpenAI.", category: "chat", price: "$20/месяц", link: "https://openai.com", rating: "4.8" },
                    { name: "MidJourney", description: "Генерация изображений.", category: "image generation", price: "$10/мес", link: "https://midjourney.com", rating: "4.7" },
                    { name: "Runway ML", description: "Генерация видео.", category: "video generation", price: "$15/мес", link: "https://runwayml.com", rating: "4.5" },
                ])
            };
        }
        
        if (url.startsWith(`${API_BASE_URL}/auth/login`) && method === 'POST') {
            const body = JSON.parse(options.body);
            if (body.email === 'test@mail.ru' && body.password === '123456') {
                return { 
                    ok: true, 
                    status: 200,
                    json: async () => ({ token: 'mock-jwt-token-123', username: 'ТестовыйПользователь' })
                };
            }
            return { ok: false, status: 401, json: async () => ({ error: 'Неверные данные' }) };
        }

        if (url.startsWith(`${API_BASE_URL}/user/profile`) && isLoggedIn) {
            return {
                ok: true,
                json: async () => ({
                    username: 'ТестовыйПользователь',
                    favorites: [
                        { name: "ChatGPT", description: "Чат-бот.", category: "chat", price: "$20/мес", link: "#", rating: "4.8" },
                        { name: "Runway ML", description: "Генерация видео.", category: "video generation", price: "$15/мес", link: "#", rating: "4.5" },
                    ],
                    favoriteCategories: [
                        { name: "Chat", description: "Все для общения" },
                        { name: "Image generation", description: "Все для картинок" }
                    ],
                    searchHistory: [
                        { query: "image generation", date: "2023-11-20" },
                        { query: "free chat", date: "2023-11-19" }
                    ]
                })
            };
        }
        
        if (url.startsWith(`${API_BASE_URL}/favorites/add`) && method === 'POST' && isLoggedIn) {
             // ИМИТАЦИЯ ДОБАВЛЕНИЯ (СЦЕНАРИЙ "Добавление в Избранное")
            return { ok: true, status: 201 };
        }


        // Дефолтный ответ для неавторизованных/ненайденных путей
        return { ok: false, status: 404, json: async () => ({ error: 'Not Found or Unauthorized' }) };
    }

    // ФУНКЦИИ РЕНДЕРИНГА
    function createNeuroCard(network) {
        const card = document.createElement('div');
        card.className = 'neuron-card';
        card.innerHTML = `
            <h3 class="neon-text">${network.name} <span>★${network.rating || 'N/A'}</span></h3>
            <p>${network.description}</p>
            <div class="neuron-details">
                <span>Категория: ${network.category}</span>
                <span class="neon-text">${network.price}</span>
                <a href="${network.link}" target="_blank" class="neon-link link-card">Перейти на сайт</a>
                <button class="neon-button favorite-btn" data-id="${network.name}">
                    ${network.isFavorite ? 'В избранном' : 'В избранное'}
                </button>
            </div>
        `;

        const favoriteButton = card.querySelector('.favorite-btn');
        if (favoriteButton) {
            favoriteButton.onclick = async () => {
                if (!localStorage.getItem('authToken')) {
                    alert('Для добавления в избранное необходимо войти!');
                    return;
                }
                const response = await fetchMock(`${API_BASE_URL}/favorites/add`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: JSON.stringify({ neuro_id: favoriteButton.dataset.id })
                });

                if (response.ok) {
                    alert(`${favoriteButton.dataset.id} добавлен в избранное!`);
                    favoriteButton.textContent = 'В избранном';
                    favoriteButton.disabled = true;
                } else {
                    alert('Ошибка добавления. Попробуйте позже.');
                }
            };
        }

        return card;
    }

    function renderAuthStatus() {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const authLink = document.getElementById('auth-link');
        const paLink = document.getElementById('personal-account-link');
        
        if (authLink && paLink) {
            if (token) {
                authLink.style.display = 'none';
                paLink.style.display = 'inline-block';
            } else {
                authLink.style.display = 'inline-block';
                paLink.style.display = 'none';
                authLink.textContent = 'Вход / Регистрация';
                authLink.href = 'login.html';
            }
        }
    }

    // ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ (index.html)

    function setupIndexPage() {
        const searchButton = document.getElementById('search-button');
        const searchInput = document.getElementById('search-input');
        const resultsContainer = document.getElementById('results');

        if (searchButton && searchInput && resultsContainer) {
            searchButton.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
            renderAuthStatus(); 
        }

        async function performSearch() {
            const query = searchInput.value;
            resultsContainer.innerHTML = '<p class="neon-text">Идет поиск...</p>';

            try {
                const response = await fetchMock(`${API_BASE_URL}/search?q=${query}`);
                
                if (!response.ok) {
                    throw new Error('Ошибка API');
                }
                
                const results = await response.json();

                resultsContainer.innerHTML = '';
                if (results.length === 0) {
                    resultsContainer.innerHTML = '<p class="neon-text">Ничего не найдено.</p>';
                    return;
                }

                results.forEach(network => {
                    resultsContainer.appendChild(createNeuroCard(network));
                });

            } catch (error) {
                resultsContainer.innerHTML = '<p class="neon-text">Произошла ошибка при поиске.</p>';
                console.error("Search Error:", error);
            }
        }
    }

    // ЛОГИКА АВТОРИЗАЦИИ (login.html)

    function setupLoginPage() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const response = await fetchMock(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    body: JSON.stringify({ email: email, password: password }),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('username', data.username);
                    alert(`Добро пожаловать, ${data.username}!`);
                    window.location.href = 'index.html'; // Редирект на главную
                } else {
                    alert('Ошибка входа: ' + (await response.json()).error);
                }
            });
        }
    }

    // V. ЛОГИКА ЛИЧНОГО КАБИНЕТА (personal_account.html)

    function setupPersonalAccountPage() {
        const paContainer = document.querySelector('.account-container');
        if (!paContainer) return;
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Необходима авторизация!');
            window.location.href = 'login.html';
            return;
        }
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }

        const username = localStorage.getItem('username');
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage && username) {
            welcomeMessage.textContent = `Добро пожаловать, ${username}!`;
        }
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));

                this.classList.add('active');
                document.getElementById(this.dataset.tab).classList.remove('hidden');
            });
        });

        fetchAccountData();
    }

    async function fetchAccountData() {
        const favoritesList = document.getElementById('favorites-list');
        const categoriesList = document.getElementById('categories-list');
        const historyList = document.getElementById('history-list');

        [favoritesList, categoriesList, historyList].forEach(el => {
            if (el) el.innerHTML = '<p class="neon-text">Загрузка данных...</p>';
        });
        
        try {
            const response = await fetchMock(`${API_BASE_URL}/user/profile`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке данных ЛК');
            }

            const data = await response.json();

            if (favoritesList) {
                favoritesList.innerHTML = '';
                if (data.favorites && data.favorites.length) {
                    data.favorites.forEach(network => {
                        favoritesList.appendChild(createNeuroCard(network));
                    });
                } else {
                    favoritesList.innerHTML = '<p>Список избранного пуст.</p>';
                }
            }
            if (categoriesList) {
                categoriesList.innerHTML = '';
                if (data.favoriteCategories && data.favoriteCategories.length) {
                    data.favoriteCategories.forEach(category => {
                        const item = document.createElement('div');
                        item.className = 'category-item neon-box';
                        item.innerHTML = `
                            <h4 class="neon-text">${category.name}</h4>
                            <p>${category.description}</p>
                        `;
                        categoriesList.appendChild(item);
                    });
                } else {
                    categoriesList.innerHTML = '<p>Список любимых категорий пуст.</p>';
                }
            }

            if (historyList) {
                historyList.innerHTML = '';
                if (data.searchHistory && data.searchHistory.length) {
                    data.searchHistory.forEach(item => {
                        const histItem = document.createElement('div');
                        histItem.className = 'history-item';
                        histItem.innerHTML = `<p>Запрос: <strong>${item.query}</strong> (Дата: ${item.date})</p>`;
                        historyList.appendChild(histItem);
                    });
                } else {
                    historyList.innerHTML = '<p>История поиска пуста.</p>';
                }
            }
            
        } catch (error) {
            [favoritesList, categoriesList, historyList].forEach(el => {
                 if (el) el.innerHTML = '<p class="neon-text">Не удалось загрузить данные ЛК.</p>';
            });
            console.error("Account Data Error:", error);
        }
    }

    // ГЛОБАЛЬНАЯ ЛОГИКА
    
    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        alert('Вы вышли из системы.');
        window.location.href = 'index.html';
    }

    const path = window.location.pathname;
    if (path.includes('personal_account.html')) {
        setupPersonalAccountPage();
    } else if (path.includes('login.html') || path.includes('register.html')) {
        setupLoginPage(); 
    } else {
        setupIndexPage();
    }
});
