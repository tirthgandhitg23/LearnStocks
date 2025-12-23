import React from "react";

interface LiveBadgeProps {
  isLive: boolean;
}

const LiveBadge: React.FC<LiveBadgeProps> = ({ isLive }) => {
  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isLive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
      <span className={`h-2 w-2 mr-2 rounded-full ${isLive ? 'bg-green-600' : 'bg-gray-400'}`} />
      {isLive ? 'Live' : 'Stale'}
    </div>
  );
};

export default LiveBadge;
