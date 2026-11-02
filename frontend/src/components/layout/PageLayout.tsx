import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  containerMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '7xl' | 'full';
  showContainer?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  containerMaxWidth = '7xl',
  showContainer = true,
}) => {
  const maxWidthClass = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }[containerMaxWidth];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-1 pb-12">
        {showContainer ? (
          <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 pt-6`}>
            {children}
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  );
};
