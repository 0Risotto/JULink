import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className }) => {
  return (
    <div
      className={`
        bg-gradient-to-br from-white to-gray-50
        shadow-lg rounded-2xl p-8 w-full max-w-md mx-auto
        border border-gray-200
        ${className ?? ""}
      `}
    >
      {title && (
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

export default Card;
