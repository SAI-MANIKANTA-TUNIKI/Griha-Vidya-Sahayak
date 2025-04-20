import React, { useEffect, useState } from 'react';
import styles from '../Pagesmodulecss/Profile.module.css';
import { supabase } from '../../Supabaesdata/supabaseClient'; // assuming you have this setup

type ProfileProps = {
  darkMode: boolean;
  onUsernameChange: (newUsername: string) => void;
};

const Profile: React.FC<ProfileProps> = ({ darkMode, onUsernameChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    nickname: '',
    bio: '',
    phone: '',
    email: '',
    gender: '',
    profilePic: '',
    backgroundImage: '',
  });

  const [tempProfile, setTempProfile] = useState(profile);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return console.error('User not found');

      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message);
      } else if (data) {
        setProfile(data);
        setTempProfile(data);
        onUsernameChange(data.nickname); // Update parent component if needed
      }
    };

    fetchProfile();
  }, []);

  const handleEditToggle = async () => {
    if (isEditing && userId) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          ...tempProfile,
        });

      if (error) {
        console.error('Error saving profile:', error.message);
        return;
      }

      setProfile(tempProfile);
      onUsernameChange(tempProfile.nickname);
    }

    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTempProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile((prev) => ({ ...prev, profilePic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`${styles.profileContainer} ${darkMode ? styles.dark : ''}`}>
      <div className={styles.profileContent}>
        <div
          className={styles.background}
          style={{ backgroundImage: `url(${tempProfile.backgroundImage})` }}
        ></div>

        <div className={styles.profilePicContainer}>
          <img src={tempProfile.profilePic || 'https://via.placeholder.com/150'} alt="Profile" className={styles.profilePic} />
          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className={styles.fileInput}
            />
          )}
        </div>

        <button className={styles.editButton} onClick={handleEditToggle}>
          {isEditing ? 'Save' : 'Edit Profile'}
        </button>

        <div className={styles.section}>
          <h2>
            {isEditing ? (
              <input
                name="name"
                placeholder="Name"
                value={tempProfile.name}
                onChange={handleInputChange}
              />
            ) : (
              profile.name
            )}
          </h2>
          <p className={styles.nickname}>
            @{isEditing ? (
              <input
                name="nickname"
                placeholder="Nickname"
                value={tempProfile.nickname}
                onChange={handleInputChange}
              />
            ) : (
              profile.nickname
            )}
          </p>
          <p>
            {isEditing ? (
              <textarea
                name="bio"
                placeholder="Bio"
                value={tempProfile.bio}
                onChange={handleInputChange}
              />
            ) : (
              profile.bio
            )}
          </p>
        </div>

        <div className={styles.section}>
          <h3>Contact</h3>
          <p>
            Phone:{' '}
            {isEditing ? (
              <input name="phone" value={tempProfile.phone} onChange={handleInputChange} />
            ) : (
              profile.phone
            )}
          </p>
          <p>
            Email:{' '}
            {isEditing ? (
              <input name="email" value={tempProfile.email} onChange={handleInputChange} />
            ) : (
              profile.email
            )}
          </p>
        </div>

        <div className={styles.section}>
          <h3>Details</h3>
          <p>
            Gender:{' '}
            {isEditing ? (
              <input name="gender" value={tempProfile.gender} onChange={handleInputChange} />
            ) : (
              profile.gender
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
