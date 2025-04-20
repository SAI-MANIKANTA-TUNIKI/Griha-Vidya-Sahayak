// Weather.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from '../Pagesmodulecss/Weather.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeatherData {
  main: { temp: number; humidity: number; feels_like: number; pressure: number };
  wind: { speed: number; deg: number };
  weather: { description: string; icon: string }[];
  rain?: { '1h': number };
  name: string;
  dt: number;
  coord: { lat: number; lon: number };
}

interface ForecastData {
  dt: number;
  main: { temp: number };
  weather: { icon: string; description: string }[];
}

interface AQIData {
  list: { main: { aqi: number }; components: { [key: string]: number } }[];
}

interface WeatherProps {
  darkMode: boolean;
}

const Weather: React.FC<WeatherProps> = ({ darkMode }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [aqi, setAQI] = useState<AQIData | null>(null);
  const [city, setCity] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_URL_FORECAST = import.meta.env.VITE_API_URL_FORECAST;

  const fetchWeatherData = async (cityName: string) => {
    setLoading(true);
    setError(null);
    try {
      const weatherRes = await axios.get(`${API_URL}/weather`, {
        params: { q: cityName, appid: API_KEY, units: 'metric' },
      });
      const weatherData = weatherRes.data;
      setWeather(weatherData);

      const forecastRes = await axios.get(`${API_URL_FORECAST}`, {
        params: { q: cityName, appid: API_KEY, units: 'metric', cnt: 40 },
      });
      setForecast(forecastRes.data.list);

      const aqiRes = await axios.get(`${API_URL}/air_pollution`, {
        params: { lat: weatherData.coord.lat, lon: weatherData.coord.lon, appid: API_KEY },
      });
      setAQI(aqiRes.data);
    } catch {
      setError('Error fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLocationWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        try {
          const weatherRes = await axios.get(`${API_URL}/weather`, {
            params: { lat: coords.latitude, lon: coords.longitude, appid: API_KEY, units: 'metric' },
          });
          const weatherData = weatherRes.data;
          setWeather(weatherData);

          const forecastRes = await axios.get(`${API_URL_FORECAST}`, {
            params: { lat: coords.latitude, lon: coords.longitude, appid: API_KEY, units: 'metric', cnt: 40 },
          });
          setForecast(forecastRes.data.list);

          const aqiRes = await axios.get(`${API_URL}/air_pollution`, {
            params: { lat: coords.latitude, lon: coords.longitude, appid: API_KEY },
          });
          setAQI(aqiRes.data);
        } catch {
          setError('Unable to fetch location data.');
        }
      }, () => setError('Geolocation permission denied.'));
    } else {
      setError('Geolocation not supported by your browser.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city) fetchWeatherData(city);
  };

  useEffect(() => {
    getLocationWeather();
  }, []);

  const chartData = {
    labels: forecast.map(f =>
      new Date(f.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: forecast.map(f => f.main.temp),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.3)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const getAQICategory = (value: number) => {
    if (value <= 50) return 'Good';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Unhealthy for Sensitive Groups';
    if (value <= 200) return 'Unhealthy';
    if (value <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={darkMode ? styles.dark : styles.light}>
      <h1 className={styles.title}>Weather Dashboard</h1>
      <p className={styles.subtitle}>Get the latest weather updates</p>
      <div className={styles.container}>
        <form onSubmit={handleSearch} className={styles.searchBar}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>Search</button>
          <button type="button" onClick={getLocationWeather} className={styles.locationButton}>
          📍 My Location
          </button>
        </form>

        {weather && aqi && (
          <div className={styles.weatherDashboard}>
            <div className={styles.header}>
              <h1>{weather.name}</h1>
              <p>{new Date(weather.dt * 1000).toLocaleTimeString()}</p>
            </div>

            <div className={styles.mainWeather}>
              <div className={styles.temp}>
                <h2>{Math.round(weather.main.temp)}°C</h2>
                <p>{weather.weather[0].description}</p>
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                alt={weather.weather[0].description}
                className={styles.weatherIcon}
              />
            </div>

            <div className={styles.chartContainer}>
              <h3>Temperature Trend</h3>
              <Line data={chartData} />
            </div>

            <div className={styles.weatherDetails}>
              <div className={styles.card}>🌡️ <h3>Feels Like</h3><p>{Math.round(weather.main.feels_like)}°C</p></div>
              <div className={styles.card}>💧 <h3>Humidity</h3><p>{weather.main.humidity}%</p></div>
              <div className={styles.card}>💨 <h3>Wind</h3><p>{weather.wind.speed} km/h</p></div>
              <div className={styles.card}>📈 <h3>Pressure</h3><p>{weather.main.pressure} hPa</p></div>
              <div className={styles.card}>🌧️ <h3>Rain Chance</h3><p>{weather.rain?.['1h'] ? `${Math.round(weather.rain['1h'] * 100)}%` : 'Low'}</p></div>
              <div className={styles.card}>🌍 <h3>AQI</h3><p>{aqi.list[0].main.aqi} ({getAQICategory(aqi.list[0].main.aqi)})</p></div>
            </div>
             {/*slide cade I wante Horizontal on This Week lift to right side*/}
             <div className={styles.weeklyForecast}>
              <h2>This Week</h2>
              <div className={styles.forecastGridHorizontal}>
              <div className={styles.dayCard}>
                  <h4>Today</h4>
                  <p>Now: {Math.round(weather.main.temp)}°</p>
                </div>
                {forecast
                  .filter((_, index) => index % 8 === 0)
                  .slice(0, 6)
                  .map((day, index) => (
                    <div key={index} className={styles.dayCard}>
                      <h4>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</h4>
                      <p>{Math.round(day.main.temp)}°</p>
                      <img
                        src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                        alt={day.weather[0].description}
                        className={styles.weatherIcon}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;
