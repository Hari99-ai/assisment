import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import SectionHeader from '../components/SectionHeader';
import { TASK_STATUSES } from '../data/constants';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/tasks/${id}`)
      .then((response) => {
        setTask(response.data.data);
        setError('');
      })
      .catch((requestError) => {
        setTask(null);
        setError(requestError.response?.data?.message || 'Task not found');
      });
  }, [id]);

  const updateStatus = async (event) => {
    const status = event.target.value;
    try {
      const response = await api.patch(`/api/tasks/${id}/status`, { status });
      setTask(response.data.data);
      toast.success('Task status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const addComment = async (values) => {
    try {
      const response = await api.post(`/api/tasks/${id}/comments`, values);
      setTask((current) => ({
        ...current,
        comments: [response.data.data, ...(current?.comments || [])]
      }));
      reset();
      toast.success('Comment added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const deleteTask = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      toast.success('Task deleted');
      navigate('/app/tasks');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  if (error) {
    return <div className="panel">{error}</div>;
  }

  if (!task) return <Loader />;

  return (
    <div className="page-stack">
      <SectionHeader
        title={task.title}
        subtitle={task.project?.projectName || 'Task details'}
        action={user?.role === 'ADMIN' ? <button className="ghost-button" onClick={deleteTask}>Delete task</button> : null}
      />

      <section className="panel">
        <div className="project-meta">
          <span>Priority: {task.priority}</span>
          <span>Assigned to: {task.assignedTo?.name || 'Unassigned'}</span>
          <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
        </div>
        <select value={task.status} onChange={updateStatus}>
          {TASK_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        {task.attachmentUrl ? <a className="secondary-button" href={task.attachmentUrl} target="_blank" rel="noreferrer">Open attachment</a> : null}
      </section>

      <section className="panel">
        <SectionHeader title="Comments" subtitle="Collaborate directly on the task." />
        <form className="form-grid" onSubmit={handleSubmit(addComment)}>
          <textarea rows="4" placeholder="Add a comment" {...register('body', { required: true })} />
          <button className="primary-button" type="submit">Post comment</button>
        </form>
        <div className="stack-list">
          {task.comments?.map((comment) => (
            <article key={comment.id} className="list-card">
              <strong>{comment.user?.name || 'Unknown'}</strong>
              <p>{comment.body}</p>
              <span>{new Date(comment.createdAt).toLocaleString()}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
