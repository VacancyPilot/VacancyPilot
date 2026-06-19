# CareerSignal HH Copilot — продуктово-архитектурный аудит

> Критический аудит концепции браузерного расширения для HH.ru. MVP для одного разработчика.

---

## Executive summary

Концепция сильная и зрелая для MVP одного разработчика: правильный local-first подход, BYOK, user-controlled, отказ от полной автоотправки. Главный стратегический риск не технический, а в **scope creep** — заявлено 5 «MVP», что на деле полноценный roadmap на 6–9 месяцев. Если строить всё подряд, вы утонете до первого работающего релиза.

Ключевая рекомендация: **сожмите MVP-1 до «read-only ассистента на странице вакансии»** (парсинг + локальное сохранение + rule-based score + AI по кнопке + генерация письма + экспорт). Всё, что трогает DOM формы HH, очереди и автодействия — отложить, потому что именно там лежат риски бана и максимальная хрупкость.

Один концептуальный конфликт, который надо решить сразу: вы одновременно хотите «не получить бан» (приоритет №1) и «подстановку текста в форму HH + очередь откликов». Любая запись в чужой DOM и автоматизация действий — это серая зона ToS. Это можно делать безопасно, но только как **assist, а не automation** (см. раздел Risks).

---

## Что в концепции сильное

- **Local-first + BYOK** — снимает 90% privacy- и cost-рисков, не нужен backend, нет хранения чужих API-ключей у вас.
- **Гибридный scoring** (rule-based авто + AI по кнопке) — это правильно и по деньгам, и по UX: мгновенный сигнал бесплатно, дорогой AI — осознанно.
- **Явная модель статусов вакансии** — это ядро ценности (трекер), и оно работает даже без AI.
- **«Работает без AI»** — отличный fallback и хороший дефолт для приватности.
- **Профили кандидата + библиотека удачных писем** — реальная дифференциация от спам-ботов.
- **Приоритет «не бан»** заявлен первым — стратегически верно.
- **Структурированные поля + cleaned text, HTML только в debug** — грамотная дисциплина данных.

---

## Что в концепции опасно или спорно

1. **Пять «MVP» — это не MVP, а полный продукт.** Терминологически и психологически вредно: команда из 1 человека будет считать «готовым» только всё сразу.
2. **Подстановка текста в форму HH (MVP-3) и очередь (MVP-4)** противоречат приоритету №1. HH активно детектит автоматизацию; запись в DOM их форм + последовательная обработка = паттерн бота.
3. **Selector-хрупкость.** Весь продукт стоит на DOM-парсинге HH, который меняется без предупреждения. Нет ни слова про **resilience-стратегию** парсеров (versioned selectors, fallback, graceful degradation).
4. **`hr_replied` / чтение чатов HR (MVP-5)** — самая чувствительная зона приватности и ToS. Чтение переписки и автогенерация ответов HR — это уже не «помощник кандидату», это риск.
5. **n8n webhook без auth-модели.** Webhook URL в расширении = возможная утечка. Нет упоминания secret/HMAC, rate-limit, что именно уходит наружу.
6. **AI data minimization не специфицирована.** «Пользователь управляет» — это намерение, а не механизм. Нужен явный preview «что уходит в AI».
7. **Salary parsing на HH — нетривиален** (вилки, «до вычета», валюты, «з/п не указана»). Заложен как простое поле — будет источником багов в scoring.
8. **«Сильная вакансия Match ≥ 85»** — магическое число без калибровки. На старте rule-based score не откалиброван, порог даст ложные срабатывания и спам в Telegram.
9. **Solid.js ИЛИ React + WXT** — нерешённый выбор стека в спецификации. Для extension-контента надо зафиксировать заранее (рекомендую один — см. ниже).

---

## Исправленная стратегия

**Позиционирование:** не «copilot для откликов», а **«Job Intelligence & Tracker для HH»** — локальный второй мозг кандидата. Автоматизация — поздняя и опциональная фича, а не суть.

**Три фазы вместо пяти MVP:**

