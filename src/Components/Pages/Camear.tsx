import React, { useState, useEffect, useRef } from 'react';
import styles from '../Pagesmodulecss/Camear.module.css';
import { supabase } from '../../Supabaesdata/supabaseClient'; // Adjust the path to your supabase client file

interface Camera {
  id: string;
  name: string;
  address: string;
  is_playing: boolean;
}

interface CameraProps {
  darkMode: boolean;
}

const Camera: React.FC<CameraProps> = ({ darkMode }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [newCamera, setNewCamera] = useState<{ name: string; address: string }>({ name: '', address: '' });
  const [editCamera, setEditCamera] = useState<Camera | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLImageElement>(null);

  // Fetch cameras from Supabase on component mount
  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const { data, error } = await supabase.from('cameras').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setCameras(data || []);
      if (data && data.length > 0) {
        setSelectedCameraId(data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch cameras. Please try again.');
      console.error(err);
    }
  };

  // Insert a notification
  const insertNotification = async (entityId: string, action: string, message: string) => {
    try {
      const { error } = await supabase.from('notifications').insert([
        {
          entity_type: 'camera',
          entity_id: entityId,
          action,
          message,
          source: 'dashboard',
        },
      ]);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to insert notification:', err);
    }
  };

  // Add a new camera
  const handleAddCamera = async () => {
    if (!newCamera.name || !newCamera.address) {
      setError('Please provide both camera name and address.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cameras')
        .insert([{ name: newCamera.name, address: newCamera.address, is_playing: true }])
        .select()
        .single();
      if (error) throw error;

      setNewCamera({ name: '', address: '' });
      setIsModalOpen(false);
      setError(null);
      await fetchCameras(); // Refresh the camera list

      // Insert notification
      if (data) {
        await insertNotification(data.id, 'created', `Camera ${newCamera.name} was added.`);
      }
    } catch (err) {
      setError('Failed to add camera. Please try again.');
      console.error(err);
    }
  };

  // Edit a camera
  const handleEditCamera = async () => {
    if (!editCamera || !editCamera.name || !editCamera.address) {
      setError('Please provide both camera name and address.');
      return;
    }

    try {
      const { error } = await supabase
        .from('cameras')
        .update({ name: editCamera.name, address: editCamera.address })
        .eq('id', editCamera.id);
      if (error) throw error;

      setIsEditModalOpen(false);
      setEditCamera(null);
      setError(null);
      await fetchCameras(); // Refresh the camera list

      // Insert notification
      await insertNotification(editCamera.id, 'updated', `Camera ${editCamera.name} was updated.`);
    } catch (err) {
      setError('Failed to update camera. Please try again.');
      console.error(err);
    }
  };

  // Delete a camera
  const handleDeleteCamera = async (id: string) => {
    try {
      const camera = cameras.find((cam) => cam.id === id);
      const { error } = await supabase.from('cameras').delete().eq('id', id);
      if (error) throw error;

      await fetchCameras(); // Refresh the camera list
      if (selectedCameraId === id && cameras.length > 1) {
        setSelectedCameraId(cameras[0].id);
      }

      // Insert notification
      if (camera) {
        await insertNotification(id, 'deleted', `Camera ${camera.name} was deleted.`);
      }
    } catch (err) {
      setError('Failed to delete camera. Please try again.');
      console.error(err);
    }
  };

  // Toggle play/pause
  const togglePlay = async (id: string) => {
    try {
      const camera = cameras.find((cam) => cam.id === id);
      if (!camera) return;

      const { error } = await supabase
        .from('cameras')
        .update({ is_playing: !camera.is_playing })
        .eq('id', id);
      if (error) throw error;

      await fetchCameras(); // Refresh the camera list

      // Insert notification
      await insertNotification(
        id,
        'toggled',
        `Camera ${camera.name} was ${!camera.is_playing ? 'played' : 'paused'}.`
      );
    } catch (err) {
      setError('Failed to toggle play/pause. Please try again.');
      console.error(err);
    }
  };

  // Full-screen mode
  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch((err) => console.error(err));
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Take a screenshot
  const takeScreenshot = () => {
    const selectedCamera = cameras.find((cam) => cam.id === selectedCameraId);
    if (selectedCamera) {
      const link = document.createElement('a');
      link.href = selectedCamera.address;
      link.download = `${selectedCamera.name}_screenshot.png`;
      link.click();

      // Insert notification
      insertNotification(
        selectedCamera.id,
        'screenshot',
        `Screenshot taken for camera ${selectedCamera.name}.`
      );
    }
  };

  // Download video
  const handleDownload = () => {
    const selectedCamera = cameras.find((cam) => cam.id === selectedCameraId);
    if (selectedCamera) {
      const link = document.createElement('a');
      link.href = selectedCamera.address;
      link.download = `${selectedCamera.name}_video.mp4`;
      link.click();

      // Insert notification
      insertNotification(
        selectedCamera.id,
        'downloaded',
        `Video downloaded for camera ${selectedCamera.name}.`
      );
    }
  };

  const selectedCamera = cameras.find((cam) => cam.id === selectedCameraId);

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : ''}`}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>LiveView Hub</h1>
          <p>Real-Time Camera Monitoring</p>
        </div>
        <div className={styles.buttons}>
          <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
            + Add Camera
          </button>
          <button className={styles.recordButton}>⏺ Record All</button>
        </div>
      </div>
      <div className={styles.mainContent}>
        {/* Camera Feed */}
        <div className={styles.cameraFeed}>
          {selectedCamera ? (
            <>
              <img
                ref={videoRef}
                src={selectedCamera.is_playing ? selectedCamera.address : 'https://via.placeholder.com/600x400?text=Paused'}
                alt={`${selectedCamera.name} Live Feed`}
                className={styles.feedImage}
              />
              <div className={styles.feedInfo}>
                <h2>{selectedCamera.name}</h2>
                <p className={styles.feedAddress}>{selectedCamera.address}</p>
                <div className={styles.feedControls}>
                  <button className={styles.controlButton} onClick={toggleFullScreen}>
                    Full Screen
                  </button>
                  <button className={styles.controlButton} onClick={takeScreenshot}>
                    Screenshot
                  </button>
                  <button className={styles.controlButton} onClick={handleDownload}>
                    Download
                  </button>
                  <button
                    className={styles.controlButton}
                    onClick={() => togglePlay(selectedCamera.id)}
                  >
                    {selectedCamera.is_playing ? 'Pause' : 'Play'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noCamera}>No Camera Selected</div>
          )}
        </div>

        {/* Camera List */}
        <div className={styles.cameraList}>
          <h3>Camera List</h3>
          {cameras.length === 0 ? (
            <p>No cameras added.</p>
          ) : (
            cameras.map((camera) => (
              <div
                key={camera.id}
                className={`${styles.cameraItem} ${
                  selectedCameraId === camera.id ? styles.selected : ''
                }`}
              >
                <img
                  src={camera.is_playing ? camera.address : 'https://via.placeholder.com/150x100?text=Paused'}
                  alt={camera.name}
                  className={styles.cameraThumbnail}
                  onClick={() => setSelectedCameraId(camera.id)}
                />
                <div className={styles.cameraInfo}>
                  <span>{camera.name}</span>
                  <div className={styles.cameraActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => {
                        setEditCamera(camera);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleDeleteCamera(camera.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Camera Modal */}
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Add New Camera</h2>
            <input
              type="text"
              placeholder="Camera Name"
              value={newCamera.name}
              onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Camera Address (URL/ID)"
              value={newCamera.address}
              onChange={(e) => setNewCamera({ ...newCamera, address: e.target.value })}
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleAddCamera} className={styles.modalButton}>
                Add
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.modalButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Camera Modal */}
      {isEditModalOpen && editCamera && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Edit Camera</h2>
            <input
              type="text"
              placeholder="Camera Name"
              value={editCamera.name}
              onChange={(e) =>
                setEditCamera({ ...editCamera, name: e.target.value })
              }
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Camera Address (URL/ID)"
              value={editCamera.address}
              onChange={(e) =>
                setEditCamera({ ...editCamera, address: e.target.value })
              }
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleEditCamera} className={styles.modalButton}>
                Save
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className={styles.modalButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;