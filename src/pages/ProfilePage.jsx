import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import SectionHeader from '../components/SectionHeader';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name,
      profileImage: user?.profileImage || ''
    }
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (values) => {
    try {
      setSaving(true);
      await updateProfile(values);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <SectionHeader title="Profile" subtitle="Edit your personal details." />
      <form className="panel form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label>Name<input {...register('name')} /></label>
        <label>Profile image URL<input {...register('profileImage')} /></label>
        <label>New password<input type="password" {...register('password')} /></label>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
      </form>
    </div>
  );
}

