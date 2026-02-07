
import React from 'react';
import { FileRecord, FileStatus } from '../types';

interface StatsProps {
  files: FileRecord[];
  userId: string;
}

export const DashboardOverview: React.FC<StatsProps> = ({ files, userId }) => {
  const sentCount = files.filter(f => f.creatorId === userId).length;
  const receivedCount = files.filter(f => f.currentHolderId === userId).length;
  const pendingCount = files.filter(f => f.currentHolderId === userId && f.status === FileStatus.PENDING).length;
  const completedCount = files.filter(f => f.status === FileStatus.COMPLETED).length;

  const stats = [
    { label: 'Files Created', value: sentCount, color: 'bg-indigo-600', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    { label: 'Received & In Possession', value: receivedCount, color: 'bg-amber-500', icon: 'M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3' },
    { label: 'Awaiting Action', value: pendingCount, color: 'bg-rose-500', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Completed Files', value: completedCount, color: 'bg-emerald-600', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className={`${stat.color} p-3 rounded-lg text-white shadow-md`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
