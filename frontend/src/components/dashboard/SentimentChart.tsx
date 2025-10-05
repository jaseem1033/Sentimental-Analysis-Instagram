import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentStats } from '@/types';

interface SentimentChartProps {
  stats: SentimentStats;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ stats }) => {
  const data = [
    { name: 'Positive', value: stats.positive, color: 'hsl(var(--sentiment-positive))' },
    { name: 'Neutral', value: stats.neutral, color: 'hsl(var(--sentiment-neutral))' },
    { name: 'Negative', value: stats.negative, color: 'hsl(var(--sentiment-negative))' },
    { name: 'Toxic', value: stats.toxic, color: '#ef4444' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / stats.total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} comments ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex justify-center space-x-6 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium">{entry.value}</span>
          <span className="text-xs text-muted-foreground">
            ({entry.payload.value})
          </span>
        </div>
      ))}
    </div>
  );

  if (stats.total === 0) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No comments yet</p>
              <p className="text-sm">Fetch comments to see sentiment analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total comments analyzed: {stats.total}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-sentiment-positive">
              {((stats.positive / stats.total) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sentiment-neutral">
              {((stats.neutral / stats.total) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Neutral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sentiment-negative">
              {((stats.negative / stats.total) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Negative</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {((stats.toxic / stats.total) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Toxic</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentChart;