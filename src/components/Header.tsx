import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://upload.wikimedia.org/wikipedia/en/e/ea/Appolice%28emblem%29.png" 
                alt="AP Police Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold">AP Police - Service Record Digitization Portal</h1>
                <p className="text-blue-200 text-sm">Era of Digitalization</p>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-blue-200 text-sm">AI-powered Analysis for Promotions, Awards, and Complaints</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;