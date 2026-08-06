import React from 'react';
import SectionHeader from '../components/SectionHeader';

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <SectionHeader title="Settings" subtitle="Application preferences and deployment notes." />
      <section className="panel prose">
        <p>This build focuses on the core production workflow and keeps settings lightweight.</p>
        <ul>
          <li>JWT auth stored in local storage</li>
          <li>API base URL controlled by <code>VITE_API_URL</code></li>
          <li>Backend configured for Railway-friendly deployment</li>
        </ul>
      </section>
    </div>
  );
}

