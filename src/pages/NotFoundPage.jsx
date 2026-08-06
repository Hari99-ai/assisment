import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="center-screen">
      <div className="panel">
        <h1>404</h1>
        <p>That page does not exist.</p>
        <Link className="primary-button" to="/">Back home</Link>
      </div>
    </div>
  );
}

