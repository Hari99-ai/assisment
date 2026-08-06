import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { register, handleSubmit } = useForm({
    defaultValues: { role: 'MEMBER' }
  });
  const { signup } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      await signup(values);
      toast.success('Account created');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sign up');
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)}>
        <p className="eyebrow">Start here</p>
        <h1>Sign up</h1>
        <label>Name<input {...register('name', { required: true })} /></label>
        <label>Email<input type="email" {...register('email', { required: true })} /></label>
        <label>Password<input type="password" {...register('password', { required: true, minLength: 8 })} /></label>
        <label>
          Role
          <select {...register('role')}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button className="primary-button" type="submit">Create account</button>
        <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}

