import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

const Leaderboard = () => {
  // Mock data for the leaderboard
  const leaders = [
    { id: 1, name: 'Santhosh Kumar', points: 15400, level: 10, streak: 45 },
    { id: 2, name: 'Aarushi', points: 12800, level: 8, streak: 30 },
    { id: 3, name: 'Ashwin K.', points: 11200, level: 7, streak: 21 },
    { id: 4, name: 'Priya R.', points: 9500, level: 6, streak: 14 },
    { id: 5, name: 'Rahul V.', points: 8100, level: 5, streak: 8 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pt-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center space-x-3">
          <Trophy className="text-yellow-500" size={40} />
          <span>Community Champions</span>
        </h1>
        <p className="text-gray-500">The top environmental heroes making a difference.</p>
      </header>

      <div className="glass rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                <th className="p-4 font-semibold">Rank</th>
                <th className="p-4 font-semibold">EcoWarrior</th>
                <th className="p-4 font-semibold">Points</th>
                <th className="p-4 font-semibold">Level</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((user, index) => (
                <tr 
                  key={user.id} 
                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center">
                      {index === 0 && <Medal className="text-yellow-500 mr-2" size={24} />}
                      {index === 1 && <Medal className="text-gray-400 mr-2" size={24} />}
                      {index === 2 && <Medal className="text-amber-600 mr-2" size={24} />}
                      {index > 2 && <span className="font-bold text-gray-400 ml-2">#{index + 1}</span>}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-gray-900 dark:text-white flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <span>{user.name}</span>
                  </td>
                  <td className="p-4 font-bold text-green-500">{user.points.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="flex items-center space-x-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-3 py-1 rounded-full w-fit">
                      <Award size={14} />
                      <span>Lvl {user.level}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;