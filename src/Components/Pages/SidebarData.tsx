import { useNavigate } from 'react-router-dom';
import { SidebarData } from '../Navigation/Sidebar';
import styles from '../Pagesmodulecss/Sidebar.module.css'; // Assuming you use CSS Modules

const Sidebar = () => {
  const navigate = useNavigate();
  const profileImage = 'https://via.placeholder.com/40';

  const handleProfileClick = () => {
    navigate('/Profile');
  };

  return (
    <div className={styles.sidebar}>
      <ul className={styles.sidebarList}>
        {SidebarData.map((item, index) => (
          <li key={index} className={item.cName}>
            <a href={item.path}>
              {item.icon}
              <span>{item.title}</span>
            </a>
          </li>
        ))}
      </ul>

      {/* Profile Section at the bottom */}
      <div className={styles.profileSection}>
        <h4 className={styles.profileTitle}>Profile</h4>
        <button onClick={handleProfileClick} className={styles.profileButton}>
          <img src={profileImage} alt="Profile" className={styles.profileImage} />
          <span>Go to Profile</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
