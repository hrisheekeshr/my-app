import { FaHome, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa'; // Importing icons

const Menu = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4 flex flex-col h-full">
      {/* <h3 className="text-lg font-bold">Menu</h3> */}
      <ul className="mt-2 flex-grow">
        <li className="py-3 px-4 hover:bg-gray-100 cursor-pointer flex items-center rounded-md">
          <FaHome className="mr-2" /> Home
        </li>
        <li className="py-3 px-4 hover:bg-gray-100 cursor-pointer flex items-center rounded-md">
          <FaUser className="mr-2" /> Profile
        </li>
        <li className="py-3 px-4 hover:bg-gray-100 cursor-pointer flex items-center rounded-md">
          <FaCog className="mr-2" /> Settings
        </li>
      </ul>
      <li className="py-3 px-4 hover:bg-red-100 cursor-pointer flex items-center mt-auto text-red-600 font-bold rounded-md">
        <FaSignOutAlt className="mr-2" /> Logout
      </li>
    </div>
  );
};

export default Menu;
