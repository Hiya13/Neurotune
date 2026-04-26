export default function ArtifactCard({ artifact, discoveredAt, onClose }) {
  if (!artifact) return null;

  const ts = discoveredAt
    ? new Date(discoveredAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-w-md w-full rounded-2xl border border-teal-500/30 bg-slate-900/95 p-6 shadow-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artifact-card-title"
      >
        <h2 id="artifact-card-title" className="text-xl font-semibold text-teal-300 mb-2">
          {artifact.name}
        </h2>
        <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line mb-4">
          {artifact.story}
        </p>
        <p className="text-xs text-slate-500 mb-6">Discovered at {ts}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-teal-600/80 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