- **Phase 1 — Read & Assist (релиз 1, цель 4–6 недель):** parse → save → status → rule-score → AI-по-кнопке → letter → export. Ноль записи в DOM HH, ноль автодействий. Это то, что можно показывать и чем уже пользоваться.
- **Phase 2 — Triage at scale:** бейджи и подсветка в поисковой выдаче, score на карточке, быстрые действия из списка, n8n-события. Всё ещё read-only по отношению к HH.
- **Phase 3 — Guided Apply (опционально, под флагом):** ассист по заполнению письма с явным ручным подтверждением. Без очередей-автоматов, без чтения чатов на старте.

**Принцип:** каждая фаза — самостоятельно ценный, отгружаемый продукт.

---

## MVP scope (что точно НЕ делать в первой версии)

**Делать (Phase 1):**

- Контент-скрипт на странице вакансии HH.
- Извлечение: title, company, salary(raw+parsed), city, format (remote/hybrid/office), experience, description, skills, sourceURL, hhVacancyId.
- Локальное сохранение (Dexie/IndexedDB).
- Статусы (полный набор).
- Rule-based score + reasons.
- AI-анализ по кнопке (BYOK).
- Генерация письма (шаблоны + AI-адаптация).
- Экспорт CSV/JSON.
- n8n webhook на 1–2 события (отклик отправлен, сильная вакансия).

**НЕ делать в v1:**

- ❌ Подстановка текста в форму HH.
- ❌ Очередь откликов и пакетная обработка.
- ❌ Чтение/классификация чатов HR, генерация ответов HR.
- ❌ Полуавтоматический отклик.
- ❌ Поддержка LinkedIn/Indeed/Workday и т.д.
- ❌ Бейджи в выдаче (это Phase 2 — отдельная парсинг-поверхность).
- ❌ Ежедневная сводка/follow-up reminders (нужен scheduler — позже).

---

## Архитектура

Стек (фиксирую): **WXT + Manifest V3 + TypeScript + Solid.js + Dexie**. Solid — потому что лёгкий, маленький bundle, отлично живёт в side panel/popup, нет React-overhead для расширения.

Слои (по аналогии с дисциплиной model/platform/controller):

```
src/
  content/
    hh/
      vacancy-parser.ts      // versioned selectors, чистая функция DOM -> Job
      search-parser.ts       // Phase 2
      selectors.v1.ts        // изолированные селекторы, легко патчить
      dom-extract.ts         // утилиты, никакой записи в чужой DOM в v1
  core/
    model.ts                 // типы Job/Profile/... (single source of truth)
    scoring.ts               // pure rule-based, тестируемо без DOM
    matching.ts              // skills overlap, нормализация
  services/
    db.ts                    // Dexie repositories
    ai/
      provider.ts            // интерфейс LLMProvider
      deepseek.ts openai.ts openrouter.ts
      prompt-templates.ts
    n8n.ts                   // webhook client + HMAC + redaction
    export.ts                // CSV/JSON
  ui/
    sidepanel/  popup/  dashboard/   // Solid компоненты, тонкие
  background/
    service-worker.ts        // оркестрация, без бизнес-логики парсинга
```

Принципы:

- **Парсинг = чистые функции** `HTMLElement -> Job`, тестируемые на DOM-fixtures без браузера.
- **Селекторы изолированы и версионированы** — единственная точка правки при изменении вёрстки HH.
- **AI за интерфейсом `LLMProvider`** — смена провайдера без трогания UI.
- **Service worker не содержит бизнес-логики** — только маршрутизация сообщений.
- **Никакой записи в DOM HH в Phase 1** — это снимает главный риск бана.

---

## Data model

