export const DUMMY_PROJECTS = [
  {
    id: 'demo-project-1',
    projectName: 'Website Redesign',
    description: 'Refresh the marketing site with a modern layout and improved accessibility.',
    status: 'ACTIVE',
    taskCount: 6,
    members: [
      { id: 'pm-1', user: { id: 'demo-user-1', name: 'Aarav Sharma' } },
      { id: 'pm-2', user: { id: 'demo-user-2', name: 'Priya Patel' } }
    ]
  },
  {
    id: 'demo-project-2',
    projectName: 'Mobile App Launch',
    description: 'Ship the mobile app for both iOS and Android platforms.',
    status: 'ACTIVE',
    taskCount: 4,
    members: [
      { id: 'pm-3', user: { id: 'demo-user-2', name: 'Priya Patel' } }
    ]
  },
  {
    id: 'demo-project-3',
    projectName: 'API Platform Migration',
    description: 'Migrate the legacy services to the new API platform.',
    status: 'COMPLETED',
    taskCount: 3,
    members: [
      { id: 'pm-4', user: { id: 'demo-user-3', name: 'Rohan Mehta' } }
    ]
  },
  {
    id: 'demo-project-4',
    projectName: 'Onboarding Automation',
    description: 'Automate new hire onboarding with smart task checklists.',
    status: 'ACTIVE',
    taskCount: 2,
    members: [
      { id: 'pm-5', user: { id: 'demo-user-4', name: 'Sara Khan' } }
    ]
  },
  {
    id: 'demo-project-5',
    projectName: 'Data Analytics Dashboard',
    description: 'Build a real-time analytics dashboard for the leadership team.',
    status: 'ACTIVE',
    taskCount: 9,
    members: [
      { id: 'pm-6', user: { id: 'demo-user-5', name: 'Vikram Singh' } }
    ]
  }
];

export const DUMMY_PROJECTS_PAGINATION = {
  page: 1,
  limit: 8,
  total: DUMMY_PROJECTS.length,
  pages: 1
};

export const DUMMY_TASKS = [
  {
    id: 'demo-task-1',
    title: 'Design home page hero section',
    description: 'Create high-fidelity mockups for the new hero section.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    project: { id: 'demo-project-1', projectName: 'Website Redesign' }
  },
  {
    id: 'demo-task-2',
    title: 'Set up CI/CD pipeline',
    description: 'Configure automated builds and deployments.',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    project: { id: 'demo-project-2', projectName: 'Mobile App Launch' }
  },
  {
    id: 'demo-task-3',
    title: 'Write API migration runbook',
    description: 'Document step-by-step migration instructions.',
    priority: 'LOW',
    status: 'TODO',
    project: { id: 'demo-project-3', projectName: 'API Platform Migration' }
  },
  {
    id: 'demo-task-4',
    title: 'Fix checkout payment bug',
    description: 'Resolve the payment gateway timeout on checkout.',
    priority: 'HIGH',
    status: 'OVERDUE',
    project: { id: 'demo-project-1', projectName: 'Website Redesign' }
  },
  {
    id: 'demo-task-5',
    title: 'Configure analytics event tracking',
    description: 'Wire up product analytics events across key flows.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    project: { id: 'demo-project-5', projectName: 'Data Analytics Dashboard' }
  },
  {
    id: 'demo-task-6',
    title: 'Review onboarding checklist content',
    description: 'Finalize the content for each onboarding step.',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    project: { id: 'demo-project-4', projectName: 'Onboarding Automation' }
  }
];

export const DUMMY_TASKS_PAGINATION = {
  page: 1,
  limit: 8,
  total: DUMMY_TASKS.length,
  pages: 1
};

export const DUMMY_TEAM = [
  { id: 'demo-user-1', name: 'Aarav Sharma', email: 'aarav@example.com', role: 'ADMIN', createdAt: new Date().toISOString() },
  { id: 'demo-user-2', name: 'Priya Patel', email: 'priya@example.com', role: 'MEMBER', createdAt: new Date().toISOString() },
  { id: 'demo-user-3', name: 'Rohan Mehta', email: 'rohan@example.com', role: 'MEMBER', createdAt: new Date().toISOString() },
  { id: 'demo-user-4', name: 'Sara Khan', email: 'sara@example.com', role: 'MEMBER', createdAt: new Date().toISOString() },
  { id: 'demo-user-5', name: 'Vikram Singh', email: 'vikram@example.com', role: 'MEMBER', createdAt: new Date().toISOString() }
];

export const DUMMY_DASHBOARD = {
  counts: {
    totalProjects: DUMMY_PROJECTS.length,
    totalTasks: DUMMY_TASKS.length,
    completedTasks: 9,
    pendingTasks: 11,
    overdueTasks: 4,
    teamMembers: DUMMY_TEAM.length,
    completionPercentage: 38
  },
  statusBreakdown: {
    TODO: 6,
    IN_PROGRESS: 5,
    COMPLETED: 9,
    OVERDUE: 4
  },
  projects: DUMMY_PROJECTS.map(({ taskCount, members, ...project }) => project),
  tasks: DUMMY_TASKS.map(({ priority, ...task }) => task),
  members: DUMMY_TEAM.slice(0, 5).map((user, index) => ({
    id: `demo-member-${index + 1}`,
    user: { name: user.name },
    project: DUMMY_PROJECTS[index % DUMMY_PROJECTS.length]
      ? { projectName: DUMMY_PROJECTS[index % DUMMY_PROJECTS.length].projectName }
      : null
  }))
};
