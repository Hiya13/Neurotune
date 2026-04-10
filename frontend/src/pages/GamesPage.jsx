import React from 'react';
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
