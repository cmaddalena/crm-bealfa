import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, ...props }: CardProps) {
  return <div className="rounded-lg border bg-white p-4 shadow" {...props}>{children}</div>;
}

export function CardContent({ children }: { children: ReactNode }) {
  return <div className="text-sm text-gray-700">{children}</div>;
}