```ts
type JobStatus =
  | 'new' | 'viewed' | 'saved' | 'rejected_by_me' | 'letter_ready'
  | 'applied' | 'hr_replied' | 'interview' | 'test_task'
  | 'rejected_by_company' | 'offer' | 'blacklist';

interface Job {
  id: string;              // uuid
  source: 'hh';
  hhVacancyId: string;
  url: string;
  title: string;
  companyId: string;
  salary: { raw: string; min?: number; max?: number; currency?: string; gross?: boolean };
  city?: string;
  workFormat?: 'remote' | 'hybrid' | 'office' | 'unknown';
  experience?: string;
  descriptionText: string;     // cleaned
  descriptionHtml?: string;    // только debug
  skills: string[];
  status: JobStatus;
  score?: ScoreResult;
  matchedProfileId?: string;
  createdAt: number; updatedAt: number;
}

interface Company { id: string; name: string; hhEmployerId?: string; notes?: string; blacklisted: boolean; }

interface Profile {           // редактируемый менеджер профилей
  id: string; name: string;   // Universal, AI Engineer, n8n Automation...
  skills: string[]; mustHave: string[]; niceToHave: string[];
  preferences: { remoteOnly?: boolean; minSalary?: number; cities?: string[] };
  resumeId?: string;
}

interface Resume { id: string; profileId: string; label: string; hhResumeUrl?: string; summary?: string; }

interface CoverLetter {
  id: string; jobId: string; profileId: string;
  mode: 'tg' | 'hh_standard' | 'confident' | 'very_short' | 'en';
  flags: { noEmoji: boolean; noMarkdown: boolean; noSpecials: boolean; maxLen?: 500 | 1000 };
  text: string; aiGenerated: boolean; usedAsTemplate: boolean; createdAt: number;
}

interface Application {
  id: string; jobId: string; profileId: string; resumeId?: string; coverLetterId?: string;
  appliedAt?: number; statusHistory: { status: JobStatus; at: number }[];
}

interface Event {            // для n8n / аудита
  id: string; type: 'application_sent' | 'hr_replied' | 'strong_match' | 'daily_digest';
  jobId?: string; payload: Record<string, unknown>; sentToN8n: boolean; createdAt: number;
}

interface ScoreResult { value: number; reasonsFit: string[]; risks: string[]; recommendation: 'apply' | 'consider' | 'skip'; }
```

Замечания: `salary` хранит и raw, и распарсенное — не теряйте исходник. `Application` отделён от `Job`, потому что на одну вакансию может быть несколько попыток/профилей. История статусов — массив, не одно поле (нужно для аналитики и follow-up позже).

---

## Scoring model (rule-based)

Прозрачный, объяснимый, 0–100. Веса конфигурируемы per-profile:

| Компонент | Вес | Логика |
|---|---|---|
| Skills overlap (must-have) | 35 | доля must-have профиля, найденных в skills+description |
| Skills overlap (nice-to-have) | 15 | доля nice-to-have |
| Salary fit | 15 | salary.min ≥ profile.minSalary → full; вилка ниже → пропорция; не указана → neutral 50% |
| Work format | 10 | совпадение remote/hybrid/office с preferences |
| Location | 10 | город в списке или remote |
| Experience match | 10 | grade соответствует |
| Freshness/penalties | 5 | штрафы: blacklist-компания, стоп-слова, «массовый найм» |

`recommendation`: ≥70 → apply, 45–69 → consider, <45 → skip.

**Risk flags** (отдельно от score): «зарплата не указана», «компания в blacklist», «слишком общее описание», «нереалистичный стек», «recruiting agency».

Важно: **порог «сильной вакансии» сделайте настраиваемым (default 70, не 85)** и не отправляйте в Telegram, пока score не откалиброван на ~30–50 реальных вакансиях. Иначе словите спам уведомлений.

---

## UX/UI структура

- **Content layer (на странице вакансии):** ненавязчивый badge со score + цвет статуса. Никаких модалок поверх HH. Клик → открывает side panel.
- **Side panel (главный рабочий инструмент):** карточка вакансии, score + reasons + risks, выбор профиля, кнопка «AI-анализ», генератор письма с переключателями режимов/флагов, кнопка статуса, «сохранить письмо в библиотеку».
- **Popup (быстрый доступ):** текущая вакансия в один клик, последние сохранённые, переход в dashboard.
- **Dashboard (отдельная страница расширения):** таблица всех вакансий с фильтрами по статусу/score, kanban по статусам, библиотека писем, менеджер профилей/резюме, экспорт.
- **Settings:** AI provider + ключ (BYOK), n8n webhook + secret, privacy-тумблеры, debug-режим (HTML capture), редактор весов scoring.

