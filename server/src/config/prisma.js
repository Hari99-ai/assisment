import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcrypt';

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'team-task-manager-data')
  : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData(), null, 2), 'utf8');
  }
}

function defaultData() {
  const now = new Date().toISOString();
  return {
    users: [],
    projects: [],
    projectMembers: [],
    tasks: [],
    comments: [],
    notifications: [],
    meta: {
      counters: {}
    },
    createdAt: now,
    updatedAt: now
  };
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw || JSON.stringify(defaultData()));
}

function writeData(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function toDate(value) {
  return value ? new Date(value).toISOString() : null;
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function matchesString(value, query) {
  return normalize(value).includes(normalize(query));
}

function get(obj, pathExpr) {
  return pathExpr.split('.').reduce((acc, key) => acc?.[key], obj);
}

function evaluateCondition(record, condition) {
  if (!condition || Object.keys(condition).length === 0) return true;

  return Object.entries(condition).every(([key, value]) => {
    if (key === 'AND') {
      return value.every((item) => evaluateCondition(record, item));
    }
    if (key === 'OR') {
      return value.some((item) => evaluateCondition(record, item));
    }

    const actual = get(record, key);

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('contains' in value) {
        return matchesString(actual, value.contains);
      }
      if ('in' in value) {
        return value.in.includes(actual);
      }
      if ('lte' in value) {
        return new Date(actual).getTime() <= new Date(value.lte).getTime();
      }
      if ('some' in value) {
        const related = Array.isArray(actual) ? actual : [];
        return related.some((item) => evaluateCondition(item, value.some));
      }
      return evaluateCondition(actual || {}, value);
    }

    return actual === value;
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function attachUser(data, userId) {
  return data.users.find((u) => u.id === userId) || null;
}

function attachProject(data, projectId) {
  return data.projects.find((p) => p.id === projectId) || null;
}

function attachProjectMembers(data, projectId) {
  return data.projectMembers.filter((m) => m.projectId === projectId).map((member) => ({
    ...member,
    user: attachUser(data, member.userId)
  }));
}

function attachTaskRelations(data, task) {
  if (!task) return null;
  const project = attachProject(data, task.projectId);
  return {
    ...task,
    assignedTo: task.assignedToId ? attachUser(data, task.assignedToId) : null,
    assignedBy: attachUser(data, task.assignedById),
    project: project
      ? {
          ...project,
          createdBy: attachUser(data, project.createdById),
          members: attachProjectMembers(data, project.id)
        }
      : null,
    comments: data.comments
      .filter((comment) => comment.taskId === task.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((comment) => ({
        ...comment,
        user: attachUser(data, comment.userId)
      }))
  };
}

function attachProjectRelations(data, project) {
  if (!project) return null;
  return {
    ...project,
    createdBy: attachUser(data, project.createdById),
    members: attachProjectMembers(data, project.id),
    tasks: data.tasks
      .filter((task) => task.projectId === project.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((task) => attachTaskRelations(data, task)),
    _count: {
      tasks: data.tasks.filter((task) => task.projectId === project.id).length
    }
  };
}

function attachNotificationRelations(notification) {
  return notification ? { ...notification } : null;
}

function projectFindMany(data, args = {}) {
  const records = data.projects.filter((project) => evaluateCondition(attachProjectRelations(data, project), args.where));
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sliced = records.slice(args.skip || 0, (args.skip || 0) + (args.take || records.length));
  return sliced.map((project) => attachProjectRelations(data, project));
}

function taskFindMany(data, args = {}) {
  const records = data.tasks
    .map((task) => attachTaskRelations(data, task))
    .filter((task) => evaluateCondition(task, args.where));
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return records.slice(args.skip || 0, (args.skip || 0) + (args.take || records.length));
}

function userFindMany(data, args = {}) {
  const records = data.users.filter((user) => evaluateCondition(user, args.where));
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return records.slice(args.skip || 0, (args.skip || 0) + (args.take || records.length));
}

function projectMemberFindMany(data, args = {}) {
  const records = data.projectMembers
    .map((member) => ({
      ...member,
      user: attachUser(data, member.userId),
      project: attachProject(data, member.projectId)
    }))
    .filter((member) => evaluateCondition(member, args.where));
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return records.slice(args.skip || 0, (args.skip || 0) + (args.take || records.length));
}

function notificationFindMany(data, args = {}) {
  const records = data.notifications.filter((notification) => evaluateCondition(notification, args.where));
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return records.slice(args.skip || 0, (args.skip || 0) + (args.take || records.length));
}

function createUser(data, payload) {
  const user = {
    id: uid('usr'),
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role || 'MEMBER',
    profileImage: payload.profileImage || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.users.push(user);
  return user;
}

function updateUser(data, where, payload) {
  const user = data.users.find((item) => item.id === where.id || item.email === where.email);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  Object.assign(user, payload, { updatedAt: new Date().toISOString() });
  return user;
}

function deleteUser(data, where) {
  const index = data.users.findIndex((item) => item.id === where.id);
  if (index === -1) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const [removed] = data.users.splice(index, 1);
  data.projectMembers = data.projectMembers.filter((m) => m.userId !== removed.id);
  data.tasks = data.tasks.map((task) => (task.assignedToId === removed.id ? { ...task, assignedToId: null } : task));
  return removed;
}

function createProject(data, payload) {
  const project = {
    id: uid('prj'),
    projectName: payload.projectName,
    description: payload.description || null,
    deadline: toDate(payload.deadline),
    status: payload.status || 'ACTIVE',
    createdById: payload.createdById,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.projects.push(project);
  return project;
}

function updateProject(data, where, payload) {
  const project = data.projects.find((item) => item.id === where.id);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  Object.assign(project, {
    ...payload,
    ...(payload.deadline !== undefined ? { deadline: toDate(payload.deadline) } : {}),
    updatedAt: new Date().toISOString()
  });
  return project;
}

function deleteProject(data, where) {
  const index = data.projects.findIndex((item) => item.id === where.id);
  if (index === -1) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  const [removed] = data.projects.splice(index, 1);
  data.projectMembers = data.projectMembers.filter((m) => m.projectId !== removed.id);
  data.tasks = data.tasks.filter((task) => task.projectId !== removed.id);
  data.comments = data.comments.filter((comment) => data.tasks.some((task) => task.id === comment.taskId));
  return removed;
}

function upsertProjectMember(data, args) {
  const existing = data.projectMembers.find((m) => m.projectId === args.where.projectId_userId.projectId && m.userId === args.where.projectId_userId.userId);
  if (existing) {
    return {
      ...existing,
      user: attachUser(data, existing.userId)
    };
  }
  const member = {
    id: uid('pm'),
    projectId: args.create.projectId,
    userId: args.create.userId,
    role: args.create.role || 'MEMBER',
    createdAt: new Date().toISOString()
  };
  data.projectMembers.push(member);
  return {
    ...member,
    user: attachUser(data, member.userId)
  };
}

function deleteProjectMember(data, where) {
  const index = data.projectMembers.findIndex((m) => m.projectId === where.projectId_userId.projectId && m.userId === where.projectId_userId.userId);
  if (index === -1) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  return data.projectMembers.splice(index, 1)[0];
}

function createTask(data, payload) {
  const task = {
    id: uid('tsk'),
    title: payload.title,
    description: payload.description || null,
    priority: payload.priority || 'MEDIUM',
    status: payload.status || 'TODO',
    dueDate: toDate(payload.dueDate),
    assignedToId: payload.assignedToId || null,
    assignedById: payload.assignedById,
    projectId: payload.projectId,
    attachmentUrl: payload.attachmentUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.tasks.push(task);
  return task;
}

function updateTask(data, where, payload) {
  const task = data.tasks.find((item) => item.id === where.id);
  if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404 });
  Object.assign(task, {
    ...payload,
    ...(payload.dueDate !== undefined ? { dueDate: toDate(payload.dueDate) } : {}),
    updatedAt: new Date().toISOString()
  });
  return task;
}

function deleteTask(data, where) {
  const index = data.tasks.findIndex((item) => item.id === where.id);
  if (index === -1) throw Object.assign(new Error('Task not found'), { statusCode: 404 });
  const [removed] = data.tasks.splice(index, 1);
  data.comments = data.comments.filter((comment) => comment.taskId !== removed.id);
  return removed;
}

function createComment(data, payload) {
  const comment = {
    id: uid('cmt'),
    body: payload.body,
    taskId: payload.taskId,
    userId: payload.userId,
    createdAt: new Date().toISOString()
  };
  data.comments.push(comment);
  return {
    ...comment,
    user: attachUser(data, comment.userId)
  };
}

function createNotification(data, payload) {
  const notification = {
    id: uid('ntf'),
    userId: payload.userId,
    type: payload.type,
    message: payload.message,
    readAt: payload.readAt || null,
    createdAt: new Date().toISOString()
  };
  data.notifications.push(notification);
  return notification;
}

function updateManyNotifications(data, where, payload) {
  let count = 0;
  data.notifications.forEach((notification) => {
    if (evaluateCondition(notification, where)) {
      Object.assign(notification, payload, { readAt: payload.readAt || notification.readAt });
      count += 1;
    }
  });
  return { count };
}

export const prisma = {
  user: {
    findUnique: async ({ where }) => {
      const data = readData();
      const user = data.users.find((item) => (where.id ? item.id === where.id : normalize(item.email) === normalize(where.email)));
      return user ? clone(user) : null;
    },
    findMany: async (args = {}) => clone(userFindMany(readData(), args)),
    count: async ({ where } = {}) => userFindMany(readData(), { where }).length,
    create: async ({ data }) => {
      const store = readData();
      const user = createUser(store, data);
      writeData(store);
      return clone(user);
    },
    update: async ({ where, data }) => {
      const store = readData();
      const user = updateUser(store, where, data);
      writeData(store);
      return clone(user);
    },
    delete: async ({ where }) => {
      const store = readData();
      const user = deleteUser(store, where);
      writeData(store);
      return clone(user);
    }
  },
  project: {
    findMany: async (args = {}) => clone(projectFindMany(readData(), args)),
    count: async ({ where } = {}) => projectFindMany(readData(), { where }).length,
    create: async ({ data, include }) => {
      const store = readData();
      const project = createProject(store, data);
      if (data.members?.create) {
        data.members.create.forEach((member) => {
          store.projectMembers.push({
            id: uid('pm'),
            projectId: project.id,
            userId: member.userId,
            role: member.role || 'MEMBER',
            createdAt: new Date().toISOString()
          });
        });
      }
      writeData(store);
      const created = attachProjectRelations(store, project);
      return clone(created);
    },
    findFirst: async ({ where, include } = {}) => {
      const data = readData();
      const found = projectFindMany(data, { where })[0] || null;
      return found ? clone(found) : null;
    },
    findUnique: async ({ where }) => {
      const data = readData();
      const project = data.projects.find((item) => item.id === where.id);
      return project ? clone(attachProjectRelations(data, project)) : null;
    },
    update: async ({ where, data }) => {
      const store = readData();
      const project = updateProject(store, where, data);
      writeData(store);
      return clone(attachProjectRelations(store, project));
    },
    delete: async ({ where }) => {
      const store = readData();
      const project = deleteProject(store, where);
      writeData(store);
      return clone(project);
    }
  },
  projectMember: {
    findMany: async (args = {}) => clone(projectMemberFindMany(readData(), args)),
    count: async ({ where } = {}) => projectMemberFindMany(readData(), { where }).length,
    upsert: async (args) => {
      const store = readData();
      const member = upsertProjectMember(store, args);
      writeData(store);
      return clone(member);
    },
    delete: async ({ where }) => {
      const store = readData();
      const member = deleteProjectMember(store, where);
      writeData(store);
      return clone(member);
    }
  },
  task: {
    findMany: async (args = {}) => clone(taskFindMany(readData(), args)),
    count: async ({ where } = {}) => taskFindMany(readData(), { where }).length,
    create: async ({ data }) => {
      const store = readData();
      const task = createTask(store, data);
      writeData(store);
      return clone(attachTaskRelations(store, task));
    },
    findUnique: async ({ where }) => {
      const data = readData();
      const task = data.tasks.find((item) => item.id === where.id);
      return task ? clone(attachTaskRelations(data, task)) : null;
    },
    update: async ({ where, data }) => {
      const store = readData();
      const task = updateTask(store, where, data);
      writeData(store);
      return clone(attachTaskRelations(store, task));
    },
    delete: async ({ where }) => {
      const store = readData();
      const task = deleteTask(store, where);
      writeData(store);
      return clone(task);
    }
  },
  comment: {
    create: async ({ data }) => {
      const store = readData();
      const comment = createComment(store, data);
      writeData(store);
      return clone(comment);
    }
  },
  notification: {
    create: async ({ data }) => {
      const store = readData();
      const notification = createNotification(store, data);
      writeData(store);
      return clone(notification);
    },
    createMany: async ({ data }) => {
      const store = readData();
      data.forEach((entry) => createNotification(store, entry));
      writeData(store);
      return { count: data.length };
    },
    findMany: async (args = {}) => clone(notificationFindMany(readData(), args)),
    updateMany: async ({ where, data }) => {
      const store = readData();
      const result = updateManyNotifications(store, where, data);
      writeData(store);
      return result;
    }
  }
};

