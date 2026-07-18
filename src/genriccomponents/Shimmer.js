import React from "react";
const Shimmer = ({ count = 5, height = 30 }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-gray-300 rounded" style={{ height }}></div>
    ))}
  </div>
);
export default Shimmer;
