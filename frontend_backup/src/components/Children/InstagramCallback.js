import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../api/axiosConfig';

// This component handles the redirect from Instagram's OAuth flow.
const InstagramCallback = () => {
    const [status, setStatus] = useState('Verifying with Instagram...');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyCode = async () => {
            const params = new URLSearchParams(location.search);
            const code = params.get('code');

            if (code) {
                try {
                    // Send the authorization code to your backend
                    // Your backend will exchange it for an access token and create the child record
                    await axios.post('/accounts/children/verify-login/', { code });
                    setStatus('Successfully linked Instagram account! Redirecting...');
                    
                    // Redirect to the children list after a short delay
                    setTimeout(() => {
                        navigate('/children');
                    }, 2000);

                } catch (error) {
                    console.error('Failed to verify Instagram login', error);
                    setStatus('Failed to link Instagram account. Please try again.');
                }
            } else {
                setStatus('Could not find authorization code. Please try again.');
            }
        };

        verifyCode();
    }, [location, navigate]);

    return (
        <div className="text-center mt-20">
            <h2 className="text-2xl font-bold">{status}</h2>
        </div>
    );
};

export default InstagramCallback;