Принцип: **в чужой DOM пишем минимум (только badge), всё взаимодействие — в своей поверхности (side panel)**.

---

## AI prompt templates

**1. Анализ вакансии** (structured output, JSON):

```
System: Ты — карьерный аналитик. Анализируй вакансию объективно. Верни ТОЛЬКО JSON.
User:
Профиль кандидата: {{profile.summary}}, must-have: {{mustHave}}, nice: {{niceToHave}}.
Вакансия:
title: {{title}}
company: {{company}}
salary: {{salary.raw}}
description: {{descriptionText}}   // cleaned, без HTML
skills: {{skills}}

Верни JSON:
{
  "match": 0-100,
  "recommendation": "apply|consider|skip",
  "fit_reasons": ["..."],
  "risk_flags": ["..."],
  "suggested_profile": "...",
  "missing_skills": ["..."]
}
```

**2. Генерация письма:**

```
System: Ты пишешь сопроводительные письма от лица кандидата. Не выдумывай факты, используй только данные профиля.
User:
Профиль: {{profile.summary}}
Вакансия: {{title}} @ {{company}}, ключевые требования: {{topRequirements}}
Режим: {{mode}}              // tg|hh_standard|confident|very_short|en
Ограничения: {{flags}}        // noEmoji, noMarkdown, noSpecials, maxLen
Удачные примеры из библиотеки: {{2-3 best letters}}

Напиши письмо, строго соблюдая режим и ограничения. Без выдуманного опыта.
```

Правила: всегда **structured JSON** для анализа (парсится надёжно), запрет на галлюцинации фактов, отправлять в AI **только cleaned text**, не HTML, и показывать пользователю preview payload перед отправкой.

---

## Security / privacy

- **Permissions минимальны:** `activeTab` + host `*://*.hh.ru/*`, `storage`, `sidePanel`. Никаких `<all_urls>`, никаких широких прав.
- **BYOK хранение:** API-ключи в `chrome.storage.local` (не sync, чтобы не утекали через аккаунт-синк). В идеале — пометка, что ключ не покидает устройство, кроме вызова самого AI-провайдера.
- **AI data minimization:** дефолт — отправляется только cleaned description + skills + summary профиля. Никаких персональных контактов. **Preview «что уйдёт в AI»** перед каждым вызовом (можно с тумблером «не показывать снова»).
- **n8n webhook safety:** HMAC-подпись payload (shared secret в settings), отправка по HTTPS, **redaction** — никогда не слать в webhook сырой HTML и персданные сверх необходимого, retry с backoff, лог отправленных Event с флагом `sentToN8n`.
- **Никакой передачи данных на ваши серверы** — у вас их и нет, это надо явно заявить в политике (доверие = фича).
- **Debug-режим (HTML capture) — выключен по умолчанию** и с явным предупреждением.

---

## Test plan

- **Unit (Vitest):** `scoring.ts`, `matching.ts`, salary-parser, letter-flags (truncation, noEmoji/noMarkdown), redaction для n8n. Это ядро — покрытие здесь самое важное.
- **DOM fixtures:** сохранённые HTML-снимки страниц вакансий HH (несколько вариантов: с вилкой, без зарплаты, remote, разные грейды) → тест `vacancy-parser` без браузера. Это ваша **страховка от смены вёрстки HH**.
- **Integration:** мок `LLMProvider` (детерминированные ответы), мок n8n endpoint, проверка Event-pipeline.
- **E2E (Playwright):** загрузка extension, открытие side panel на fixture-странице, прогон статусов, экспорт.
- **Ручное на HH:** чек-лист на 10–15 реальных вакансий разных типов; отдельно проверка, что расширение **ничего не пишет в DOM HH и не делает сетевых действий от имени пользователя**.

---

## Risks and mitigations

