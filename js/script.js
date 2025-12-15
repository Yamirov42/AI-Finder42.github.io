// js/script.js

document.addEventListener('DOMContentLoaded', function() {
  const API_BASE_URL = 'https://ai-finder-api-du57.onrender.com/api/v1';

    // Функция для выполнения запросов к API
    async function fetchData(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // Если статус 4xx или 5xx, выбрасываем ошибку с текстом ответа сервера
                const errorData = await response.json();
                throw new Error(errorData.error || `Ошибка сети: ${response.status}`);
            }
            // Для POST/PUT/DELETE, которые могут возвращать пустой ответ (204)
            if (response.status === 204) return null; 
            return await response.json();
        } catch (error) {
            console.error('Ошибка запроса к API:', error.message);
            // Возвращаем ошибку для обработки в UI
            throw error; 
        }
    }

    // --- Логика для главной страницы/поиска ---
    
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const categoryFilter = document.getElementById('category-filter');
    
    // 1. Загрузка категорий при загрузке страницы
    async function loadCategories() {
        try {
            const categories = await fetchData('/categories');
            if (categoryFilter) {
                // Добавляем опцию "Все категории"
                categoryFilter.innerHTML = '<option value="">Все категории</option>'; 
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.category_id;
                    option.textContent = cat.category_name;
                    categoryFilter.appendChild(option);
                });
            }
        } catch (error) {
            alert('Не удалось загрузить категории: ' + error.message);
        }
    }

    // 2. Отображение результатов поиска
    function displayResults(networks) {
        if (searchResults) {
            searchResults.innerHTML = ''; // Очистка
            
            if (networks.length === 0) {
                searchResults.innerHTML = '<p>По вашему запросу ничего не найдено.</p>';
                return;
            }

            networks.forEach(nn => {
                const card = document.createElement('div');
                card.className = 'network-card';
                card.innerHTML = `
                    <h3>${nn.name}</h3>
                    <p><strong>Категория:</strong> ${nn.category_name}</p>
                    <p>${nn.description.substring(0, 150)}...</p>
                    <p><strong>Рейтинг:</strong> ${nn.rating} / 5.0</p>
                    <a href="${nn.site_link}" target="_blank">Перейти на сайт</a>
                    `;
                searchResults.appendChild(card);
            });
        }
    }

    // 3. Обработка формы поиска и фильтрации
    async function handleSearch(event) {
        event.preventDefault();
        
        const searchText = searchForm.querySelector('input[name="search"]').value;
        const categoryId = categoryFilter.value;

        let endpoint = '/networks';
        const params = new URLSearchParams();

        if (categoryId) {
            params.append('category_id', categoryId);
        } else if (searchText) {
            params.append('search', searchText);
        }

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        try {
            const networks = await fetchData(endpoint);
            displayResults(networks);
        } catch (error) {
            displayResults([]); // Показываем пустой результат при ошибке
            alert('Ошибка при выполнении поиска: ' + error.message);
        }
    }
    
    // --- Инициализация слушателей ---
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    if (categoryFilter) {
         // Перезапускаем поиск при смене категории
        categoryFilter.addEventListener('change', handleSearch); 
    }

    // Загружаем категории и все нейросети при старте
    loadCategories(); 
    // Загружаем все сети при старте (пустой вызов поиска)
    handleSearch({ preventDefault: () => {} }); 
});

// --- Логика для страниц Login/Register (Пример) ---

// *********** ЛОГИН ************
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
            
            // Если успех, сохраняем данные и перенаправляем
            localStorage.setItem('user_id', result.user_id);
            localStorage.setItem('username', result.username);
            alert('Вход успешен! Добро пожаловать, ' + result.username);
            window.location.href = 'personal_account.html'; // Перенаправление

        } catch (error) {
            alert('Ошибка входа: ' + error.message);
        }
    });
}

// *********** РЕГИСТРАЦИЯ ************
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = registerForm.querySelector('#email').value;
        const password = registerForm.querySelector('#password').value;
        const username = registerForm.querySelector('#username').value;

        try {
            const result = await fetchData('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });

            alert('Регистрация успешна! Ваш ID: ' + result.user_id);
            window.location.href = 'login.html'; // Перенаправление на страницу входа

        } catch (error) {
            alert('Ошибка регистрации: ' + error.message);
        }
    });
}
