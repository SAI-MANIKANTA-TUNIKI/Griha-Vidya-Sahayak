import React, { useState } from 'react';
import { SketchPicker } from 'react-color'; // For color wheel
import styles from '../Pagesmodulecss/StripLed.module.css';

interface LedStripProps {
    darkMode: boolean;
  }
  
const LedStrip: React.FC<LedStripProps> = ({ darkMode }) => {
  const [color, setColor] = useState({ r: 255, g: 0, b: 0, a: 1 });
  const [brightness, setBrightness] = useState(100);
  const [intensity, setIntensity] = useState(50);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [power, setPower] = useState(true);
  const [mode, setMode] = useState('Custom');
  const [customModes, setCustomModes] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<string>('');

  // Preset Modes
  const presetModes = [
    'Custom', 'Bright', 'Dimmed', 'Gradient', 'Party', 'Disco',
    'Romantic', 'Reading', 'Nightlight'
  ];

  // Handle color change from picker
  const handleColorChange = (color: any) => {
    setColor(color.rgb);
  };

  // Convert RGB to Hex
  const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };

  // Handle Hex input
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      setColor({ r, g, b, a: 1 });
    }
  };

  // Save custom mode
  const saveCustomMode = () => {
    const newMode = `Custom_${customModes.length + 1}`;
    setCustomModes([...customModes, newMode]);
    setMode(newMode);
  };

  // Apply preset mode
  const applyPresetMode = (selectedMode: string) => {
    setMode(selectedMode);
    switch (selectedMode) {
      case 'Bright':
        setBrightness(100);
        setIntensity(100);
        break;
      case 'Dimmed':
        setBrightness(20);
        setIntensity(30);
        break;
      case 'Romantic':
        setColor({ r: 255, g: 105, b: 180, a: 1 });
        setBrightness(40);
        break;
      // Add more mode logic as needed
      default:
        break;
    }
  };

  // Virtual LED strip style
  const ledStripStyle = {
    backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness / 100})`,
    filter: `saturate(${saturation}%) brightness(${lightness}%)`,
  };

  return (
    <div className={darkMode ? styles.darkContainer : styles.lightContainer}>
    <div className={styles.container}>
      {/* Header */}
      <h1 className={styles.title}>LED Strip Control</h1>

      {/* Master Switch */}
      <div className={styles.powerSwitch}>
        <label>Power: </label>
        <input
          type="checkbox"
          checked={power}
          onChange={() => setPower(!power)}
        />
      </div>

      {/* Virtual LED Strip Preview */}
      <div className={styles.ledPreview} style={power ? ledStripStyle : { backgroundColor: '#000' }} />

      {/* Control Panel */}
      {power && (
        <div className={styles.controlPanel}>
          {/* Color Control */}
          <section className={styles.section}>
            <h2>Color Control</h2>
            <div className={styles.colorControls}>
              <SketchPicker color={color} onChange={handleColorChange} />
              <div className={styles.sliders}>
                <label>R: <input type="range" min="0" max="255" value={color.r} onChange={(e) => setColor({ ...color, r: +e.target.value })} /></label>
                <label>G: <input type="range" min="0" max="255" value={color.g} onChange={(e) => setColor({ ...color, g: +e.target.value })} /></label>
                <label>B: <input type="range" min="0" max="255" value={color.b} onChange={(e) => setColor({ ...color, b: +e.target.value })} /></label>
                <label>Hex: <input type="text" value={rgbToHex(color)} onChange={handleHexChange} /></label>
              </div>
            </div>
          </section>

          {/* Brightness and Intensity */}
          <section className={styles.section}>
            <h2>Brightness & Intensity</h2>
            <label>Brightness: <input type="range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(+e.target.value)} /></label>
            <label>Intensity: <input type="range" min="0" max="100" value={intensity} onChange={(e) => setIntensity(+e.target.value)} /></label>
          </section>

          {/* Saturation and Lightness */}
          <section className={styles.section}>
            <h2>Saturation & Lightness</h2>
            <label>Saturation: <input type="range" min="0" max="100" value={saturation} onChange={(e) => setSaturation(+e.target.value)} /></label>
            <label>Lightness: <input type="range" min="0" max="100" value={lightness} onChange={(e) => setLightness(+e.target.value)} /></label>
          </section>

          {/* Preset Modes */}
          <section className={styles.section}>
            <h2>Preset Modes</h2>
            <div className={styles.modeButtons}>
              {presetModes.map((m) => (
                <button key={m} onClick={() => applyPresetMode(m)} className={mode === m ? styles.activeMode : ''}>
                  {m}
                </button>
              ))}
              {customModes.map((m) => (
                <button key={m} onClick={() => setMode(m)} className={mode === m ? styles.activeMode : ''}>
                  {m}
                </button>
              ))}
              <button onClick={saveCustomMode}>Save Custom</button>
            </div>
          </section>

          {/* Advanced Features */}
          <section className={styles.section}>
            <h2>Advanced Features</h2>
            <div>
              <label>Scheduling: <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g., 18:00 On" /></label>
              <p>Music Sync: <button disabled>Enable (Requires Microphone)</button></p>
              <p>Voice Control: <button disabled>Connect Assistant</button></p>
              <p>Remote Access: <button disabled>Link App</button></p>
              <p>Energy: Simulated 5W usage</p>
            </div>
          </section>
        </div>
      )}
    </div>
  </div>
  );
};

export default LedStrip;
