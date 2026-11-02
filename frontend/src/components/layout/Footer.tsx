import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚂</span>
            <div>
              <p className="text-sm font-semibold text-white">Terminus Railway Reservation System</p>
              <p className="text-xs text-slate-500">Academic DBMS Project Demonstration</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 text-center md:text-right">
            <p>Built with React, TypeScript, Spring Boot, JDBC & PL/SQL</p>
            <p className="mt-1">Includes ACID Transactions, Stored Procedures, Triggers & Analytical Views</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
