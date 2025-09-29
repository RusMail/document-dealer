# Document Dealer - Система генерации юридических документов

Веб-приложение для автоматизированной генерации юридических документов с интеграцией в n8n для обработки шаблонов.

## 🚀 Возможности

- **Авторизация пользователей**: Система ролей (Admin/User) с управлением через веб-интерфейс
- **Управление контрагентами**: Добавление и хранение информации о контрагентах
- **Генерация документов**: Создание документов типа "Отгрузка" и "Аренда"
- **Интеграция с n8n**: Отправка данных по webhook для обработки шаблонов
- **Скачивание готовых документов**: Получение обработанных документов
- **Dashboard интерфейс**: Современный и удобный пользовательский интерфейс
- **Управление пользователями**: Администратор может добавлять/редактировать/удалять пользователей

## 🛠 Технологии

- **Backend**: Node.js, Express.js, Prisma ORM
- **База данных**: SQLite
- **Frontend**: Vanilla JavaScript, Bootstrap 5
- **Аутентификация**: JWT токены
- **Интеграция**: Webhook API для n8n

## 📋 Требования

- Node.js 18+
- npm или yarn

## 🔧 Установка и запуск

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd document-dealer
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка окружения

#### Вариант 1: Docker Compose (рекомендуется)
```bash
# Создайте файл с переменными окружения
cp .env.example .env

# Отредактируйте .env файл
nano .env
```

