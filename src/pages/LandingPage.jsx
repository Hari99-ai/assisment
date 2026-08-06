import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  'RBAC for Admin and Member roles',
  'Project, task, and comment workflows',
  'Dashboard charts and recent activity',
  'Search, filters, and pagination',
  'JWT auth with protected routes',
  'Production-ready API structure'
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Full-stack delivery system</p>
          <h1>Run team work with projects, tasks, and real accountability.</h1>
          <p className="hero-text">
            A production-ready team task manager with JWT authentication, role-based access control,
            dashboard analytics, comments, notifications, and a responsive UI.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="primary-button">Create account</Link>
            <Link to="/login" className="secondary-button">Sign in</Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-panel-card">
            <div className="mini-metric">
              <span>Projects</span>
              <strong>24</strong>
            </div>
            <div className="mini-metric">
              <span>Tasks completed</span>
              <strong>86%</strong>
            </div>
            <div className="mini-metric">
              <span>Team members</span>
              <strong>18</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <article key={feature} className="feature-card">
            {feature}
          </article>
        ))}
      </section>
    </div>
  );
}

