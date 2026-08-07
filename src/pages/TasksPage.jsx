import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Loader from '../components/Loader';
import SectionHeader from '../components/SectionHeader';
import { TASK_PRIORITIES, TASK_STATUSES } from '../data/constants';
import { DUMMY_TASKS, DUMMY_TASKS_PAGINATION } from '../data/dummyDashboard';

export default function TasksPage() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '8');
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);
    api.get(`/api/tasks?${params.toString()}`)
      .then((response) => {
        const fallback = !response.data.data.length
          ? { data: DUMMY_TASKS, pagination: DUMMY_TASKS_PAGINATION }
          : null;
        setData(fallback || response.data);
      })
      .catch(() => setData({ data: DUMMY_TASKS, pagination: DUMMY_TASKS_PAGINATION }));
  }, [filters.status, filters.priority, filters.search, page]);

  if (!data) return <Loader />;

  return (
    <div className="page-stack">
      <SectionHeader title="Tasks" subtitle="Filter and track every work item in the workspace." />

      <div className="filters-row">
        <input placeholder="Search tasks" value={filters.search} onChange={(e) => {
          setPage(1);
          setFilters((prev) => ({ ...prev, search: e.target.value }));
        }} />
        <select value={filters.priority} onChange={(e) => {
          setPage(1);
          setFilters((prev) => ({ ...prev, priority: e.target.value }));
        }}>
          <option value="">All priorities</option>
          {TASK_PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => {
          setPage(1);
          setFilters((prev) => ({ ...prev, status: e.target.value }));
        }}>
          <option value="">All statuses</option>
          {TASK_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="cards-grid">
        {data.data.map((task) => (
          <article key={task.id} className="project-card">
            <div className="card-topline">
              <span className={`pill status-${task.status.toLowerCase()}`}>{task.status}</span>
              <span>{task.priority}</span>
            </div>
            <h3>{task.title}</h3>
            <p>{task.description || 'No description provided.'}</p>
            <div className="card-footer">
              <span>{task.project?.projectName}</span>
              <Link className="secondary-button" to={`/app/tasks/${task.id}`}>Open</Link>
            </div>
          </article>
        ))}
      </div>

      <div className="pagination-row">
        <button className="secondary-button" disabled={data.pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button>
        <span>Page {data.pagination.page} of {data.pagination.pages || 1}</span>
        <button className="secondary-button" disabled={data.pagination.page >= data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
    </div>
  );
}