**Важные переменные для Docker:**
- `JWT_SECRET` - секретный ключ для JWT токенов
- `N8N_WEBHOOK_URL` - URL вебхука n8n (http://n8n:5678 для Docker)
- `DATABASE_URL` - URL базы данных
- `CORS_ORIGIN` - ваш домен для CORS

#### Вариант 2: Установка без Docker
```bash
# Скопируйте файл с примером переменных окружения
cp .env.example .env

# Отредактируйте .env файл и укажите ваши настройки
nano .env  # или используйте любой редактор
```

**Важные переменные окружения:**
- `JWT_SECRET` - секретный ключ для JWT токенов (генерируйте случайную строку)
- `N8N_WEBHOOK_URL` - URL вебхука n8n для генерации документов
- `DATABASE_URL` - URL базы данных (SQLite по умолчанию)

**Создание сильного JWT_SECRET:**
```bash
# Linux/Mac
openssl rand -hex 32

# Windows (в PowerShell)
[System.Web.Security.Membership]::GeneratePassword(64,0)
```

### 4. Настройка базы данных
```bash
# Генерация Prisma клиента
npx prisma generate

# Создание базы данных
npx prisma db push

# Заполнение начальными данными (админ и тестовый контрагент)
npm run db:seed
```

### 5. Запуск приложения

#### Вариант 1: Docker Compose
```bash
# Запустите все сервисы
docker-compose up -d

# Или соберите и запустите только Document Dealer
docker-compose up --build document-dealer
```

Приложение будет доступно по адресу: http://localhost:3002
n8n будет доступен по адресу: http://localhost:5678

#### Вариант 2: Без Docker
```bash
# Режим разработки
npm run dev

# Продакшн режим
npm start
```

Приложение будет доступно по адресу: http://localhost:3002

## 👤 Первый вход в систему

После запуска приложения используйте следующие данные для входа администратора:

- **Email**: admin@example.com
- **Пароль**: admin123

## 🔐 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация нового пользователя (только админ)
- `GET /api/auth/me` - Получение текущего пользователя
- `GET /api/auth/users` - Получение списка пользователей (только админ)

### Контрагенты
- `GET /api/contractors` - Получение списка контрагентов
- `POST /api/contractors` - Создание нового контрагента
- `GET /api/contractors/:id` - Получение контрагента по ID
- `PUT /api/contractors/:id` - Обновление контрагента (только админ)
- `DELETE /api/contractors/:id` - Удаление контрагента (только админ)

### Документы
- `GET /api/documents` - Получение списка документов
- `POST /api/documents` - Создание нового документа
- `GET /api/documents/:id` - Получение документа по ID
- `GET /api/documents/meta/types` - Получение типов документов
- `GET /api/documents/:id/download` - Скачивание готового документа
- `POST /api/documents/webhook/:id` - Webhook для получения ответа от n8n

## 🔗 Интеграция с n8n

### Настройка webhook в n8n

1. Откройте n8n: https://n8n.n8nvibeauto.ru
2. Создайте новый workflow
3. Добавьте **Webhook** триггер с HTTP Method: POST и Path: `/webhook-test/docs`
4. Добавьте **Code** ноду для обработки данных и логирования
5. Нажмите **"Execute workflow"** для активации webhook в тестовом режиме

### Формат данных для отправки в n8n

```json
{
  "type_doc": "Отгрузка",
  "dogovor_number": "25.01.2025",
  "date": "25.01.2025",
  "ispolnitel": "ООО \"Сибирские складские технологии\"",
  "director_ispolnitel": "Не указан",
  "zakazchik": "Общество с ограниченной ответственностью \"Тестовый Заказчик\"",
  "director_zakazchik": "Не указан",
  "uradress_zakazchik": "г. Москва, ул. Заказчика, д. 1",
  "mailadress_zakazchik": "г. Москва, ул. Заказчика, д. 1",
  "inn_zakazchik": "123456789012",
  "kpp_zakazchik": "123401001",
  "ogrn_zakazchik": "12345678901234567",
  "rs_zakazchik": "40702810000000000001",
  "bank_zakazchik": "ПАО СБЕРБАНК",
  "ks_zakazchik": "30101810400000000225",
  "bik_zakazchik": "044525225",
  "email_zakazchik": "test@example.com",
  "phone_zakazchik": "+7 (495) 123-45-67",
  "uradress_ispolnitel": "г. Москва, ул. Ленина, д. 1",
  "inn_ispolnitel": "5507096651",
  "kpp_ispolnitel": "550701001",
  "rs_ispolnitel": "40702810000000000002",
  "bank_ispolnitel": "ПАО СБЕРБАНК",
  "bik_ispolnitel": "044525225",
  "ks_ispolnitel": "30101810400000000225",
  "ogrn_ispolnitel": "12345678901234568",
  "okpo_ispolnitel": "12345678",
  "phone_ispolnitel": "+7 (495) 987-65-43",
  "email_ispolnitel": "sst@example.com"
}
```

### Ответ от n8n

```json
{
  "documentUrl": "https://example.com/document.docx",
  "status": "success|error",
  "error": "Описание ошибки (если есть)"
}
```

## 📁 Структура проекта

```
document-dealer/
├── public/                 # Frontend файлы
│   ├── index.html         # Главная страница (dashboard)
│   ├── create-document.html # Создание документов
│   └── manage-contractors.html # Управление контрагентами
├── routes/                 # API роуты
│   ├── auth.js            # Аутентификация
│   ├── contractors.js     # Контрагенты
│   └── documents.js       # Документы
├── middleware/             # Middleware
│   └── auth.js            # Аутентификация
├── prisma/                 # База данных
│   ├── schema.prisma      # Схема БД
│   └── seed.js            # Инициализация БД
├── server.js              # Главный серверный файл
├── package.json           # Зависимости
├── .env                   # Конфигурация
└── README.md              # Документация
```

## 🔒 Безопасность

- Все пароли хэшируются с помощью bcrypt
- Используются JWT токены для аутентификации
- Доступ к административным функциям ограничен

## 🚀 Подготовка к деплою на сервер

### 1. Настройка переменных окружения для продакшена

Перед деплоем обязательно настройте следующие переменные в файле `.env`:

```bash
# Генерируйте сильный секретный ключ
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Настройте правильный URL вебхука n8n
N8N_WEBHOOK_URL=https://your-domain.com/webhook/document-generator

# Для продакшена рекомендуется использовать PostgreSQL
DATABASE_URL="postgresql://username:password@your-db-host:5432/document_dealer"

# Настройте CORS для вашего домена
CORS_ORIGIN=https://your-domain.com

# Включите продакшн режим
NODE_ENV=production
```

### 2. Создание продакшн сборки

```bash
# Установите зависимости
npm install --production

# Создайте продакшн версию
npm run build

# Или просто используйте npm start для запуска
```

### 3. Деплой на сервер

**Рекомендуемые платформы:**
- **Railway** - простой деплой Node.js приложений
- **Render** - бесплатный хостинг для веб-приложений
- **DigitalOcean** - VPS с полной свободой настройки
- **Vercel** - для статических сайтов (но нужна доработка backend)

### 4. Настройка базы данных

Для продакшена рекомендуется использовать PostgreSQL:

```bash
# Установите PostgreSQL на сервере
sudo apt install postgresql postgresql-contrib

# Создайте базу данных и пользователя
sudo -u postgres psql
CREATE DATABASE document_dealer;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE document_dealer TO your_user;
\q
```

### 5. Настройка n8n

1. Создайте новый workflow в n8n
2. Добавьте Webhook триггер с правильным путем
3. Настройте обработку данных и генерацию документов
4. Активируйте workflow

## 🚨 Важные замечания

1. **Измените JWT_SECRET** в файле .env для продакшена
2. **Настройте правильный URL для n8n** в файле .env
3. **Создайте шаблоны документов** в n8n для обработки
4. **Настройте HTTPS** для продакшена
5. **Используйте сильные пароли** для базы данных
6. **Регулярно создавайте бэкапы** базы данных

## 📝 Разработка

### Добавление новых типов документов
1. Обновите массив `types` в `routes/documents.js`
2. Обновите функцию `getDocumentTypeLabel` в `create-document.html`
3. Создайте соответствующие шаблоны в n8n

### Добавление новых полей
1. Обновите схему Prisma
2. Обновите API роуты
3. Обновите frontend формы
4. Обновите интеграцию с n8n

## 🔐 Переменные окружения

Приложение использует переменные окружения для хранения конфиденциальной информации. Никогда не храните чувствительные данные в коде!

### Обязательные переменные:
- `JWT_SECRET` - секретный ключ для JWT токенов
- `N8N_WEBHOOK_URL` - URL вебхука n8n
- `DATABASE_URL` - URL подключения к базе данных

### Опциональные переменные:
- `PORT` - порт сервера (по умолчанию 3002)
- `NODE_ENV` - режим работы (development/production)
- `CORS_ORIGIN` - разрешенные источники для CORS
- `LOG_LEVEL` - уровень логирования

### Генерация JWT_SECRET:
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(64,0)
```

### Пример .env файла для продакшена:
```bash
PORT=3002
JWT_SECRET=your-super-secret-jwt-key-here
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/document-generator
DATABASE_URL="postgresql://username:password@host:5432/document_dealer"
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

### Пример .env файла для Docker разработки:
```bash
PORT=3002
JWT_SECRET=your-super-secret-jwt-key-here
N8N_WEBHOOK_URL=http://n8n:5678/webhook/document-generator
DATABASE_URL="file:./data/dev.db"
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

## 🐳 Docker

### Docker Compose (рекомендуется)

Проект включает готовый `docker-compose.yml` файл для запуска вместе с n8n:

```bash
# Запуск всех сервисов
docker-compose up -d

# Сборка и запуск только Document Dealer
docker-compose up --build document-dealer

# Остановка всех сервисов
docker-compose down

# Просмотр логов
docker-compose logs -f document-dealer
```

### Структура Docker

- **document-dealer**: Основное приложение (порт 3002)
- **n8n**: N8N сервис (порт 5678) - может быть уже запущен на вашем сервере
- **postgres**: PostgreSQL база данных (порт 5432) - опционально

### Настройка для совместной работы с существующей n8n

1. Убедитесь, что ваша n8n доступна по адресу `http://n8n:5678`
2. Настройте в `.env`:
   ```bash
   N8N_WEBHOOK_URL=http://n8n:5678/webhook/document-generator
   ```

3. Если n8n использует другой порт, измените в docker-compose.yml:
   ```yaml
   N8N_WEBHOOK_URL=http://n8n:YOUR_PORT/webhook/document-generator
   ```

### Health Check

Приложение включает health check endpoint:
- `GET /api/health` - проверка работоспособности

### Логи и отладка

```bash
# Просмотр логов приложения
docker-compose logs -f document-dealer

# Вход в контейнер для отладки
docker-compose exec document-dealer sh
```

## 🤝 Поддержка

При возникновении вопросов или проблем, пожалуйста, создайте issue в репозитории.
