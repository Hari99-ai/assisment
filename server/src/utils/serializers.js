export function serializeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    createdAt: user.createdAt
  };
}

export function serializeProject(project) {
  if (!project) return null;
  return {
    id: project.id,
    projectName: project.projectName,
    description: project.description,
    deadline: project.deadline,
    status: project.status,
    createdById: project.createdById,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    createdBy: project.createdBy ? serializeUser(project.createdBy) : undefined,
    members: project.members?.map((member) => ({
      id: member.id,
      role: member.role,
      user: serializeUser(member.user)
    })),
    taskCount: project._count?.tasks ?? project.tasks?.length ?? undefined
  };
}

export function serializeTask(task) {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    assignedToId: task.assignedToId,
    assignedById: task.assignedById,
    projectId: task.projectId,
    attachmentUrl: task.attachmentUrl,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignedTo: task.assignedTo ? serializeUser(task.assignedTo) : null,
    assignedBy: task.assignedBy ? serializeUser(task.assignedBy) : null,
    project: task.project ? {
      id: task.project.id,
      projectName: task.project.projectName
    } : undefined,
    comments: task.comments?.map((comment) => serializeComment(comment))
  };
}

export function serializeComment(comment) {
  if (!comment) return null;
  return {
    id: comment.id,
    body: comment.body,
    taskId: comment.taskId,
    userId: comment.userId,
    createdAt: comment.createdAt,
    user: comment.user ? serializeUser(comment.user) : undefined
  };
}

export function serializeNotification(notification) {
  if (!notification) return null;
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    message: notification.message,
    readAt: notification.readAt,
    createdAt: notification.createdAt
  };
}

