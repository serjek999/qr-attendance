"use client";

import Image from "next/image";

const Logo = ({ className = "", size = "default", useImage = false }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    default: "h-8 w-8", 
    large: "h-12 w-12",
    xlarge: "h-16 w-16"
  };

  if (useImage) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <Image
          src="/phinma.png"
          alt="PHINMA Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Placeholder logo design - you can replace this with your actual logo */}
      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">
        QR
      </div>
    </div>
  );
};

export { Logo }; 