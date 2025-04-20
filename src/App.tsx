import React, { useState, useEffect, JSX } from 'react';
import './App.css';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './Supabaesdata/supabaseClient';
import Navbar from './Components/Navigation/Navbar';

import Camera from './Components/Pages/Camear';
import DeviceData from './Components/Pages/DeviceData';
import HomeDashboard from './Components/Pages/HomeDashboard';
import PowerSupply from './Components/Pages/PowerSuplay';
import Profile from './Components/Pages/Profile';
import RoomControl from './Components/Pages/RoomControl';
import Settings from './Components/Pages/Settings';
import SidebarData from './Components/Pages/SidebarData';
import StripLed from './Components/Pages/StripLed';
import WelcomeDashboard from './Components/Pages/WelcomeDashboard';
import Authentication from './Components/Authentication/Authentication';
import Weather from './Components/Pages/Weather';
import Notification from './Components/Pages/Notification';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(storedDarkMode);

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsAuthenticated(true);
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated ? children : <Navigate to="/welcome" />;
  };

  const handleUsernameChange = (newUsername: string) => {
    console.log('Username changed to:', newUsername);
    // Optional: Add logic to update username in global state or show a toast
  };

  return (
    <Router>
      <div className={`app ${darkMode ? 'darkMode' : ''}`}>
        {isAuthenticated && (
          <Navbar
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((prev) => !prev)}
            handleSignOut={handleLogout}
          />
        )}
        <Routes>
          <Route
            path="/welcome"
            element={
              !isAuthenticated ? (
                <WelcomeDashboard darkMode={darkMode} onToggleDarkMode={() => setDarkMode((prev) => !prev)} />
              ) : (
                <Navigate to="/home" />
              )
            }
          />
          <Route
            path="/auth"
            element={<Authentication onLogin={() => setIsAuthenticated(true)} />}
          />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <HomeDashboard darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/camera"
            element={
              <PrivateRoute>
                <Camera darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/device-data"
            element={
              <PrivateRoute>
                <DeviceData darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/power-supply"
            element={
              <PrivateRoute>
                <PowerSupply darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile
                  darkMode={darkMode}
                  onUsernameChange={handleUsernameChange}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/room-control"
            element={
              <PrivateRoute>
                <RoomControl darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode((prev) => !prev)}
                  handleSignOut={handleLogout}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/sidebar-data"
            element={
              <PrivateRoute>
                <SidebarData />
              </PrivateRoute>
            }
          />
          <Route
            path="/weather"
            element={
              <PrivateRoute>
                <Weather darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/notification"
            element={
              <PrivateRoute>
                <Notification darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/strip-led"
            element={
              <PrivateRoute>
                <StripLed darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/welcome'} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
