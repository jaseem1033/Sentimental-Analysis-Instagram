import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const SentimentChart = ({ comments }) => {
    // Calculate the count of each sentiment type
    const sentimentCounts = comments.reduce((acc, comment) => {
        acc[comment.sentiment] = (acc[comment.sentiment] || 0) + 1;
        return acc;
    }, {});

    const data = {
        labels: ['Positive', 'Negative', 'Neutral', 'Toxic'],
        datasets: [
            {
                label: '# of Comments',
                data: [
                    sentimentCounts.positive || 0,
                    sentimentCounts.negative || 0,
                    sentimentCounts.neutral || 0,
                    sentimentCounts.toxic || 0,
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',  // Positive - Green
                    'rgba(255, 99, 132, 0.6)',   // Negative - Red
                    'rgba(255, 206, 86, 0.6)',  // Neutral - Yellow
                    'rgba(153, 102, 255, 0.6)', // Toxic - Purple
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false, // Title is in the parent component
                text: 'Comment Sentiment Distribution',
            },
        },
    };

    return <Pie data={data} options={options} />;
};

export default SentimentChart;