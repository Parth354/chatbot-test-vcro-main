import React from 'react';

interface RouteLoggerProps {
  path: string;
  children: React.ReactNode;
}

const RouteLogger: React.FC<RouteLoggerProps> = ({ path, children }) => {
  console.log(`App.tsx: Rendering route: ${path}`);
  return <>{children}</>;
};

export default RouteLogger;
