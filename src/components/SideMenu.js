import { FaHome, FaUser, FaCog, FaSignOutAlt, FaNewspaper } from 'react-icons/fa';

const MENU_ITEMS = [
  { id: 'newspaper', label: 'Newspaper', icon: FaNewspaper },
  { id: 'home', label: 'Home', icon: FaHome },
  { id: 'profile', label: 'Profile', icon: FaUser },
  { id: 'settings', label: 'Settings', icon: FaCog },
];

const SideMenu = ({ className = '', activeView = 'newspaper', onNavigate }) => {
  return (
    <nav className={`bg-white p-4 rounded-lg shadow-md mt-4 flex flex-col h-full ${className}`} aria-label="Primary">
      <ul className="mt-2 flex-grow list-none p-0 m-0">
        {MENU_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <li key={id} className="m-0">
              <button
                type="button"
                onClick={() => onNavigate?.(id)}
                className={`w-full text-left py-3 px-4 cursor-pointer flex items-center rounded-md border-0 bg-transparent ${
                  isActive ? 'bg-gray-100 font-semibold text-gray-900' : 'hover:bg-gray-100 text-gray-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="mr-2" aria-hidden="true" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="py-3 px-4 hover:bg-red-100 cursor-pointer flex items-center mt-auto text-red-600 font-bold rounded-md border-0 bg-transparent w-full text-left"
        onClick={() => onNavigate?.('logout')}
      >
        <FaSignOutAlt className="mr-2" aria-hidden="true" />
        Logout
      </button>
    </nav>
  );
};

export default SideMenu;
