# API Documentation

## Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

## Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:userId`

## Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `POST /api/tasks/:id/comments`
- `POST /api/tasks/:id/attachment`

## Users

- `GET /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

## Dashboard

- `GET /api/dashboard`

## Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

