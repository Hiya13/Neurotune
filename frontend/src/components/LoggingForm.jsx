import { useState } from 'react';
import authService from '../services/authService';

function LoggingForm({ user, onSuccess }) {
  const [formData, setFormData] = useState({
    attentionScore: '',
    interventionType: 'none',
    taskContext: '',
    sessionDuration: '',
    baselineScore: '',
    peakScore: '',
    averageScore: '',
    stressLevel: 'moderate',
    noiseLevel: 'moderate',
    lighting: 'normal',
    temperature: 'comfortable',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = authService.getToken();
      
      const sessionData = {
        timestamp: new Date().toISOString(),
        attentionScore: parseFloat(formData.attentionScore),
        interventionType: formData.interventionType,
        taskContext: formData.taskContext,
        sessionDuration: parseInt(formData.sessionDuration),
        baselineScore: formData.baselineScore ? parseFloat(formData.baselineScore) : undefined,
        peakScore: formData.peakScore ? parseFloat(formData.peakScore) : undefined,
        averageScore: formData.averageScore ? parseFloat(formData.averageScore) : undefined,
        stressLevel: formData.stressLevel,
        environmentalFactors: {
          noiseLevel: formData.noiseLevel,
          lighting: formData.lighting,
          temperature: formData.temperature
        },
        notes: formData.notes
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error('Failed to log session');
      }

      setSuccess('Session logged successfully!');
      setFormData({
        attentionScore: '',
        interventionType: 'none',
        taskContext: '',
        sessionDuration: '',
        baselineScore: '',
        peakScore: '',
        averageScore: '',
        stressLevel: 'moderate',
        noiseLevel: 'moderate',
        lighting: 'normal',
        temperature: 'comfortable',
        notes: ''
      });

      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Attention Score *</label>
          <input
            type="number"
            name="attentionScore"
            required
            min="0"
            max="100"
            step="0.1"
            value={formData.attentionScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Session Duration (min) *</label>
          <input
            type="number"
            name="sessionDuration"
            required
            min="0"
            value={formData.sessionDuration}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Intervention Type *</label>
          <select
            name="interventionType"
            required
            value={formData.interventionType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          >
            <option value="none">None</option>
            <option value="visual">Visual</option>
            <option value="auditory">Auditory</option>
            <option value="haptic">Haptic</option>
            <option value="multi-modal">Multi-Modal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Task Context *</label>
          <input
            type="text"
            name="taskContext"
            required
            value={formData.taskContext}
            onChange={handleChange}
            placeholder="e.g., Reading, Coding, Studying"
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Baseline Score</label>
          <input
            type="number"
            name="baselineScore"
            min="0"
            max="100"
            step="0.1"
            value={formData.baselineScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Peak Score</label>
          <input
            type="number"
            name="peakScore"
            min="0"
            max="100"
            step="0.1"
            value={formData.peakScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Average Score</label>
          <input
            type="number"
            name="averageScore"
            min="0"
            max="100"
            step="0.1"
            value={formData.averageScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Stress Level</label>
          <select
            name="stressLevel"
            value={formData.stressLevel}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Noise Level</label>
          <select
            name="noiseLevel"
            value={formData.noiseLevel}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          >
            <option value="quiet">Quiet</option>
            <option value="moderate">Moderate</option>
            <option value="loud">Loud</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Lighting</label>
          <select
            name="lighting"
            value={formData.lighting}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          >
            <option value="dim">Dim</option>
            <option value="normal">Normal</option>
            <option value="bright">Bright</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Temperature</label>
          <select
            name="temperature"
            value={formData.temperature}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
          >
            <option value="cold">Cold</option>
            <option value="comfortable">Comfortable</option>
            <option value="warm">Warm</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">Notes</label>
        <textarea
          name="notes"
          rows="3"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional observations..."
          className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#653a8b] text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 shadow-lg transition-all"
      >
        {loading ? 'Logging...' : 'Log Session'}
      </button>
    </form>
  );
}

export default LoggingForm;
