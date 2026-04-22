import React, { useState } from 'react';
import GameCard from '../components/games/GameCard';

const GAMES = [
  {
    id: 'tide-controller',
    title: 'The Tide Controller',
    description: 'Control the ocean with your mind. Reveal ancient artifacts buried on the seafloor by sustaining deep focus.',
    duration: '5 min',
    difficulty: 'Medium',
    tags: ['Focus', 'Relaxation'],
    status: 'available',
    gradient: 'teal',
    icon: 'wave',
    path: '/games/tide-controller',
  },
  {
    id: 'mind-garden',
    title: 'The Mind Garden',
    description: 'Grow a living garden with sustained attention. Each flower blooms only when your focus holds.',
    duration: '7 min',
    difficulty: 'Easy',
    tags: ['Calm', 'Sustained Focus'],
    status: 'available',
    gradient: 'green',
    icon: 'leaf',
    path: '/games/mind-garden',
  },
  {
    id: 'focus-flight',
    title: 'Focus Flight',
    description: 'A calming endless ascent — your EEG attention score lifts a hot-air balloon through layered skies into the stratosphere.',
    duration: '6 min',
    difficulty: 'Easy',
    tags: ['Calm', 'Attention'],
    status: 'available',
    gradient: 'amber',
    icon: 'balloon',
    path: '/games/focus-flight',
  },
  {
    id: 'signal-hunter',
    title: 'The Signal Hunter',
    description: 'Tune into deep space. Your attention is the antenna — decode a hidden transmission through pure focus.',
    duration: '6 min',
    difficulty: 'Hard',
    tags: ['Intense Focus', 'Challenge'],
    status: 'coming-soon',
    gradient: 'purple',
    icon: 'signal',
    path: '/games/signal-hunter',
  }
];

const GamesPage = ({ wsConnected }) => {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isDemo = !wsConnected;

  return (
    <div className="space-y-10 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Focus Games</h1>
          <p className="text-[15px] text-slate-400 max-w-2xl leading-relaxed">
            EEG-powered games that train your attention. Your brain is the controller.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02]">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[13px] font-medium text-slate-300">
            {wsConnected ? 'EEG Connected' : 'Demo Mode'}
          </span>
        </div>
      </div>

      {/* DEMO BANNER */}
      {isDemo && !bannerDismissed && (
        <div
          className="flex items-start gap-4 p-[14px_18px] rounded-[10px] transition-all duration-300"
          style={{
            background: 'rgba(186,117,23,0.08)',
            border: '0.5px solid rgba(186,117,23,0.3)',
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-amber-200 mb-0.5">
              Running in Demo Mode
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed">
              No EEG device connected. All games use realistic simulated brain activity. 
              Connect your Muse or OpenBCI headset to use live data.
            </p>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-[12px] font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap px-3 py-1 rounded-lg border border-amber-500/20 hover:bg-amber-500/10 transition-all flex-shrink-0"
          >
            Got it
          </button>
        </div>
      )}

      {/* GAMES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map(game => (
          <GameCard 
            key={game.id} 
            game={game} 
          />
        ))}
      </div>

      {/* FOOTER PLACEHOLDER */}
      <div className="pt-8 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm">
          More cognitive training games are currently in development.
        </p>
      </div>
    </div>
  );
};

export default GamesPage;
