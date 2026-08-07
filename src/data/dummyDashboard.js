export const DUMMY_DASHBOARD = {
  counts: {
    totalProjects: 6,
    totalTasks: 24,
    completedTasks: 9,
    pendingTasks: 11,
    overdueTasks: 4,
    teamMembers: 8,
    completionPercentage: 38
  },
  statusBreakdown: {
    TODO: 6,
    IN_PROGRESS: 5,
    COMPLETED: 9,
    OVERDUE: 4
  },
  projects: [
    {
      id: 'demo-project-1',
      projectName: 'Website Redesign',
      description: 'Refresh the marketing site with a modern layout and improved accessibility.',
      status: 'ACTIVE'
    },
    {
      id: 'demo-project-2',
      projectName: 'Mobile App Launch',
      description: 'Ship the mobile app for both iOS and Android platforms.',
      status: 'ACTIVE'
    },
    {
      id: 'demo-project-3',
      projectName: 'API Platform Migration',
      description: 'Migrate the legacy services to the new API platform.',
      status: 'COMPLETED'
    },
    {
      id: 'demo-project-4',
      projectName: 'Onboarding Automation',
      description: 'Automate new hire onboarding with smart task checklists.',
      status: 'ACTIVE'
    },
    {
      id: 'demo-project-5',
      projectName: 'Data Analytics Dashboard',
      description: 'Build a real-time analytics dashboard for the leadership team.',
      status: 'ACTIVE'
    }
  ],
  tasks: [
    {
      id: 'demo-task-1',
      title: 'Design home page hero section',
      status: 'IN_PROGRESS',
      project: { id: 'demo-project-1', projectName: 'Website Redesign' }
    },
    {
      id: 'demo-task-2',
      title: 'Set up CI/CD pipeline',
      status: 'COMPLETED',
      project: { id: 'demo-project-2', projectName: 'Mobile App Launch' }
    },
    {
      id: 'demo-task-3',
      title: 'Write API migration runbook',
      status: 'TODO',
      project: { id: 'demo-project-3', projectName: 'API Platform Migration' }
    },
    {
      id: 'demo-task-4',
      title: 'Fix checkout payment bug',
      status: 'OVERDUE',
      project: { id: 'demo-project-1', projectName: 'Website Redesign' }
    },
    {
      id: 'demo-task-5',
      title: 'Configure analytics event tracking',
      status: 'IN_PROGRESS',
      project: { id: 'demo-project-5', projectName: 'Data Analytics Dashboard' }
    },
    {
      id: 'demo-task-6',
      title: 'Review onboarding checklist content',
      status: 'COMPLETED',
      project: { id: 'demo-project-4', projectName: 'Onboarding Automation' }
    }
  ],
  members: [
    { id: 'demo-member-1', user: { name: 'Aarav Sharma' }, project: { projectName: 'Website Redesign' } },
    { id: 'demo-member-2', user: { name: 'Priya Patel' }, project: { projectName: 'Mobile App Launch' } },
    { id: 'demo-member-3', user: { name: 'Rohan Mehta' }, project: { projectName: 'API Platform Migration' } },
    { id: 'demo-member-4', user: { name: 'Sara Khan' }, project: { projectName: 'Data Analytics Dashboard' } },
    { id: 'demo-member-5', user: { name: 'Vikram Singh' }, project: { projectName: 'Onboarding Automation' } }
  ]
};
