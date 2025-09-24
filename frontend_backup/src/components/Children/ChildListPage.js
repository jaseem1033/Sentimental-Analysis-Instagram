import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';

const ChildListPage = () => {
    const [children, setChildren] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchChildren = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/accounts/children/');
            setChildren(response.data);
        } catch (error) {
            console.error('Failed to fetch children', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren]);

    const handleAddChild = () => {
        // IMPORTANT: Replace these with your actual Instagram App credentials
        const clientId = 'YOUR_INSTAGRAM_CLIENT_ID';
        const redirectUri = 'http://localhost:3000/instagram-callback'; // Must match your Instagram App settings
        const scope = 'user_profile,user_media';
        window.location.href = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    };

    const handleDeleteChild = async (childId) => {
        if (window.confirm('Are you sure you want to delete this child account and all their data?')) {
            try {
                await axios.delete(`/accounts/children/${childId}/delete/`);
                // Refresh the list after deletion
                fetchChildren();
            } catch (error) {
                console.error('Failed to delete child', error);
                alert('Could not delete the child account.');
            }
        }
    };

    if (isLoading) {
        return <div className="text-center mt-10">Loading children...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Monitored Accounts</h2>
                <button onClick={handleAddChild} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                    Add Child Account
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                {children.length > 0 ? (
                    <ul className="space-y-4">
                        {children.map(child => (
                            <li key={child.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                                <Link to={`/dashboard/${child.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
                                    {child.username}
                                </Link>
                                <button onClick={() => handleDeleteChild(child.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition duration-300">
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500">No child accounts have been added yet. Click "Add Child Account" to get started.</p>
                )}
            </div>
        </div>
    );
};

export default ChildListPage;