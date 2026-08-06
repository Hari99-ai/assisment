# Database Schema

## User

- `id`
- `name`
- `email`
- `password`
- `role`
- `profileImage`
- `createdAt`

## Project

- `id`
- `projectName`
- `description`
- `deadline`
- `status`
- `createdById`
- `createdAt`

## ProjectMember

- `id`
- `projectId`
- `userId`
- `role`

## Task

- `id`
- `title`
- `description`
- `priority`
- `status`
- `dueDate`
- `assignedToId`
- `assignedById`
- `projectId`
- `attachmentUrl`

## Comment

- `id`
- `body`
- `taskId`
- `userId`
- `createdAt`

## Notification

- `id`
- `userId`
- `type`
- `message`
- `readAt`
- `createdAt`

