import { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({ children, ...props }: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {children}
    </button>
  );
}
