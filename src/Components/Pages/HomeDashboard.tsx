import React from 'react';
import styles from '../Pagesmodulecss/HomeDashboard.module.css';

interface HomeDashboardProps {
  darkMode: boolean;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({darkMode}) => {
  return (
  <div className={`${styles.container} ${darkMode ? styles.dark : ''}`}>  
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Powerful Features</h1>
          <p className={styles.subtitle}>Everything you need to control your smart home</p>
        </div>
        <div className={styles.heroImage}>
          <img
            src="https://thumbs.dreamstime.com/b/man-touching-smart-home-concept-touch-screen-his-finger-man-touching-smart-home-concept-135655262.jpg"
            alt="Smart Home IoT Technology"
            className={styles.heroImg}
          />
        </div>
      </div>

      {/* Features Overview Section */}
      <div className={styles.features}>
        <div className={styles.featureCard}>
          <span className={styles.icon}>📱</span>
          <h3>Device Control</h3>
          <p>Monitor and control all your connected devices from a single dashboard.</p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.icon}>📊</span>
          <h3>Real-time Analytics</h3>
          <p>Track device performance and energy usage in real-time.</p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.icon}>🤖</span>
          <h3>AI Integration</h3>
          <p>Smart automation with AI-powered systems for everyday tasks.</p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.icon}>🎙</span>
          <h3>Voice Control</h3>
          <p>Hands-free control with voice assistant capabilities.</p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.icon}>⚙</span>
          <h3>Custom Automation</h3>
          <p>Create personalized routines for optimal home efficiency.</p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.icon}>🔒</span>
          <h3>Security</h3>
          <p>Advanced security features to protect your smart home.</p>
        </div>
      </div>

      {/* Why Choose Section */}
      <div className={styles.whyChoose}>
        <h1>Why Choose SmartHome</h1>
        <p className={styles.subtitle}>Experience the future of home living</p>
        <div className={styles.benefits}>
          <div className={styles.benefitItem}>
            <span className={styles.benefitIcon}>⚡</span>
            <h3>Energy Efficiency</h3>
            <p>Save up to 30% on energy bills with smart automation and monitoring.</p>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitIcon}>⏳</span>
            <h3>Time Saving</h3>
            <p>Automate routine tasks and control everything from one place.</p>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitIcon}>🔔</span>
            <h3>Enhanced Security</h3>
            <p>24/7 monitoring and instant alerts for complete peace of mind.</p>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitIcon}>🏡</span>
            <h3>Comfort & Convenience</h3>
            <p>Enjoy a more comfortable living experience with smart climate control.</p>
          </div>
        </div>
      </div>
    </div>
 </div>
  );
};

export default HomeDashboard;