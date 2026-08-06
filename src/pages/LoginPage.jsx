import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      await login(values);
      toast.success('Signed in');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sign in');
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)}>
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <label>Email<input type="email" {...register('email', { required: true })} /></label>
        <label>Password<input type="password" {...register('password', { required: true })} /></label>
        <button className="primary-button" type="submit">Login</button>
        <p className="auth-link">New here? <Link to="/signup">Create an account</Link></p>
      </form>
    </div>
  );
}

