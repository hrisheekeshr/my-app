import React from 'react';
import './App.css';
import Profile from './components/Profile';
import { profileData } from './data/profileData';

const App = () => {
  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-white p-6">
        <Profile {...profileData} />
      </div>
      <div className="w-3/4 bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-400 text-lg">No content available</p>
      </div>
    </div>
  );
};

export default App;
