import React, { useState, useEffect } from "react";
import ToggleSwitch from "../Toggleswitch/Toggleswitch";
import styles from "../Pagesmodulecss/RoomControl.module.css";
import { motion } from "framer-motion";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DeviceConfig {
  type: string;
  id: string;
  image_url: string;
  is_on: boolean;
}

interface RoomConfig {
  id: string;
  name: string;
  image_url: string;
  devices: DeviceConfig[];
}

interface DeviceState {
  [key: string]: { checked: boolean };
}

interface NewDevice {
  type: string;
  id: string;
  image_url: string | File | null;
}

interface OfficeRoomProps {
  darkMode: boolean;
}

// Interface for schedule
interface DeviceSchedule {
  device_id: string;
  on_time: string | null; // ISO string (e.g., "2025-04-15T08:00:00")
  off_time: string | null; // ISO string
}

const RoomControl: React.FC<OfficeRoomProps> = ({ darkMode }) => {
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomConfig | null>(null);
  const [devices, setDevices] = useState<DeviceState>({});
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [newDevice, setNewDevice] = useState<NewDevice>({
    type: '',
    id: '',
    image_url: null
  });
  const [newRoomName, setNewRoomName] = useState('');
  const [profitData, setProfitData] = useState(0);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  // New state for scheduling
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<DeviceSchedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<{
    on_time: string;
    off_time: string;
  }>({ on_time: '', off_time: '' });

  useEffect(() => {
    fetchRooms();
    fetchSchedules();
    const subscription = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices'
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    const onCount = Object.values(devices).filter(device => device.checked).length;
    setProfitData(onCount);
  }, [devices]);

  // New effect to handle automatic ON/OFF based on schedules
  useEffect(() => {
    const checkSchedules = async () => {
      const now = new Date();
      for (const schedule of schedules) {
        if (schedule.on_time && new Date(schedule.on_time) <= now && !devices[schedule.device_id]?.checked) {
          await handleToggle(schedule.device_id);
        }
        if (schedule.off_time && new Date(schedule.off_time) <= now && devices[schedule.device_id]?.checked) {
          await handleToggle(schedule.device_id);
        }
      }
    };

    const interval = setInterval(checkSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [schedules, devices]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        devices (
          id,
          type,
          device_id,
          image_url,
          is_on
        )
      `);
    if (error) {
      console.error('Error fetching rooms:', error);
      return;
    }
    const formattedRooms: RoomConfig[] = data.map((room: any) => ({
      id: room.id,
      name: room.name,
      image_url: room.image_url,
      devices: room.devices.map((device: any) => ({
        type: device.type,
        id: device.device_id,
        image_url: device.image_url,
        is_on: device.is_on
      }))
    }));
    setRooms(formattedRooms);
    if (formattedRooms.length > 0 && !currentRoom) {
      setCurrentRoom(formattedRooms[0]);
      setDevices(formattedRooms[0].devices.reduce((acc: DeviceState, device: DeviceConfig) => {
        acc[device.id] = { checked: device.is_on };
        return acc;
      }, {}));
    }
  };

  // New function to fetch schedules
  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*');
    if (error) {
      console.error('Error fetching schedules:', error);
      return;
    }
    setSchedules(data.map((schedule: any) => ({
      device_id: schedule.device_id,
      on_time: schedule.on_time,
      off_time: schedule.off_time
    })));
  };

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE' && currentRoom) {
      const updatedDevice = payload.new;
      if (updatedDevice.room_id === currentRoom.id) {
        setDevices(prev => ({
          ...prev,
          [updatedDevice.device_id]: { checked: updatedDevice.is_on }
        }));
        setCurrentRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            devices: prev.devices.map(device =>
              device.id === updatedDevice.device_id
                ? { ...device, is_on: updatedDevice.is_on }
                : device
            )
          };
        });
      }
    }
  };

  const handleToggle = async (deviceId: string) => {
    const updatedChecked = !devices[deviceId]?.checked;
    setDevices(prev => ({
      ...prev,
      [deviceId]: { checked: updatedChecked },
    }));
    const { error } = await supabase
      .from('devices')
      .update({ is_on: updatedChecked })
      .eq('device_id', deviceId);
    if (error) {
      console.error('Error updating device state:', error);
      setDevices(prev => ({
        ...prev,
        [deviceId]: { checked: !updatedChecked },
      }));
    }
  };

  // New function to open schedule modal
  const handleOpenScheduleModal = (deviceId: string) => {
    setCurrentDeviceId(deviceId);
    const existingSchedule = schedules.find(s => s.device_id === deviceId);
    setNewSchedule({
      on_time: existingSchedule?.on_time ? new Date(existingSchedule.on_time).toISOString().slice(0, 16) : '',
      off_time: existingSchedule?.off_time ? new Date(existingSchedule.off_time).toISOString().slice(0, 16) : ''
    });
    setIsScheduleModalOpen(true);
  };

  // New function to save schedule
  const handleSaveSchedule = async () => {
    if (!currentDeviceId) return;
    
    const scheduleData = {
      device_id: currentDeviceId,
      on_time: newSchedule.on_time ? new Date(newSchedule.on_time).toISOString() : null,
      off_time: newSchedule.off_time ? new Date(newSchedule.off_time).toISOString() : null
    };

    const existingSchedule = schedules.find(s => s.device_id === currentDeviceId);
    
    let error;
    if (existingSchedule) {
      // Update existing schedule
      ({ error } = await supabase
        .from('schedules')
        .update(scheduleData)
        .eq('device_id', currentDeviceId));
    } else {
      // Insert new schedule
      ({ error } = await supabase
        .from('schedules')
        .insert(scheduleData));
    }

    if (error) {
      console.error('Error saving schedule:', error);
      return;
    }

    await fetchSchedules();
    setIsScheduleModalOpen(false);
    setCurrentDeviceId(null);
    setNewSchedule({ on_time: '', off_time: '' });
  };

  const handleTurnOffAllDevices = async () => {
    if (!currentRoom) return;
    const updatedDevices = Object.keys(devices).reduce((acc, key) => {
      acc[key] = { checked: false };
      return acc;
    }, {} as DeviceState);
    setDevices(updatedDevices);
    const { error } = await supabase
      .from('devices')
      .update({ is_on: false })
      .eq('room_id', currentRoom.id);
    if (error) {
      console.error('Error turning off all devices:', error);
      await fetchRooms();
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!currentRoom) return;
    if (!window.confirm('Are you sure you want to remove this device?')) return;
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('device_id', deviceId);
    if (error) {
      console.error('Error removing device:', error);
      return;
    }
    setDevices(prev => {
      const newDevices = { ...prev };
      delete newDevices[deviceId];
      return newDevices;
    });
    // Remove associated schedule
    await supabase
      .from('schedules')
      .delete()
      .eq('device_id', deviceId);
    await fetchRooms();
    await fetchSchedules();
  };

  const handleRemoveRoom = async () => {
    if (!currentRoom) return;
    if (!window.confirm('Are you sure you want to remove this room and all its devices?')) return;
    const { error: devicesError } = await supabase
      .from('devices')
      .delete()
      .eq('room_id', currentRoom.id);
    if (devicesError) {
      console.error('Error removing devices:', devicesError);
      return;
    }
    const { error: roomError } = await supabase
      .from('rooms')
      .delete()
      .eq('id', currentRoom.id);
    if (roomError) {
      console.error('Error removing room:', roomError);
      return;
    }
    // Remove associated schedules
    await supabase
      .from('schedules')
      .delete()
      .in('device_id', currentRoom.devices.map(d => d.id));
    setCurrentRoom(null);
    await fetchRooms();
    await fetchSchedules();
  };

  const handleEditRoom = async () => {
    if (!currentRoom || !newRoomName.trim()) return;
    const { error } = await supabase
      .from('rooms')
      .update({ name: newRoomName })
      .eq('id', currentRoom.id);
    if (error) {
      console.error('Error updating room:', error);
      return;
    }
    setNewRoomName('');
    setIsEditRoomModalOpen(false);
    await fetchRooms();
  };

  const handleAddDevice = async () => {
    if (!newDevice.type || !newDevice.id || !newDevice.image_url || !currentRoom) return;
    let imageUrl: string;
    if (newDevice.image_url instanceof File) {
      const file = newDevice.image_url;
      const filePath = `${currentRoom.id}/${newDevice.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('device-images')
        .upload(filePath, file);
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from('device-images')
        .getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    } else {
      imageUrl = newDevice.image_url as string;
    }
    const { error } = await supabase
      .from('devices')
      .insert({
        room_id: currentRoom.id,
        type: newDevice.type,
        device_id: newDevice.id,
        image_url: imageUrl,
        is_on: false
      });
    if (error) {
      console.error('Error adding device:', error);
      return;
    }
    setDevices(prev => ({
      ...prev,
      [newDevice.id]: { checked: false },
    }));
    setNewDevice({ type: '', id: '', image_url: null });
    setIsAddDeviceModalOpen(false);
    await fetchRooms();
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    const { error } = await supabase
      .from('rooms')
      .insert({
        name: newRoomName,
        image_url: '/images/default-room.jpg'
      })
      .select()
      .single();
    if (error) {
      console.error('Error adding room:', error);
      return;
    }
    setNewRoomName('');
    setIsAddRoomModalOpen(false);
    await fetchRooms();
  };

  const handleRoomSwitch = (roomId: string) => {
    const selectedRoom = rooms.find(room => room.id === roomId);
    if (selectedRoom) {
      setCurrentRoom(selectedRoom);
      setDevices(selectedRoom.devices.reduce((acc: DeviceState, device: DeviceConfig) => {
        acc[device.id] = { checked: device.is_on };
        return acc;
      }, {}));
    }
  };

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>, deviceId: string) => {
    const newName = e.target.value;
    const { error } = await supabase
      .from('devices')
      .update({ type: newName })
      .eq('device_id', deviceId);
    if (error) console.error('Error updating device name:', error);
    await fetchRooms();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, deviceId: string) => {
    if (!e.target.files || !currentRoom) return;
    const file = e.target.files[0];
    const filePath = `${currentRoom.id}/${deviceId}-${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from('device-images')
      .upload(filePath, file);
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return;
    }
    const { data: publicUrlData } = supabase.storage
      .from('device-images')
      .getPublicUrl(filePath);
    const { error: updateError } = await supabase
      .from('devices')
      .update({ image_url: publicUrlData.publicUrl })
      .eq('device_id', deviceId);
    if (updateError) console.error('Error updating image URL:', updateError);
    await fetchRooms();
  };

  const handleEditButtonClick = (deviceId: string) => {
    setEditMode(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  useEffect(() => {
    const checkSchedules = async () => {
      const now = new Date();
      for (const schedule of schedules) {
        if (schedule.on_time && new Date(schedule.on_time) <= now && !devices[schedule.device_id]?.checked) {
          await handleToggle(schedule.device_id);
        }
        if (schedule.off_time && new Date(schedule.off_time) <= now && devices[schedule.device_id]?.checked) {
          await handleToggle(schedule.device_id);
        }
      }
    };
  
    const interval = setInterval(checkSchedules, 60000);
    return () => clearInterval(interval);
  }, [schedules, devices]);

  return (
    <div className={darkMode ? styles.darkMode : styles.lightMode}>
      <div className={styles.switchesContainer}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>{currentRoom?.name || 'Select a Room'} Control</h1>
            {currentRoom && (
              <div className={styles.roomHeaderControls}>
                <button
                  onClick={() => {
                    setNewRoomName(currentRoom.name);
                    setIsEditRoomModalOpen(true);
                  }}
                  className={styles.editButton}
                >
                  Edit Room
                </button>
                <button
                  onClick={handleRemoveRoom}
                  className={styles.removeButton}
                >
                  Remove Room
                </button>
              </div>
            )}
          </div>
          <div className={styles.roomSwitchButtons}>
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => handleRoomSwitch(room.id)}
                className={currentRoom?.id === room.id ? styles.activeRoom : ''}
              >
                {room.name}
              </button>
            ))}
          </div>
        </header>

        {currentRoom && (
          <div className={styles.devicesGrid}>
            {currentRoom.devices.map((device, i) => (
              <motion.div
                key={i}
                className={styles.deviceCard}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.deviceInfo}>
                  <div className={styles.deviceImage}>
                    <img
                      src={device.image_url}
                      alt={device.type}
                      className={styles.deviceImageStyle}
                    />
                  </div>
                  <div className={styles.deviceName}>
                    {editMode[device.id] ? (
                      <div className={styles.editDeviceControls}>
                        <input
                          type="text"
                          value={device.type}
                          onChange={(e) => handleNameChange(e, device.id)}
                          className={styles.inputName}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, device.id)}
                          className={styles.inputImage}
                        />
                        <button
                          onClick={() => handleRemoveDevice(device.id)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span>{device.type}</span>
                    )}
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditButtonClick(device.id)}
                    >
                      <span className={styles.threeDots}>...</span>
                    </button>
                  </div>
                </div>
                <div className={styles.deviceStatus}>
                  <ToggleSwitch
                    id={device.id}
                    checked={devices[device.id]?.checked || false}
                    onChange={() => handleToggle(device.id)}
                  />
                  <button
                    onClick={() => handleOpenScheduleModal(device.id)}
                    className={styles.scheduleButton}
                    style={{ marginLeft: '3px', padding: '2px 5px' }}
                  >
                    Schedule
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {currentRoom && (
          <button
            onClick={() => setIsAddDeviceModalOpen(true)}
            className={styles.addButton}
          >
            Add New Device
          </button>
        )}
        <button
          onClick={() => setIsAddRoomModalOpen(true)}
          className={styles.addButton}
        >
          Add New Room
        </button>

        {/* Add Device Modal */}
        {isAddDeviceModalOpen && currentRoom && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Add New Device</h2>
              <input
                type="text"
                placeholder="Device Name"
                value={newDevice.type}
                onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                className={styles.inputName}
              />
              <input
                type="text"
                placeholder="Device ID"
                value={newDevice.id}
                onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value })}
                className={styles.inputName}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setNewDevice({
                  ...newDevice,
                  image_url: e.target.files[0]
                })}
                className={styles.inputImage}
              />
              <div className={styles.modalButtons}>
                <button onClick={handleAddDevice} className={styles.addButton}>
                  Add Device
                </button>
                <button
                  onClick={() => setIsAddDeviceModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Room Modal */}
        {isAddRoomModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Add New Room</h2>
              <input
                type="text"
                placeholder="New Room Name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className={styles.inputName}
              />
              <div className={styles.modalButtons}>
                <button onClick={handleAddRoom} className={styles.addButton}>
                  Add Room
                </button>
                <button
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Room Modal */}
        {isEditRoomModalOpen && currentRoom && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Edit Room Name</h2>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className={styles.inputName}
              />
              <div className={styles.modalButtons}>
                <button onClick={handleEditRoom} className={styles.addButton}>
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditRoomModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {isScheduleModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Schedule Device</h2>
              <label>
                Turn ON Time:
                <input
                  type="datetime-local"
                  value={newSchedule.on_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, on_time: e.target.value })}
                  className={styles.inputName}
                />
              </label>
              <label>
                Turn OFF Time:
                <input
                  type="datetime-local"
                  value={newSchedule.off_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, off_time: e.target.value })}
                  className={styles.inputName}
                />
              </label>
              <div className={styles.modalButtons}>
                <button onClick={handleSaveSchedule} className={styles.addButton}>
                  Save Schedule
                </button>
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {currentRoom && (
          <div className={styles.controls}>
            <button className={styles.turnOffAll} onClick={handleTurnOffAllDevices}>
              Turn Off All Devices
            </button>
            <p className={styles.deviceStatusText}>Devices On: {profitData}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomControl;