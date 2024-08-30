import React from 'react';
import config from '../config'; // Import the config

const Profile = ({ firstName, lastName, location, imageUrl }) => { // Update props to use firstName and lastName

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4"> {/* Added space between items */}
      <img 
        src={imageUrl} 
        alt={`Photo of ${firstName}`} // Use first name for alt text
        className="avatar" 
        style={{ width: `${config.defaultImageSize}px`, height: `${config.defaultImageSize}px` }} // Use config
      />
      <div className="flex flex-col"> {/* Added flex column for better alignment */}
        <h1 className="text-lg font-bold" title={`${firstName} ${lastName}`}>{firstName}</h1> {/* Show first name, full name on hover */}
        <h2 className="text-md text-gray-600 mt-1">{location}</h2> {/* Added margin-top for spacing */}
      </div>
    </div>
  );
};

export default Profile;