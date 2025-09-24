import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import SentimentChart from './SentimentChart';

const DashboardPage = () => {
    const { childId } = useParams();
    const [child, setChild] = useState(null);
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch child details and comments in parallel
            const [childRes, commentsRes] = await Promise.all([
                axios.get(`/accounts/children/${childId}/`), // Assumes you have a child detail endpoint
                axios.get(`/accounts/children/${childId}/comments/`)
            ]);
            setChild(childRes.data);
            setComments(commentsRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    }, [childId]);

    useEffect(() => {
        fetchDashboardData();
        // Set up auto-refresh every 3 minutes
        const intervalId = setInterval(fetchDashboardData, 3 * 60 * 1000);
        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, [fetchDashboardData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // This endpoint should trigger a background task on your server
            await axios.post(`/accounts/children/${childId}/fetch-comments/`);
            // Optionally, you can poll for task completion or just refetch after a delay
            setTimeout(() => {
                fetchDashboardData();
                setIsRefreshing(false);
            }, 5000); // Wait 5 seconds before refetching
        } catch (error) {
            console.error('Failed to trigger comment refresh', error);
            setIsRefreshing(false);
        }
    };
    
    if (isLoading) {
        return <div className="text-center mt-10">Loading dashboard...</div>;
    }

    const toxicComments = comments.filter(c => c.sentiment === 'toxic');

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard for {child?.username}</h1>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 disabled:bg-gray-400"
                >
                    {isRefreshing ? 'Refreshing...' : 'Fetch New Comments'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-center">Sentiment Overview</h3>
                    <SentimentChart comments={comments} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-red-600">High-Alert Comments ({toxicComments.length})</h3>
                    {toxicComments.length > 0 ? (
                        <ul className="space-y-3 max-h-96 overflow-y-auto">
                            {toxicComments.map(comment => (
                                <li key={comment.comment_id} className="p-3 border rounded-lg bg-red-50">
                                    <p className="text-gray-800">"{comment.text}"</p>
                                    <p className="text-sm text-gray-500 mt-1">- <strong>{comment.username}</strong> on {new Date(comment.created_at).toLocaleDateString()}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">No toxic comments found. Great news!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;