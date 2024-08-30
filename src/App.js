import React from 'react';
import './App.css';
import Profile from './components/Profile';
import { profileData } from './data/profileData';
import SideMenu from './components/SideMenu';

const App = () => {
  return (
    <div className="flex h-screen">
      <div className="w-1/5 bg-white p-6 flex flex-col h-full"> {/* Added flex and h-full to make SideMenu take full vertical space */}
        <Profile {...profileData} />
        <SideMenu className="flex-grow" /> {/* Added flex-grow to SideMenu to take remaining space */}
      </div>
      <div className="w-4/5 bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-400 text-lg">No content available</p>
      </div>
    </div>
  );
};

export default App;
