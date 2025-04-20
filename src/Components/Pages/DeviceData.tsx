import React, { JSX, useState, useEffect } from 'react';
import styles from '../Pagesmodulecss/DeviceData.module.css';
import { FaEllipsisH} from 'react-icons/fa';
import { WiHumidity, WiThermometer } from 'react-icons/wi';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface Device {
  id: string;
  name: string;
  status: boolean;
  icon: JSX.Element;
  image: string;
}

interface Room {
  id: string;
  name: string;
  temperature: string;
  humidity: string;
  devices: Device[];
  image: string;
}

interface DeviceDataProps {
  darkMode: boolean;
}

const DeviceData: React.FC<DeviceDataProps> = ({ darkMode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomImage, setNewRoomImage] = useState<File | null>(null);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [newDeviceName, setNewDeviceName] = useState<string>('');
  const [newDeviceImage, setNewDeviceImage] = useState<File | null>(null);


  useEffect(() => {
    fetchData();

    const deviceSubscription = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        handleDeviceUpdate
      )
      .subscribe();

    const tempSubscription = supabase
      .channel('temperature-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'temperature_data' },
        handleTempUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deviceSubscription);
      supabase.removeChannel(tempSubscription);
    };
  }, []);

  const fetchData = async () => {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(
        `id, name, image_url, devices ( device_id, type, image_url, is_on )`
      );

    if (roomError) {
      console.error('Error fetching rooms:', roomError);
      return;
    }

    const { data: tempData, error: tempError } = await supabase
      .from('temperature_data')
      .select('room_id, temperature, humidity, recorded_at')
      .order('recorded_at', { ascending: false });

    if (tempError) {
      console.error('Error fetching temperature data:', tempError);
      return;
    }

    const formattedRooms: Room[] = roomData.map((room: any) => {
      const latestTemp = tempData.find((t: any) => t.room_id === room.id);
      return {
        id: room.id,
        name: room.name,
        temperature: latestTemp ? `${latestTemp.temperature}°C` : 'N/A',
        humidity: latestTemp ? `${latestTemp.humidity}%` : 'N/A',
        image: room.image_url || 'https://source.unsplash.com/200x200/?room',
        devices: room.devices.map((device: any) => ({
          id: device.device_id,
          name: device.type,
          status: device.is_on,
          
          image:
            device.image_url ||
            'https://source.unsplash.com/200x200/?device',
        })),
      };
    });

    setRooms(formattedRooms);
  };

  const handleDeviceUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE') {
      const updatedDevice = payload.new;
      setRooms((prevRooms) =>
        prevRooms.map((room) => ({
          ...room,
          devices: room.devices.map((device) =>
            device.id === updatedDevice.device_id
              ? { ...device, status: updatedDevice.is_on }
              : device
          ),
        }))
      );
    }
  };

  const handleTempUpdate = (payload: any) => {
    if (
      payload.eventType === 'INSERT' ||
      payload.eventType === 'UPDATE'
    ) {
      const updatedTemp = payload.new;
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === updatedTemp.room_id
            ? {
                ...room,
                temperature: `${updatedTemp.temperature}°C`,
                humidity: `${updatedTemp.humidity}%`,
              }
            : room
        )
      );
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room.id);
    setNewRoomName(room.name);
    setNewRoomImage(null);
  };

  const handleSaveRoom = async (roomId: string) => {
    let imageUrl =
      rooms.find((r) => r.id === roomId)?.image ||
      'https://source.unsplash.com/200x200/?room';

    if (newRoomImage) {
      const filePath = `${roomId}/room-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('device-dashboard-images')
        .upload(filePath, newRoomImage);

      if (uploadError) {
        console.error('Error uploading room image:', uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('device-dashboard-images')
        .getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from('rooms')
      .update({ name: newRoomName, image_url: imageUrl })
      .eq('id', roomId);

    if (error) {
      console.error('Error updating room:', error);
      return;
    }

    setEditingRoom(null);
    await fetchData();
  };

  const handleEditDevice = (roomId: string, deviceId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    const device = room?.devices.find((d) => d.id === deviceId);
    if (device) {
      setEditingDevice(device.id);
      setNewDeviceName(device.name);
      setNewDeviceImage(null);
    }
  };

  const handleSaveDevice = async (roomId: string, deviceId: string) => {
    let imageUrl =
      rooms
        .find((r) => r.id === roomId)
        ?.devices.find((d) => d.id === deviceId)?.image || '';

    if (newDeviceImage) {
      const filePath = `${roomId}/${deviceId}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('device-dashboard-images')
        .upload(filePath, newDeviceImage);

      if (uploadError) {
        console.error('Error uploading device image:', uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('device-dashboard-images')
        .getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from('devices')
      .update({ type: newDeviceName, image_url: imageUrl })
      .eq('device_id', deviceId);

    if (error) {
      console.error('Error updating device:', error);
      return;
    }

    setEditingDevice(null);
    await fetchData();
  };

  return (
    <div className={`${styles.container} ${darkMode ? styles.darkMode : ''}`}>
      <h1 className={styles.title}>Monitoring Room Device Data</h1>
      {rooms.map((room) => (
        <div key={room.id} className={styles.roomContainer}>
          <div className={styles.roomHeader}>
            {editingRoom === room.id ? (
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className={styles.input}
              />
            ) : (
              <h2 className={styles.roomTitle}>{room.name}</h2>
            )}
            <FaEllipsisH
              className={styles.editIcon}
              onClick={() => handleEditRoom(room)}
            />
          </div>

          <div className={styles.roomImageContainer}>
            <img
              src={room.image}
              alt={room.name}
              className={styles.roomImage}
            />
            {editingRoom === room.id && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files && setNewRoomImage(e.target.files[0])
                }
                className={styles.input}
              />
            )}
          </div>

          {editingRoom === room.id && (
            <button
              className={styles.saveButton}
              onClick={() => handleSaveRoom(room.id)}
            >
              Save
            </button>
          )}

          <div className={styles.statusContainer}>
            <div className={styles.statusBox}>
              <WiThermometer className={styles.icon} />
              <p>Temperature: {room.temperature}</p>
            </div>
            <div className={styles.statusBox}>
              <WiHumidity className={styles.icon} />
              <p>Humidity: {room.humidity}</p>
            </div>
          </div>

          <div className={styles.devicesGrid}>
            {room.devices.map((device) => (
              <div
                key={device.id}
                className={`${styles.deviceCard} ${
                  device.status ? styles.on : styles.off
                }`}
              >
                {editingDevice === device.id ? (
                  <>
                    <input
                      type="text"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      className={styles.input}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files && setNewDeviceImage(e.target.files[0])
                      }
                      className={styles.input}
                    />
                    <button
                      className={styles.saveButton}
                      onClick={() => handleSaveDevice(room.id, device.id)}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <img
                      src={device.image}
                      alt={device.name}
                      className={styles.deviceImage}
                    />
                    <div className={styles.deviceInfo}>
                      {device.icon}
                      <p>
                        {device.name}: {device.status ? 'ON' : 'OFF'}
                      </p>
                    </div>
                    <FaEllipsisH
                      className={styles.editIcon}
                      onClick={() => handleEditDevice(room.id, device.id)}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceData;
