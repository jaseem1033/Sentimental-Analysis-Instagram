// File: frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import ChildListPage from './components/Children/ChildListPage';
import DashboardPage from './components/Dashboard/DashboardPage';
import Navbar from './components/Layout/Navbar';
import InstagramCallback from './components/Children/InstagramCallback';

// A private route component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('access_token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Navbar />
            <main className="container mx-auto p-4 mt-4">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/instagram-callback" element={<InstagramCallback />} />

                    {/* Protected Routes */}
                    <Route path="/children" element={
                        <PrivateRoute>
                            <ChildListPage />
                        </PrivateRoute>
                    } />
                    <Route path="/dashboard/:childId" element={
                        <PrivateRoute>
                            <DashboardPage />
                        </PrivateRoute>
                    } />

                    {/* Default route */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </main>
        </Router>
    );
}

export default App;