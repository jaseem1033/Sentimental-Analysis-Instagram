import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('access_token');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <NavLink to={isAuthenticated ? "/children" : "/login"} className="text-2xl font-bold text-gray-800">
                    Sentiment Monitor
                </NavLink>
                <nav>
                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
                        >
                            Logout
                        </button>
                    ) : (
                        <div className="space-x-4">
                            <NavLink to="/login" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"}>
                                Login
                            </NavLink>
                            <NavLink to="/signup" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"}>
                                Sign Up
                            </NavLink>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Navbar;