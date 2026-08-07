import React, { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { api } from '../api/client';
import { DUMMY_DASHBOARD } from '../data/dummyDashboard';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard')
      .then((response) => {
        const isEmpty = response.data.counts.totalTasks === 0 &&
          response.data.projects.length === 0 &&
          response.data.tasks.length === 0 &&
          response.data.members.length === 0;
        setState(isEmpty ? DUMMY_DASHBOARD : response.data);
      })
      .catch(() => setState(DUMMY_DASHBOARD));
  }, []);

  if (!state) {
    return <Loader />;
  }

  const { counts, projects, tasks, members, statusBreakdown } = state;
  const labels = Object.keys(statusBreakdown);
  const values = Object.values(statusBreakdown);

  return (
    <div className="dashboard-grid">
      <section className="panel role-panel">
        <div className="role-badge">{user?.role === 'ADMIN' ? 'Admin' : 'Member'} Panel</div>
      </section>
      <div className="stat-row">
        <StatCard label="Total Projects" value={counts.totalProjects} accent="blue" />
        <StatCard label="Total Tasks" value={counts.totalTasks} accent="purple" />
        <StatCard label="Completed Tasks" value={counts.completedTasks} accent="green" />
        <StatCard label="Pending Tasks" value={counts.pendingTasks} accent="gold" />
        <StatCard label="Overdue Tasks" value={counts.overdueTasks} accent="red" />
        <StatCard label="Completion" value={`${counts.completionPercentage}%`} accent="cyan" />
      </div>

      <div className="charts-grid">
        <section className="panel">
          <SectionHeader title="Task status" subtitle="Distribution of current task states." />
          <Pie data={{
            labels,
            datasets: [{ data: values, backgroundColor: ['#7dd3fc', '#c4b5fd', '#86efac', '#fca5a5'] }]
          }} />
        </section>
        <section className="panel">
          <SectionHeader title="Task mix" subtitle="Completion against remaining work." />
          <Bar data={{
            labels: ['Todo', 'In Progress', 'Completed', 'Overdue'],
            datasets: [{
              label: 'Tasks',
              data: [statusBreakdown.TODO || 0, statusBreakdown.IN_PROGRESS || 0, statusBreakdown.COMPLETED || 0, statusBreakdown.OVERDUE || 0],
              backgroundColor: '#7dd3fc'
            }]
          }} />
        </section>
      </div>

      <div className="two-column">
        <section className="panel">
          <SectionHeader title="Recent projects" subtitle="Latest created or updated work." />
          <div className="stack-list">
            {projects.map((project) => (
              <article key={project.id} className="list-card">
                <strong>{project.projectName}</strong>
                <span>{project.status}</span>
                <p>{project.description || 'No description provided.'}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader title="Recent tasks" subtitle="What the team is actively moving." />
          <div className="stack-list">
            {tasks.map((task) => (
              <article key={task.id} className="list-card">
                <strong>{task.title}</strong>
                <span>{task.status}</span>
                <p>{task.project?.projectName}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <SectionHeader title="Recent members" subtitle="People recently active in the workspace." />
        <div className="member-grid">
          {members.map((member) => (
            <article key={member.id} className="member-card">
              <div className="avatar">{member.user?.name?.slice(0, 1)?.toUpperCase()}</div>
              <div>
                <strong>{member.user?.name || 'Unknown'}</strong>
                <p>{member.project?.projectName}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

