import React from 'react';

interface RouteLoggerProps {
  path: string;
  children: React.ReactNode;
}

const RouteLogger: React.FC<RouteLoggerProps> = ({ path, children }) => {
  return <>{children}</>;
};

export default RouteLogger;
