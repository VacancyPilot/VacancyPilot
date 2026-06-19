# CareerSignal HH Copilot: Product And Architecture Audit

## Executive Summary

CareerSignal HH Copilot стоит строить как **read-first, user-controlled assistant**, а не как автооткликер. Лучший первый MVP: страница вакансии HH -> извлечение данных -> локальное сохранение -> rule-based score -> AI-анализ по кнопке -> черновик письма -> ручное копирование/подстановка -> локальный трекер + экспорт/webhook. Все, что похоже на массовый сбор, фоновые обходы, обход капчи или автоотправку, нужно вынести за пределы первой версии.

## Что В Концепции Сильное

- Верный фокус: один сайт, HH.ru, Chromium-first, Manifest V3.
- Правильный продуктовый угол: не spam bot, а copilot под контролем пользователя.
- Local-first и работа без AI снижают стоимость, риск утечек и зависимость от LLM.
- Гибридный scoring: быстрый rule-based по умолчанию, AI только по запросу.
- Разделение на профили кандидата хорошо подходит под реальный job search.
- n8n/Telegram как opt-in интеграция, а не обязательный backend.

## Что Опасно Или Спорно

- Scope creep: MVP-1 уже включает extractor, DB, scoring, AI, письма, export, webhook, статусы. Это много для первой итерации.
- "Без backend" конфликтует с надежным детектом "HR ответил", чатами и reminders: это возможно только при посещении страниц пользователем, через API/OAuth или с backend-поллингом.
- "Очередь откликов" быстро приближает продукт к автооткликеру, даже если финальная кнопка за пользователем.
- BYOK в расширении означает, что API-ключ хранится на клиенте. Это приемлемо для MVP, но требует честного disclosure.
- Передача данных вакансий/резюме в AI и n8n конфликтует с local-first, если нет явного payload preview.
- HH DOM будет ломаться. Нужны DOM fixtures и site-adapter слой с версионированием.
- Использование "HH" в брендинге/иконках может создать trademark/review риск. Лучше: "CareerSignal Job Copilot", а "works on hh.ru" как описание.

## Исправленная Стратегия

Позиционирование: **decision-quality copilot for job search**, а не automation tool.

Главный workflow:

1. Пользователь сам открывает вакансию.
2. Расширение читает только текущую страницу.
3. Показывает score, fit/risk, рекомендованный профиль.
4. Пользователь нажимает "AI analyze" или "Generate letter".
5. Пользователь вручную проверяет письмо.
6. Пользователь сам отправляет отклик на HH.
7. Расширение фиксирует статус и, если разрешено, отправляет минимальное событие в n8n.

Продуктовые метрики: time-to-decision, доля сохраненных сильных вакансий, доля писем, отредактированных пользователем, applied rate, отсутствие captcha/account friction.

## MVP Scope

### MVP-1: Vacancy Page Copilot

- Extract title, company, salary, city, format, experience, description, skills, URL, HH vacancy id.
- Save locally, assign status, notes.
- Rule-based score and recommendation.
- AI-анализ по кнопке.
- Generate/edit/save cover letter.
- Export CSV/JSON.
- Manual n8n event send.

### MVP-2: Search Results Overlay

- Badges on HH search cards.
- Local status highlight.
- Approximate card-level score.
- Quick save/reject/queue.
- No background opening of vacancies.

### MVP-3: Assisted Apply

- Prepare letter and resume recommendation.
- User opens HH form.
- Extension can insert text only after explicit user click.
- User presses final HH submit button.

### MVP-4: Application Queue

- Local queue.
- One vacancy at a time.
- Buttons: send, skip, postpone, blacklist.
- Human-paced, no background apply, no captcha handling.

### MVP-5: Responses / Invites / Chats

- Read only when user visits HH response/chat pages.
- Classify HR replies.
- Draft HR response.
- Follow-up reminders.
- Optional official API/OAuth investigation.

## Что Не Делать В Первой Версии

- Полная автоотправка откликов.
- Фоновый обход поиска и массовое открытие вакансий.
- Обход капчи, rate limits, антибот-защит.
- Сбор cookies, паролей, сетевого трафика.
- Хранение полного HTML по умолчанию.
- LinkedIn/Indeed/Glassdoor adapters.
- Много AI-провайдеров сразу. Сделать provider interface + один рабочий провайдер.
- HR chats, invitations, Telegram bot logic.
- Backend user accounts, billing, cloud sync.

