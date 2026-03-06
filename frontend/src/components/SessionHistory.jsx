import { useState } from 'react';

function SessionHistory({ sessions, isLoading }) {
  const [filters, setFilters] = useState({
    interventionType: 'all',
    taskContext: '',
    minScore: 0,
    maxScore: 100
  });

  const [sortBy, setSortBy] = useState('date-desc');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  let filteredSessions = sessions ? [...sessions] : [];

  if (filters.interventionType !== 'all') {
    filteredSessions = filteredSessions.filter(
      s => s.interventionType === filters.interventionType
    );
  }

  if (filters.taskContext) {
    filteredSessions = filteredSessions.filter(
      s => s.taskContext.toLowerCase().includes(filters.taskContext.toLowerCase())
    );
  }

  filteredSessions = filteredSessions.filter(
    s => s.attentionScore >= filters.minScore && s.attentionScore <= filters.maxScore
  );

  // Apply sorting
  filteredSessions.sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.timestamp) - new Date(a.timestamp);
      case 'date-asc':
        return new Date(a.timestamp) - new Date(b.timestamp);
      case 'score-desc':
        return b.attentionScore - a.attentionScore;
      case 'score-asc':
        return a.attentionScore - b.attentionScore;
      default:
        return 0;
    }
  });

  const getScoreColor = (score) => {
    if (score >= 75) return 'bg-green-900/50 text-green-300 border border-green-700';
    if (score >= 50) return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700';
    return 'bg-red-900/50 text-red-300 border border-red-700';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Session History</h2>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Intervention Type</label>
            <select
              name="interventionType"
              value={filters.interventionType}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
            >
              <option value="all">All</option>
              <option value="none">None</option>
              <option value="visual">Visual</option>
              <option value="auditory">Auditory</option>
              <option value="haptic">Haptic</option>
              <option value="multi-modal">Multi-Modal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Task Context</label>
            <input
              type="text"
              name="taskContext"
              value={filters.taskContext}
              onChange={handleFilterChange}
              placeholder="Search tasks..."
              className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Min Score</label>
            <input
              type="number"
              name="minScore"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Max Score</label>
            <input
              type="number"
              name="maxScore"
              min="0"
              max="100"
              value={filters.maxScore}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg px-6 py-3">
        <p className="text-sm text-gray-300">
          Showing {filteredSessions.length} of {sessions ? sessions.length : 0} sessions
        </p>
      </div>

      {/* Sessions Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            No sessions found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Intervention
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Stress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Environment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {filteredSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(session.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(session.attentionScore)}`}>
                        {session.attentionScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {session.taskContext}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 capitalize">
                      {session.interventionType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {session.sessionDuration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 capitalize">
                      {session.stressLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {session.environmentalFactors && (
                        <div className="text-xs">
                          <div>N: {session.environmentalFactors.noiseLevel}</div>
                          <div>L: {session.environmentalFactors.lighting}</div>
                          <div>T: {session.environmentalFactors.temperature}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionHistory;