| Риск | Severity | Mitigation |
|---|---|---|
| Бан/ToS HH из-за автоматизации | 🔴 высокий | Phase 1 строго read-only; никакой записи в форму, никаких очередей; только assist по явному действию пользователя |
| Смена вёрстки HH ломает парсинг | 🔴 высокий | versioned selectors, DOM-fixtures, graceful degradation (показать «не удалось распарсить», не падать) |
| Антибот-детект | 🟠 средний | не эмулировать действия пользователя, не делать фоновых запросов к HH, работать только на уже открытой пользователем странице |
| Утечка n8n webhook / API-ключа | 🟠 средний | local-only storage, HMAC, HTTPS, redaction, no telemetry |
| Спам уведомлений (порог 85) | 🟡 низкий | настраиваемый порог, калибровка перед включением, дневной лимит событий |
| AI-галлюцинации в письме | 🟡 низкий | запрет выдумывать факты, обязательный preview и ручное редактирование перед сохранением |
| Privacy чатов HR (Phase 5) | 🟠 средний | отложить; при реализации — только локально, без автоответов по умолчанию |

**Про ToS/антибот прямо:** безопасный подход = расширение **наблюдает и помогает**, но **не действует за пользователя**. Не обходим капчи/защиты, не делаем скрытых запросов к HH API, не автоотправляем. Любая вставка текста (Phase 3) — только в поле, которое пользователь видит, с обязательным ручным кликом «Откликнуться» им самим.

---

## Roadmap (один разработчик)

- **Спринт 0 (3–4 дня):** WXT-скелет, Manifest V3, Dexie-схема, model.ts, settings (BYOK + n8n).
- **Спринт 1 (1–1.5 нед):** vacancy-parser + fixtures + локальное сохранение + статусы.
- **Спринт 2 (1 нед):** rule-based scoring + reasons + risks + side panel UI.
- **Спринт 3 (1 нед):** AI provider (DeepSeek/OpenAI/OpenRouter) + анализ по кнопке + preview payload.
- **Спринт 4 (1 нед):** генератор письма (режимы/флаги) + библиотека писем.
- **Спринт 5 (3–4 дня):** export CSV/JSON + n8n webhook (HMAC + redaction) + 2 события. → **🚀 Релиз Phase 1.**
- **Далее:** Phase 2 (бейджи в выдаче), затем Phase 3 (guided apply под флагом). Чаты HR — только если будет реальный спрос.

---

## Список конкретных улучшений в ТЗ

1. Переименовать «MVP-1..5» в **Phase 1..3**, явно отметить Phase 1 как единственный первый релиз.
2. Добавить раздел **«Selector resilience strategy»** (versioned selectors + fixtures + graceful degradation).
3. Зафиксировать стек: **Solid.js** (убрать «или React»).
4. Вынести **подстановку в форму и очереди в Phase 3+** с явной пометкой «опционально, под флагом».
5. Добавить **n8n webhook security**: HMAC, HTTPS, redaction, retry/backoff.
6. Добавить требование **AI payload preview** и спецификацию того, какие поля уходят в AI.
7. Сделать **порог «сильной вакансии» настраиваемым (default 70)** + требование калибровки.
8. Прописать **salary parser как отдельный компонент** с тест-кейсами (вилка/gross/нет данных/валюта).
9. Добавить **explicit privacy statement**: «данные не покидают устройство, кроме AI-вызовов и n8n, которыми управляет пользователь».
10. Вынести **чаты HR / автоответы** в backlog с пометкой high privacy risk.
11. Добавить **debug-режим выключенным по умолчанию** для HTML capture.
12. Зафиксировать **permissions allowlist** (`*.hh.ru` + storage + sidePanel, без `<all_urls>`).
13. Добавить раздел **acceptance criteria для Phase 1** (что считается «готово к релизу»).

---

## Финальная рекомендация

**Сделайте Phase 1 как read-only Job Tracker + AI-помощник по кнопке, отгрузите его за ~4–6 недель, и только потом думайте про автоматизацию.** Это снимает главный риск (бан), даёт работающий продукт быстро и сохраняет архитектурную чистоту.
