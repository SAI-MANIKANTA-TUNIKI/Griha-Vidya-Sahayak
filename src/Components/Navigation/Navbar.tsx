import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import { SidebarData } from '../Navigation/Sidebar';
import { IconContext } from 'react-icons';
import styles from '../Pagesmodulecss/Navbar.module.css';
import logo from '../../assets/images/logo.png';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  handleSignOut: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, onToggleDarkMode, handleSignOut }) => {
  const [sidebar, setSidebar] = useState(false);

  const toggleSidebar = () => setSidebar(!sidebar);

  return (
    <IconContext.Provider value={{ color: '#fff' }}>
      <div className={styles.navbar}>
        {/* Logo */}
        <div className={styles.logoContainer}>
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="Logo" className={styles.logoImg} />
        </Link>
        </div>

        {/* Menu Icon, Notification, and Dark Mode Toggle */}
        <div className={styles.menuAndDarkModeContainer}>
          {/* Sidebar Menu Button */}
          <button className={styles.menuBars} onClick={toggleSidebar}>
            <FaIcons.FaBars />
          </button>

          {/* Notification Icon */}
          <Link to="/Notification" className={styles.notificationIcon}>
            <IoIcons.IoMdNotificationsOutline />
          </Link>

          {/* Dark Mode Toggle */}
          <div className={styles.darkModeToggle}>
            <label className={styles.switch}>
              <input type="checkbox" checked={darkMode} onChange={onToggleDarkMode} />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <nav className={`${styles.navMenu} ${sidebar ? styles.active : ''}`}>
        <ul className={styles.navMenuItems} onClick={toggleSidebar}>
          <li className={styles.navbarToggle}>
            <button className={styles.menuBars}>
              <AiIcons.AiOutlineClose />
            </button>
          </li>

          {/* Sidebar Items */}
          {SidebarData.map((item, index) => (
            <li key={index} className={styles.navText}>
              <Link to={item.path}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}

          {/* Notification Link */}
          <li className={styles.navText}>
            <Link to="/Notification">
              <IoIcons.IoMdNotificationsOutline />
              <span>Notifications</span>
            </Link>
          </li>

          {/* Sign Out */}
          <li className={styles.navText}>
            <button onClick={handleSignOut} className={styles.signOutButton}>
              <AiIcons.AiOutlineLogout />
              <span>Sign Out</span>
            </button>
          </li>
        </ul>
      </nav>
    </IconContext.Provider>
  );
};

export default Navbar;
