import React, { useState } from 'react';
import './App.css';
import Profile from './components/Profile';
import { profileData } from './data/profileData';
import SideMenu from './components/SideMenu';
import Newspaper from './components/newspaper/Newspaper';

const PlaceholderPanel = ({ title, body }) => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="max-w-md text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500">{body}</p>
    </div>
  </div>
);

const App = () => {
  const [activeView, setActiveView] = useState('newspaper');

  const handleNavigate = (viewId) => {
    if (viewId === 'logout') {
      setActiveView('home');
      return;
    }
    setActiveView(viewId);
  };

  let mainContent;
  if (activeView === 'newspaper') {
    mainContent = <Newspaper />;
  } else if (activeView === 'profile') {
    mainContent = (
      <div className="h-full flex items-center justify-center p-8">
        <Profile {...profileData} />
      </div>
    );
  } else if (activeView === 'settings') {
    mainContent = (
      <PlaceholderPanel
        title="Settings"
        body="Settings remain available here. Newspaper generation is configured via environment variables and GitHub Actions."
      />
    );
  } else {
    mainContent = (
      <PlaceholderPanel
        title="Home"
        body="Welcome back. Open Newspaper from the sidebar to read today’s Four Corners Daily issue."
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen">
      <aside className="w-full md:w-1/5 bg-white p-4 md:p-6 flex flex-col md:h-full border-b md:border-b-0 md:border-r border-gray-100">
        <Profile {...profileData} />
        <SideMenu
          className="flex-grow"
          activeView={activeView}
          onNavigate={handleNavigate}
        />
      </aside>
      <main className="w-full md:w-4/5 bg-gray-50 md:overflow-hidden" id="main-content">
        {mainContent}
      </main>
    </div>
  );
};

export default App;
