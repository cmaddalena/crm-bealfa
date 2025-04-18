import React from 'react';
import { ReactNode, useState } from 'react';

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, { value, setValue })
      )}
    </div>
  );
}

export function TabsList({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 mb-2">{children}</div>;
}

export function TabsTrigger({ value, children, setValue }: any) {
  return (
    <button
      className="px-3 py-1 bg-gray-200 rounded"
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, ...props }: any) {
  return <div {...props}>{children}</div>;
}
