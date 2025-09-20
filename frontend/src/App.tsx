import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import PublicReviews from './components/PublicReviews/PublicReviews';
import './styles/globals.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="app-nav">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <span className="logo-text">FlexLiving</span>
              <span className="logo-accent">Reviews</span>
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/property/prop_001" className="nav-link">Sample Property</Link>
            </div>
          </div>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/property/:propertyId" element={<PublicReviews />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;