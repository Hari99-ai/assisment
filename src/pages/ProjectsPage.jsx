import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import { PROJECT_STATUSES } from '../data/constants';
import { DUMMY_PROJECTS, DUMMY_PROJECTS_PAGINATION } from '../data/dummyDashboard';

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm();
  const [data, setData] = useState(null);
  const [query, setQuery] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  function loadProjects() {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '8');
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);

    api.get(`/api/projects?${params.toString()}`)
      .then((response) => {
        const fallback = !response.data.data.length
          ? { data: DUMMY_PROJECTS, pagination: DUMMY_PROJECTS_PAGINATION }
          : null;
        setData(fallback || response.data);
      })
      .catch(() => setData({ data: DUMMY_PROJECTS, pagination: DUMMY_PROJECTS_PAGINATION }));
  }

  useEffect(() => {
    loadProjects();
  }, [page, query.search, query.status]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        deadline: values.deadline || undefined
      };
      await api.post('/api/projects', payload);
      toast.success('Project created');
      reset();
      setShowForm(false);
      loadProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  if (!data) return <Loader />;

  return (
    <div className="page-stack">
      <SectionHeader
        title="Projects"
        subtitle="Create, search, filter, and manage project work."
        action={user?.role === 'ADMIN' ? <button className="primary-button" onClick={() => setShowForm((open) => !open)}>{showForm ? 'Close' : 'New Project'}</button> : null}
      />

      <div className="filters-row">
        <input placeholder="Search projects" value={query.search} onChange={(e) => {
          setPage(1);
          setQuery((prev) => ({ ...prev, search: e.target.value }));
        }} />
        <select value={query.status} onChange={(e) => {
          setPage(1);
          setQuery((prev) => ({ ...prev, status: e.target.value }));
        }}>
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {showForm ? (
        <form className="panel form-grid" onSubmit={handleSubmit(onSubmit)}>
          <input placeholder="Project name" {...register('projectName', { required: true })} />
          <input placeholder="Deadline" type="date" {...register('deadline')} />
          <select {...register('status')} defaultValue="ACTIVE">
            {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <textarea placeholder="Description" rows="4" {...register('description')} />
          <button className="primary-button" type="submit">Save Project</button>
        </form>
      ) : null}

      <div className="cards-grid">
        {data.data.length ? data.data.map((project) => (
          <article key={project.id} className="project-card">
            <div className="card-topline">
              <span className={`pill status-${project.status.toLowerCase()}`}>{project.status}</span>
              <span>{project.taskCount || 0} tasks</span>
            </div>
            <h3>{project.projectName}</h3>
            <p>{project.description || 'No description provided.'}</p>
            <div className="card-footer">
              <button className="secondary-button" onClick={() => navigate(`/app/projects/${project.id}`)}>Open</button>
              <span>{project.members?.length || 0} members</span>
            </div>
          </article>
        )) : (
          <EmptyState title="No projects found" description="Create the first project or adjust your filters." />
        )}
      </div>

      <div className="pagination-row">
        <button className="secondary-button" disabled={data.pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button>
        <span>Page {data.pagination.page} of {data.pagination.pages || 1}</span>
        <button className="secondary-button" disabled={data.pagination.page >= data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
    </div>
  );
}
