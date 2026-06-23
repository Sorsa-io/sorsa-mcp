# Sorsa MCP

MCP-сервер для [Sorsa.io API v3](https://api.sorsa.io/v3/swagger.json) — доступа к данным X/Twitter
(профили, твиты, поиск, проверки фолловов/ретвитов, Sorsa-скоры, списки, сообщества).

Сервер регистрирует **40 инструментов** — по одному на каждый эндпоинт API.

## Установка

```bash
npm install
npm run build
```

## Конфигурация

Нужен API-ключ Sorsa. Он передаётся через переменную окружения `SORSA_API_KEY`
и уходит в каждый запрос в заголовке `ApiKey`.

| Переменная        | Обязательна | По умолчанию                 |
| ----------------- | ----------- | ---------------------------- |
| `SORSA_API_KEY`   | да          | —                            |
| `SORSA_BASE_URL`  | нет         | `https://api.sorsa.io/v3`    |

## Подключение к клиенту

### Cursor

`~/.cursor/mcp.json` (глобально) или `.cursor/mcp.json` в проекте.

После публикации в npm — ничего ставить не нужно, `npx` подтянет пакет сам:

```json
{
  "mcpServers": {
    "sorsa": {
      "command": "npx",
      "args": ["-y", "sorsa-mcp"],
      "env": {
        "SORSA_API_KEY": "ВАШ_КЛЮЧ"
      }
    }
  }
}
```

Либо, если запускаешь из локально собранного проекта:

```json
{
  "mcpServers": {
    "sorsa": {
      "command": "node",
      "args": ["D:\\Code\\Cursor Projects\\Sorsa_MCP\\dist\\index.js"],
      "env": {
        "SORSA_API_KEY": "ВАШ_КЛЮЧ"
      }
    }
  }
}
```

### Claude Desktop

`%APPDATA%\Claude\claude_desktop_config.json` — тот же блок `mcpServers`, что выше.
После правки конфига перезапусти приложение.

## Локальная проверка

```bash
# сборка
npm run build

# запуск (общается по stdio — для ручной проверки удобнее через клиент)
SORSA_API_KEY=ВАШ_КЛЮЧ npm start
```

Быстрый способ убедиться, что ключ рабочий, — вызвать инструмент `get_key_usage_info`:
он вернёт остаток запросов и дату истечения ключа.

## Доступные инструменты

**Профили:** `get_user_info`, `get_user_info_batch`, `get_followers`, `get_following`,
`get_verified_followers`, `get_account_about`

**Твиты:** `get_tweet_info`, `get_tweet_info_bulk`, `get_user_tweets`, `get_tweet_comments`,
`get_tweet_quotes`, `get_retweeters`, `get_article`, `get_trends`

**Поиск:** `search_tweets`, `search_users`, `search_mentions`, `get_space_info`

**Сообщества:** `get_community_members`, `get_community_tweets`, `search_community_tweets`

**Проверки:** `check_follow`, `check_comment`, `check_quoted`, `check_retweet`,
`check_community_member`

**Sorsa-метрики:** `get_sorsa_score`, `get_sorsa_score_changes`, `get_followers_stats`,
`get_top_followers`, `get_top_following`, `get_new_followers_7d`, `get_new_following_7d`

**Списки:** `get_list_members`, `get_list_tweets`, `get_list_followers`

**Утилиты:** `username_to_id`, `id_to_username`, `link_to_id`, `get_key_usage_info`

## Структура

- `src/endpoints.ts` — декларативная таблица всех эндпоинтов (метод, путь, параметры).
  Чтобы добавить/поправить инструмент — меняешь только её.
- `src/index.ts` — HTTP-клиент + регистрация инструментов из таблицы.

## Как это устроено

Каждый эндпоинт описан как запись в `ENDPOINTS`. По полю `in` (`path` / `query` / `body`)
обработчик раскладывает аргументы в URL-путь, query-строку или JSON-тело и шлёт запрос
на Sorsa с заголовком `ApiKey`. Ответ возвращается клиенту как JSON-текст.
