import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import SectionHeader from '../components/SectionHeader';
import { TASK_PRIORITIES, TASK_STATUSES } from '../data/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');

  function loadProject() {
    api.get(`/api/projects/${id}`)
      .then((response) => {
        setProject(response.data);
        setError('');
      })
      .catch((requestError) => {
        setProject(null);
        setError(requestError.response?.data?.message || 'Project not found');
      });
  }

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    if (project?.data) {
      reset({
        projectName: project.data.projectName,
        description: project.data.description || '',
        deadline: project.data.deadline ? new Date(project.data.deadline).toISOString().slice(0, 10) : '',
        status: project.data.status
      });
    }
  }, [project, reset]);

  const createTask = async (values) => {
    try {
      await api.post('/api/tasks', {
        ...values,
        projectId: id
      });
      toast.success('Task created');
      reset();
      setTaskFormOpen(false);
      loadProject();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const updateProject = async (values) => {
    try {
      await api.put(`/api/projects/${id}`, values);
      toast.success('Project updated');
      setProjectFormOpen(false);
      loadProject();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update project');
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      toast.success('Project deleted');
      navigate('/app/projects');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const addMember = async () => {
    try {
      await api.post(`/api/projects/${id}/members`, { email: memberEmail });
      toast.success('Member added');
      setMemberEmail('');
      loadProject();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(`/api/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      loadProject();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  if (error) {
    return <div className="panel">{error}</div>;
  }

  if (!project) return <Loader />;

  const { data, tasks } = project;

  return (
    <div className="page-stack">
      <SectionHeader
        title={data.projectName}
        subtitle={data.description || 'No description provided.'}
        action={user?.role === 'ADMIN'
          ? (
            <div className="inline-actions">
              <button className="secondary-button" onClick={() => setProjectFormOpen((open) => !open)}>{projectFormOpen ? 'Close edit' : 'Edit project'}</button>
              <button className="primary-button" onClick={() => setTaskFormOpen((open) => !open)}>{taskFormOpen ? 'Close task' : 'New Task'}</button>
              <button className="ghost-button" onClick={deleteProject}>Delete</button>
            </div>
          )
          : null}
      />

      <section className="panel">
        <div className="project-meta">
          <span className={`pill status-${data.status.toLowerCase()}`}>{data.status}</span>
          <span>Deadline: {data.deadline ? new Date(data.deadline).toLocaleDateString() : 'No deadline'}</span>
          <span>Owner: {data.createdBy?.name || 'Unknown'}</span>
        </div>
      </section>

      {projectFormOpen ? (
        <form className="panel form-grid" onSubmit={handleSubmit(updateProject)}>
          <input placeholder="Project name" {...register('projectName', { required: true })} />
          <input placeholder="Deadline" type="date" {...register('deadline')} />
          <select {...register('status')} defaultValue={data.status}>
            {['ACTIVE', 'COMPLETED', 'ARCHIVED'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <textarea placeholder="Description" rows="4" {...register('description')} />
          <button className="primary-button" type="submit">Update Project</button>
        </form>
      ) : null}

      {user?.role === 'ADMIN' ? (
        <section className="panel form-inline">
          <input placeholder="Invite member by email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
          <button className="secondary-button" onClick={addMember}>Add Member</button>
        </section>
      ) : null}

      {taskFormOpen ? (
        <form className="panel form-grid" onSubmit={handleSubmit(createTask)}>
          <input placeholder="Task title" {...register('title', { required: true })} />
          <textarea placeholder="Task description" rows="4" {...register('description')} />
          <select {...register('priority')} defaultValue="MEDIUM">
            {TASK_PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select {...register('status')} defaultValue="TODO">
            {TASK_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="date" {...register('dueDate')} />
          <input placeholder="Assigned to user id" {...register('assignedToId')} />
          <button className="primary-button" type="submit">Save Task</button>
        </form>
      ) : null}

      <section className="panel">
        <SectionHeader title="Team members" subtitle="Users assigned to this project." />
        <div className="member-grid">
          {data.members?.map((member) => (
            <article key={member.id} className="member-card">
              <div className="avatar">{member.user?.name?.slice(0, 1)?.toUpperCase()}</div>
              <div>
                <strong>{member.user?.name}</strong>
                <p>{member.user?.email}</p>
              </div>
              {user?.role === 'ADMIN' && member.user?.id !== data.createdById ? (
                <button className="ghost-button" onClick={() => removeMember(member.user.id)}>Remove</button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <SectionHeader title="Tasks" subtitle="Track delivery across the project." />
        <div className="cards-grid">
          {tasks.map((task) => (
            <article key={task.id} className="project-card">
              <div className="card-topline">
                <span className={`pill status-${task.status.toLowerCase()}`}>{task.status}</span>
                <span>{task.priority}</span>
              </div>
              <h3>{task.title}</h3>
              <p>{task.description || 'No description provided.'}</p>
              <div className="card-footer">
                <span>{task.assignedTo?.name || 'Unassigned'}</span>
                <Link className="secondary-button" to={`/app/tasks/${task.id}`}>Open</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
