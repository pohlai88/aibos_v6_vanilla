import React from "react";

const ViewOnlyEye: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span
    className={`inline-flex items-center group ${className}`}
    tabIndex={0}
    title="View only. Managed by admin."
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="currentColor"
        className="text-gray-300 group-hover:text-blue-400"
      />
    </svg>
    <span className="sr-only">View only. Managed by admin.</span>
  </span>
);

export default ViewOnlyEye;
