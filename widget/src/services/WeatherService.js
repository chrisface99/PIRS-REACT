import { CONFIG } from "./config.js";

class WeatherService {
  constructor() {
    this.weatherCache = {};
  }

  async fetchWeather(city) {
    const now = Date.now();

    if (
      this.weatherCache[city] &&
      now - this.weatherCache[city].timestamp < CONFIG.WEATHER_CACHE_TTL
    ) {
      return this.weatherCache[city].data;
    }

    try {
      const response = await fetch(
        `${CONFIG.OPENWEATHER_URL}${city}&appid=${CONFIG.OPENWEATHER_API_KEY}`
      );
      const data = await response.json();

      if (data.main && data.weather) {
        const weatherData = {
          temp: `${Math.round(data.main.temp)}°C`,
          condition: data.weather[0].main,
          icon: this.getWeatherIcon(data.weather[0].main.toLowerCase())
        };

        this.weatherCache[city] = { data: weatherData, timestamp: now };
        return weatherData;
      }
    } catch (error) {
      console.error(`Error fetching weather for ${city}:`, error);
    }

    return { temp: "N/A", condition: "Loading...", icon: "🌤️" };
  }

  getWeatherIcon(weatherCondition) {
    if (weatherCondition.includes("clear")) return "☀️";
    if (weatherCondition.includes("cloud")) return "☁️";
    if (weatherCondition.includes("rain") || weatherCondition.includes("drizzle")) return "🌧️";
    if (weatherCondition.includes("snow")) return "❄️";
    if (weatherCondition.includes("thunderstorm")) return "⛈️";
    return "🌤️";
  }
}

export default WeatherService;