import React from 'react';
import config from '../config'; // Import the config

const Profile = ({ name, location, imageUrl }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <img 
        src={imageUrl} 
        alt={`Photo of ${name}`} 
        className="avatar" 
        style={{ width: `${config.defaultImageSize}px`, height: `${config.defaultImageSize}px` }} // Use config
      />
      <h1 className="text-2xl font-bold mt-4">{name}</h1>
      <h2 className="text-lg text-gray-600">{location}</h2>
    </div>
  );
};

export default Profile;