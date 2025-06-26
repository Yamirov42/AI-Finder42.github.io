document.addEventListener('DOMContentLoaded', function() {
    // База данных нейросетей
    const neuralNetworks = [
        {
            name: "ChatGPT",
            description: "Продвинутый чат-бот от OpenAI с поддержкой контекста и генерации текста.",
            category: "chat, text generation",
            price: "$20/месяц (Pro версия)",
            rating: "4.9",
            link: "https://chat.openai.com"
        },
        {
            name: "MidJourney",
            description: "Мощный генератор изображений по текстовому описанию с уникальным стилем.",
            category: "image generation",
            price: "$10-$120/месяц (в зависимости от тарифа)",
            rating: "4.7",
            link: "https://www.midjourney.com"
        },
        {
            name: "DALL-E",
            description: "Генератор изображений от OpenAI с пониманием контекста и семантики.",
            category: "image generation",
            price: "Плата за количество изображений",
            rating: "4.5",
            link: "https://openai.com/dall-e"
        },
        {
            name: "Stable Diffusion",
            description: "Open-source модель для генерации изображений с возможностью локального запуска.",
            category: "image generation",
            price: "Бесплатно (самостоятельный хостинг)",
            rating: "5.0",
            link: "https://stablediffusionweb.com"
        },
        {
            name: "Claude",
            description: "Альтернативный чат-бот от Anthropic с акцентом на безопасность.",
            category: "chat",
            price: "Бесплатно (Pro версия в разработке)",
            rating: "4.0",
            link: "https://claude.ai"
        },
        {
            name: "Runway ML",
            description: "Платформа для генерации и редактирования видео с помощью ИИ.",
            category: "video generation, video editing",
            price: "$15-$95/месяц",
            rating: "4.2",
            link: "https://runwayml.com"
        },
        {
            name: "Synthesia",
            description: "Создание видео с цифровыми аватарами, говорящими ваш текст.",
            category: "video generation",
            price: "$30-$1000+/месяц",
            rating: "4.3",
            link: "https://www.synthesia.io"
        },
        {
            name: "ElevenLabs",
            description: "Передовая технология синтеза речи с эмоциями и интонациями.",
            category: "audio generation, text-to-speech",
            price: "$5-$330/месяц",
            rating: "3.7",
            link: "https://elevenlabs.io"
        },
        {
            name: "GitHub Copilot",
            description: "ИИ-ассистент для программирования от GitHub и OpenAI.",
            category: "code generation",
            price: "$10/месяц",
            rating: "3.5",
            link: "https://github.com/features/copilot"
        },
        {
            name: "Notion AI",
            description: "ИИ-помощник в Notion для написания, суммирования и организации контента.",
            category: "text generation, productivity",
            price: "$10/месяц",
            rating: "3.4",
            link: "https://www.notion.so/product/ai"
        },
        {
            name: "Jasper",
            description: "ИИ для маркетингового контента: статьи, посты, письма.",
            category: "text generation, marketing",
            price: "$49+/месяц",
            rating: "3.9",
            link: "https://www.jasper.ai"
        },
        {
            name: "Bard",
            description: "Чат-бот от Google с интеграцией с сервисами компании.",
            category: "chat",
            price: "Бесплатно",
            rating: "5.0",
            link: "https://bard.google.com"
        },
        {
            name: "DeepL Write",
            description: "ИИ для улучшения и корректуры текстов с сохранением стиля.",
            category: "text editing",
            price: "Бесплатно (Pro версия $8.74/месяц)",
            rating: "3.7",
            link: "https://www.deepl.com/write"
        },
        {
            name: "Leonardo.AI",
            description: "Генератор изображений с упором на качество и детализацию.",
            category: "image generation",
            price: "Бесплатно с ограничениями",
            rating: "4.0",
            link: "https://leonardo.ai"
        },
        {
            name: "Adobe Firefly",
            description: "Набор ИИ-инструментов от Adobe для работы с изображениями.",
            category: "image generation, image editing",
            price: "Включено в подписку Adobe",
            rating: "3.2",
            link: "https://www.adobe.com/sensei/generative-ai/firefly.html"
        },
        {
            name: "Copy.ai",
            description: "Генератор маркетинговых текстов и копирайтинга.",
            category: "text generation, marketing",
            price: "Бесплатно с ограничениями, $49+/месяц",
            rating: "2.8",
            link: "https://www.copy.ai"
        },
        {
            name: "Murf",
            description: "Создание реалистичного голосового контента с ИИ.",
            category: "audio generation",
            price: "$19+/месяц",
            rating: "4.6",
            link: "https://murf.ai"
        },
        {
            name: "Pictory",
            description: "Автоматическое создание видео из текста или статей.",
            category: "video generation",
            price: "$19-$99/месяц",
            rating: "4.0",
            link: "https://pictory.ai"
        },
        {
            name: "Descript",
            description: "Редактирование аудио и видео через редактирование текста.",
            category: "audio editing, video editing",
            price: "$12+/месяц",
            rating: "4.4",
            link: "https://www.descript.com"
        },
        {
            name: "Character.AI",
            description: "Чат с персонажами, знаменитостями и ИИ-персонажами.",
            category: "chat, entertainment",
            price: "Бесплатно",
            rating: "5.0",
            link: "https://beta.character.ai"
        },
        {
            name: "Perplexity AI",
            description: "Поисковая система с ИИ, предоставляющая точные ответы.",
            category: "search, research",
            price: "Бесплатно, Pro $20/месяц",
            rating: "3.6",
            link: "https://www.perplexity.ai"
        },
        {
            name: "Gamma",
            description: "Создание презентаций, документов и веб-страниц с ИИ.",
            category: "productivity",
            price: "Бесплатно с ограничениями",
            rating: "4.8",
            link: "https://gamma.app"
        },
        {
            name: "HeyGen",
            description: "Создание видео с цифровыми аватарами для бизнеса.",
            category: "video generation",
            price: "$24-$360/месяц",
            rating: "3.1",
            link: "https://www.heygen.com"
        },
        {
            name: "Krisp",
            description: "ИИ-шумоподавление для голосовых звонков и записей.",
            category: "audio enhancement",
            price: "$8/месяц",
            rating: "4.2",
            link: "https://krisp.ai"
        },
        {
            name: "Otter.ai",
            description: "Транскрибация голоса в текст с ИИ и заметки в реальном времени.",
            category: "speech-to-text",
            price: "Бесплатно с ограничениями",
            rating: "2.7",
            link: "https://otter.ai"
        }
    ];
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
    }

    function performSearch() {
        const query = searchInput.value.toLowerCase();
        resultsContainer.innerHTML = '';

        if (!query) {
            resultsContainer.innerHTML = '<p class="neon-text">Введите запрос для поиска</p>';
            return;
        }

        const results = neuralNetworks.filter(network => 
            network.name.toLowerCase().includes(query) || 
            network.description.toLowerCase().includes(query) ||
            network.category.toLowerCase().includes(query)
        );

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="neon-text">Ничего не найдено. Попробуйте другой запрос.</p>';
            return;
        }

        results.forEach(network => {
            const card = document.createElement('div');
            card.className = 'neuron-card';
            card.innerHTML = `
                <h3 class="neon-text">${network.name} <span>★${network.rating}</span></h3>
                <p>${network.description}</p>
                <div class="neuron-details">
                    <span>Категория: ${network.category}</span>
                    <span class="neon-text">${network.price}</span>
                </div>
                <a href="${network.link}" target="_blank" class="neon-link">Перейти на сайт →</a>
            `;
            resultsContainer.appendChild(card);
        });
    }

    // Обработчики для форм входа и регистрации
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Функция входа будет реализована позже');
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;
            
            if (password !== confirm) {
                alert('Пароли не совпадают!');
                return;
            }
            
            alert('Регистрация успешна! (имитация)');
        });
    }
});