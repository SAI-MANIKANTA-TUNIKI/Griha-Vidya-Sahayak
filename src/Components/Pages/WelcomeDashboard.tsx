import React from 'react';
import styles from '../Pagesmodulecss/WelcomeDashboard.module.css';
import { useNavigate } from 'react-router-dom';

interface WelcomDashboardProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const WelcomDashboard: React.FC<WelcomDashboardProps> = ({ darkMode}) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : ''}`}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Welcome to Your Smart Home Assistant</h1>
          <p>Control your entire home with a single tap. Experience the future of home automation with our intelligent IoT platform.</p>
          <button onClick={handleGetStarted} className={styles.getStartedButton}>
            Get Started!
          </button>
        </div>
        <div className={styles.heroImage}>
          <img
            src="https://cdn.vectorstock.com/i/preview-1x/79/95/smart-home-signs-design-round-template-line-vector-20687995.webp"
            alt="Smart Home IoT"
            className={styles.heroImg}
          />
        </div>
      </div>
      <div className={styles.whyChoose}>
        <h2>Why Choose Our Platform?</h2>
        <p className={styles.subtitle}>Experience the perfect blend of convenience and innovation</p>
        <div className={styles.benefits}>
          <div className={styles.benefitCard}>
            <span className={styles.icon}>🔒</span>
            <h3>Advanced Security</h3>
            <p>Enterprise-grade encryption and real-time monitoring for your peace of mind.</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.icon}>🌱</span>
            <h3>Energy Efficient</h3>
            <p>Smart algorithms optimize energy consumption and reduce your bills.</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.icon}>📱</span>
            <h3>Easy Control</h3>
            <p>Control all your smart devices from anywhere using our intuitive mobile app.</p>
          </div>
        </div>
      </div>
      <div className={styles.callToAction}>
        <h2>Ready to Transform Your Home?</h2>
        <p>Join thousands of homeowners who have already upgraded to a smarter living experience.</p>
        <button onClick={handleGetStarted} className={styles.getStartedButton}>
          Get Started Today!
        </button>
      </div>
    </div>
  );
};

export default WelcomDashboard;