## Архитектура

Рекомендация: **WXT + TypeScript + React или Solid + Dexie + Chrome MV3**. WXT официально ориентирован на MV2/MV3 и Chromium-family browsers, что подходит под выбранный стек: [WXT](https://wxt.dev/). MV3 использует service worker вместо долгоживущей background page, это нужно учитывать в очередях, retries и state management: [Chrome MV3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3).

Компоненты:

- `content/hh-vacancy`: extraction, page badge, apply form assist.
- `content/hh-search`: card badges and quick actions.
- `background/service-worker`: message bus, AI calls, n8n outbox, alarms.
- `sidepanel`: main copilot UI. Chrome Side Panel хорошо подходит для постоянного companion UI рядом со страницей: [Chrome Side Panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel).
- `popup`: quick status and open side panel.
- `options/dashboard`: profiles, jobs table, queue, exports, settings.
- `core/domain`: Job, Profile, Scoring, PromptBuilder.
- `adapters/hh`: DOM selectors, parser, normalization.
- `integrations/ai`: provider interface.
- `integrations/n8n`: signed minimal webhook payloads.

Permissions:

- `storage`, `sidePanel`, optional `scripting`, optional `alarms`.
- Host permissions only for `https://hh.ru/*` and needed HH subdomains.
- Avoid `<all_urls>`, `cookies`, broad `tabs`, `webRequest`.
- For manual-only extraction, `activeTab` can reduce permission surface; Chrome documents that it grants temporary access after user gesture: [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab).

## Data Model

```ts
Job {
  id, source: "hh", sourceVacancyId, url, canonicalUrl,
  title, companyId, salary, city, workFormat, schedule, employment,
  experience, skills[], descriptionText, publishedAt?, capturedAt, updatedAt,
  status, score, recommendation, fitReasons[], riskFlags[], rawDebugHtml?
}

Company {
  id, source: "hh", sourceCompanyId?, name, url?, industries[],
  isBlacklisted, blacklistReason?, notes, createdAt, updatedAt
}

Profile {
  id, name, targetTitles[], seniority, locations[], workFormats[],
  salaryMin?, mustHaveSkills[], niceToHaveSkills[], avoidKeywords[],
  preferredIndustries[], coverLetterPrefs, defaultResumeId?
}

Resume {
  id, profileId, name, hhResumeId?, language, summary,
  skills[], highlights[], links[], version, isDefault
}

Application {
  id, jobId, companyId, profileId, resumeId?,
  status, appliedAt?, channel: "hh", applyMode,
  coverLetterId?, userNotes, nextActionAt?, createdAt, updatedAt
}

CoverLetter {
  id, jobId, applicationId?, profileId, resumeId?,
  mode, templateId?, draftText, finalText,
  language, constraints, aiProvider?, promptVersion, createdAt
}

Event {
  id, type, entityType, entityId, occurredAt,
  payloadSummary, userInitiated, privacyLevel,
  webhookStatus, retryCount, lastError?
}
```

## Scoring Model

Score 0-100:

- Role/title match: 20
- Must-have skills: 25
- Nice-to-have skills: 10
- Experience/seniority fit: 15
- Location/work format: 10
- Salary/conditions: 10
- Industry/company preference: 5
- Language/schedule/other constraints: 5

Caps and penalties:

- Blacklisted company: cap 40.
- Critical mismatch in work format/location: cap 65.
- Missing core must-have skill: cap 70.
- Salary below hard minimum: -10 to -25.
- Vague/scam-like wording, unpaid trial, suspicious company: risk flag + penalty.
- Recommendation: `apply >= 85 && no critical risks`, `think 65-84`, `skip < 65 or critical risk`.

## UX/UI Структура

- Search badges: small score, status chip, risk dot, save/reject/queue buttons.
- Vacancy page: compact injected badge near title + "Open Copilot".
- Side panel tabs: Overview, Fit/Risks, Letter, Tracker, Events.
- Popup: current page detected/not detected, current status, open side panel.
- Dashboard: jobs table, filters, queue, profiles, letter library, exports.
- Settings: AI provider, API key, n8n webhook, payload preview, privacy defaults.

## AI Prompts

### Analysis System Prompt

```text
You are a job-match analyst. Use only the provided vacancy and candidate profile data.
Do not invent facts. Return valid JSON only.
Evaluate fit, risks, missing information, recommended profile/resume, and whether to apply.
```

### Analysis User Payload

```json
{
  "candidateProfile": "...sanitized profile...",
  "resumeHighlights": ["..."],
  "vacancy": {
    "title": "...",
    "company": "...",
    "salary": "...",
    "city": "...",
    "workFormat": "...",
    "experience": "...",
    "skills": [],
    "description": "cleaned text"
  },
  "outputSchema": {
    "fitScore": "0-100",
    "recommendation": "apply | think | skip",
    "fitReasons": [],
    "riskFlags": [],
    "missingInfo": [],
    "profileSuggestion": "",
    "resumeAngle": "",
    "letterBullets": [],
    "confidence": "low | medium | high"
  }
}
```

### Letter System Prompt

```text
Write a concise, honest HH cover letter. Do not use markdown, emoji, or unsupported claims.
Use only candidate facts provided. Match the selected tone and character limit.
Return JSON: { "text": "...", "usedFacts": [], "assumptions": [] }.
```

## Security/Privacy

- Local-first: Job/Application data in IndexedDB/Dexie; small settings in `chrome.storage`. Chrome notes extension storage is async, quota-bound, and available to extension contexts: [chrome.storage](https://developer.chrome.com/docs/extensions/reference/api/storage).
- API keys: store locally only, never sync, allow delete/test. Do not claim perfect encryption in a browser extension.
- AI payload preview before first send and per-provider consent.
- Strip phone, email, full name, HR contacts, hidden HTML, cookies, internal page metadata.
- n8n: send minimal event by default: event type, job id, title, company, score, status, URL. No resume or full letter unless user enables it.
- No remote code, no `eval`, strict CSP, dependency audit.
- Chrome Web Store requires limited use and disclosure of user data handling, including scraped/automatically gathered data: [Chrome Limited Use](https://developer.chrome.com/docs/webstore/program-policies/limited-use).

## Risks And Mitigations

- ToS/API risk: HH has official API registration/OAuth flow for apps: [HeadHunter API](https://api.hh.ru/). API terms restrict credentials collection, third-party data transfer, misleading apps, and active API actions without user consent: [HH API terms](https://dev.hh.ru/admin/developer_agreement). Mitigation: DOM-read current page only in MVP, no credentials, no API actions, explicit user gestures.
- Ban/anti-bot risk: no bulk crawling, no background apply, no captcha solving, no artificial clicks, no request amplification.
- DOM breakage: adapter layer + fixtures from saved sanitized HTML snapshots.
- AI hallucination: JSON schema, "use only provided facts", confidence, user review.
- Privacy leakage: payload preview, redaction, local-only defaults.
- Store review: narrow HH permissions, clear privacy policy, no trademark-like branding.

## Roadmap Для Одного Разработчика

- Week 1: WXT project, MV3 manifest, side panel shell, HH adapter contract.
- Week 2: vacancy extractor + DOM fixtures + Dexie schema.
- Week 3: statuses, jobs table, rule-based scoring.
- Week 4: profiles/resumes/settings.
- Week 5: AI provider interface + one provider + analysis/letter prompts.
- Week 6: export CSV/JSON + n8n outbox.
- Week 7: search badges and quick actions.
- Week 8: manual QA on HH, privacy review, alpha release.
- Later: assisted apply, queue, responses/chats.

## Улучшения Для ТЗ

- Добавить explicit non-goals: no auto-apply, no scraping, no captcha bypass.
- Добавить permission budget и privacy budget.
- Описать event payload schema для n8n.
- Ввести `SiteAdapter` interface с HH как первым adapter.
- Добавить prompt versioning и AI payload preview.
- Добавить acceptance criteria для каждого MVP.
- Добавить тестовые DOM fixtures.
- Добавить "unofficial, user-controlled" wording.
- Добавить data retention/export/delete requirements.

## Финальная Рекомендация

Первый MVP должен быть **узким и надежным**: анализ одной открытой вакансии, локальный трекер, scoring, письмо, экспорт/webhook. Search badges можно делать вторым шагом. Очередь и полуавтоотклик стоит строить только после того, как базовый copilot доказал ценность без риска для аккаунта пользователя.
