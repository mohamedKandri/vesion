# API Documentation

Interactive OpenAPI docs: **`/api/docs`** (Swagger UI, generated from code — always current).
Base URL: **`/api/v1`** (URI versioning; breaking changes ship as `/api/v2`).

## Conventions

**Envelope** — every success response is wrapped:

```json
{ "success": true, "data": { … } }
```

Errors are normalized by the global filter:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["password must be longer than or equal to 10 characters"],
  "path": "/api/v1/auth/register",
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```

**Pagination** — list endpoints accept `page`, `limit` (max 100), `search`, `sortBy`
(whitelisted per resource), `sortOrder`; they return `{ items, meta }` where `meta` carries
`page/limit/total/totalPages/hasNext/hasPrev`.

**Auth** — `Authorization: Bearer <accessToken>`. Refresh via `POST /auth/refresh` using the
httpOnly cookie or the `refreshToken` body field; refresh tokens rotate on every use.

**Rate limits** — global 100 req/min per IP; auth endpoints 5/min; contact & careers 3/min;
AI chat 15/min. NGINX adds a second enforcement layer in production.

## Endpoint map

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register` · `/login` · `/refresh` · `/logout` · `/verify-email` · `/resend-verification` · `/forgot-password` · `/reset-password` · `/change-password` · `GET /auth/me` · `POST /auth/2fa/{setup,enable,disable}` · `GET /auth/sessions` · `DELETE /auth/sessions/:id` |
| Users | `GET/POST /users` · `GET/PATCH/DELETE /users/:id` · `PATCH /users/me/profile` · `GET /users/me/activity` |
| Companies | `GET/POST /companies` · `GET/PATCH/DELETE /companies/:id` |
| Projects | `GET/POST /projects` · `GET/PATCH/DELETE /projects/:id` · `GET /projects/:id/timeline` · members · milestones |
| Tasks | `GET/POST /tasks` · `GET /tasks/board/:projectId` · `GET/PATCH/DELETE /tasks/:id` · `PATCH /tasks/:id/move` · comments · time entries |
| Invoices | `GET/POST /invoices` · `GET/PATCH/DELETE /invoices/:id` · `POST /invoices/:id/{send,void}` |
| Payments | `GET/POST /payments` · `GET /payments/:id` · `POST /payments/:id/refund` |
| Billing catalog | `GET/POST /tax-rates` · `DELETE /tax-rates/:id` · `GET/POST/PATCH /discount-codes` |
| Subscriptions | `GET /subscriptions/plans` (public) · `GET/POST /subscriptions` · `PATCH /subscriptions/:id/plan` · `POST /subscriptions/:id/{cancel,resume}` |
| Quotes | `GET/POST /quotes` · `GET/DELETE /quotes/:id` · `POST /quotes/:id/{send,accept,decline}` |
| Contracts | `GET/POST /contracts` · `GET /contracts/:id` · `POST /contracts/:id/{send,sign,terminate}` |
| Tickets | `GET /tickets/categories` · `GET/POST /tickets` · `GET/PATCH /tickets/:id` · `POST /tickets/:id/messages` |
| Knowledge base | `GET /knowledge-base/categories` · `GET /knowledge-base/articles[/​:slug]` (public) · feedback · staff CRUD |
| Messages | `GET/POST /messages/conversations` · `GET/POST /messages/conversations/:id` · `GET …/:id/poll` |
| Notifications | `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/{:id/read,read-all}` |
| AI assistant | `POST /ai/conversations` (public w/ visitorId) · `GET /ai/conversations[/:id]` · `POST /ai/conversations/:id/messages` · `POST …/:id/stream` (SSE) |
| CMS | `GET /blog/*`, `/portfolio*`, `/testimonials`, `/faq` (public reads) + staff CRUD |
| Careers | `GET /careers/postings[/:slug]` (public) · `POST /careers/postings/:slug/apply` · staff postings/applications |
| Contact | `POST /contact` (public) · `POST /contact/newsletter[/unsubscribe]` · staff inbox |
| Files | `POST /files/upload` (multipart) · `GET /files/project/:id` · `GET /files/:id/download` · `DELETE /files/:id` |
| Analytics | `GET /analytics/public` · `GET /analytics/client` · `GET /analytics/admin` |
| Platform | `GET /health` · `GET/PUT/DELETE /settings` · `GET /audit-logs` |

## Roles

`ADMIN` (full access) · `MANAGER` (operations, billing, CMS) · `DEVELOPER` (projects, tasks,
support) · `CLIENT` (own company's data only; drafts and internal notes are never visible) ·
`GUEST` (public endpoints only). Role requirements are annotated per endpoint in Swagger.

## SSE streaming (AI assistant)

`POST /ai/conversations/:id/stream` responds with `text/event-stream`:

```
event: chunk   data: {"text":"Hello "}
event: chunk   data: {"text":"there…"}
event: done    data: {"id":"…","sources":[{"type":"kb","title":"…","slug":"…"}]}
event: error   data: {"message":"…"}
```
