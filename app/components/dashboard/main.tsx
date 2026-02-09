'use client';

import { ReactNode } from 'react';

interface MainProps {
  children: ReactNode;
  className?: string;
}

export function Main({ children, className }: MainProps) {
  return (
    <main className='main_area'>
      <div className='h-full'>{children}</div>
    </main>
  );
}
