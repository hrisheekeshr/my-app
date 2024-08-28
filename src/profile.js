import React from 'react';

const Profile = ({ name, location, imageUrl, imageSize }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <img 
        src={imageUrl} 
        alt={`photo of ${name}`} 
        className="avatar" 
        style={{ width: `${imageSize}px`, height: `${imageSize}px` }} 
      />
      <h1 className="text-2xl font-bold mt-4">{name}</h1>
      <h2 className="text-lg text-gray-600">{location}</h2>
    </div>
  );
};

export default Profile;