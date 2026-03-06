import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ScoreTrendChart({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available. Log your first session to see trends.
      </div>
    );
  }

  // Prepare data for chart (reverse to show oldest first)
  const chartData = sessions
    .slice()
    .reverse()
    .slice(-20) // Show last 20 sessions
    .map((session, index) => ({
      index: index + 1,
      score: session.attentionScore,
      average: session.averageScore || session.attentionScore,
      date: new Date(session.timestamp).toLocaleDateString(),
      time: new Date(session.timestamp).toLocaleTimeString()
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold">{data.date}</p>
          <p className="text-xs text-gray-500">{data.time}</p>
          <p className="text-sm text-primary-600">Score: {data.score}</p>
          {data.average && <p className="text-sm text-gray-600">Avg: {data.average}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="index" 
            label={{ value: 'Session Number', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            domain={[0, 100]}
            label={{ value: 'Attention Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            dot={{ fill: '#0ea5e9', r: 4 }}
            activeDot={{ r: 6 }}
            name="Attention Score"
          />
          {chartData.some(d => d.average !== d.score) && (
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke="#64748b" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Average"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ScoreTrendChart;
