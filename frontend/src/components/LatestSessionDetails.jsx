function LatestSessionDetails({ session }) {
  if (!session) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No sessions logged yet. Start by logging your first session!
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Date & Time</p>
          <p className="font-medium">{formatDate(session.timestamp)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Duration</p>
          <p className="font-medium">{session.sessionDuration} minutes</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-500 mb-2">Attention Score</p>
        <p className={`text-4xl font-bold ${getScoreColor(session.attentionScore)}`}>
          {session.attentionScore}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 border-t pt-4">
        <div>
          <p className="text-xs text-gray-500">Baseline</p>
          <p className="font-medium">{session.baselineScore || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Average</p>
          <p className="font-medium">{session.averageScore || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Peak</p>
          <p className="font-medium">{session.peakScore || 'N/A'}</p>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Task Context:</span>
          <span className="font-medium">{session.taskContext}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Intervention:</span>
          <span className="font-medium capitalize">{session.interventionType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Stress Level:</span>
          <span className="font-medium capitalize">{session.stressLevel}</span>
        </div>
      </div>

      {session.environmentalFactors && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-2">Environmental Factors</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Noise</p>
              <p className="capitalize">{session.environmentalFactors.noiseLevel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Light</p>
              <p className="capitalize">{session.environmentalFactors.lighting}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Temp</p>
              <p className="capitalize">{session.environmentalFactors.temperature}</p>
            </div>
          </div>
        </div>
      )}

      {session.notes && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-1">Notes</p>
          <p className="text-sm">{session.notes}</p>
        </div>
      )}
    </div>
  );
}

export default LatestSessionDetails;
