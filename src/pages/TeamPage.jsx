import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import SectionHeader from '../components/SectionHeader';

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    api.get('/api/users')
      .then((response) => setUsers(response.data.data))
      .catch((error) => toast.error(error.response?.data?.message || 'Failed to load users'));
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return <div className="panel">Team management is available to admins only.</div>;
  }

  if (!users) return <Loader />;

  return (
    <div className="page-stack">
      <SectionHeader title="Team members" subtitle="Manage the workspace users and their roles." />
      <section className="panel">
        <div className="table-grid">
          {users.map((member) => (
            <div key={member.id} className="table-row">
              <span>{member.name}</span>
              <span>{member.email}</span>
              <span>{member.role}</span>
              <span>{new Date(member.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

