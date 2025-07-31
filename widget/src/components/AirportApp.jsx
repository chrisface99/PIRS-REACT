import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import FlightTable from './FlightTable';
import Ticker from './Ticker';
import WeatherService from '../services/WeatherService';
import FlightService from '../services/FlightService';
import { CONFIG, IATA_TO_CITY_MAPPING } from '../services/config';

const AirportApp = () => {
  // State management
  const [airportCode, setAirportCode] = useState('WAW');
  const [airportLocation, setAirportLocation] = useState('WARSAW');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({ 
    temp: 'Loading...', 
    condition: 'Loading...', 
    icon: '🌤️' 
  });
  const [flightData, setFlightData] = useState({ 
    departures: [], 
    arrivals: [] 
  });
  const [flightStatusUpdates, setFlightStatusUpdates] = useState([]);
  const [tickerConfig, setTickerConfig] = useState({
    userTicker: "Welcome to the Airport Flight Information System!",
    userTickerDirection: "left",
    showDefaultTicker: true,
    userTickerSpeed: 60,
    userTickerFrequency: 20
  });
  const [appConfig, setAppConfig] = useState({
    rowsCount: 15,
    template: 'flightScheduleMain'
  });

  // Service instances
  const weatherService = useRef(new WeatherService());
  const flightService = useRef(new FlightService());
  
  // Intervals
  const clockInterval = useRef(null);
  const dataRefreshInterval = useRef(null);
  const weatherRefreshInterval = useRef(null);

  // VXT message handler (must be outside setupVxtMessageListener for cleanup)
  const handleVxtMessage = (event) => {
    const { type, ...data } = event.data;
    switch (type) {
      case 'VXT_AIRPORT_UPDATE':
        setAirportCode(data.code);
        setAirportLocation(data.location);
        CONFIG.iataCodeCity = data.code;
        break;
      case 'VXT_TOKEN_UPDATE':
        CONFIG.AVIATIONSTACK_API_KEY = data.token;
        break;
      case 'VXT_CONFIG_UPDATE':
        handleConfigUpdate(data.config);
        break;
      default:
        break;
    }
  };

  // Initialize application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Start clock
        startClock();

        // Setup VXT message listener
        setupVxtMessageListener();

        // Update initial weather
        await updateWeather(airportLocation);

        // Update initial flight data
        await updateFlightData();

        // Setup refresh intervals
        setupRefreshIntervals();

        console.log("Airport Flight Information System initialized");
      } catch (error) {
        console.error("Failed to initialize Airport App:", error);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      if (clockInterval.current) clearInterval(clockInterval.current);
      if (dataRefreshInterval.current) clearInterval(dataRefreshInterval.current);
      if (weatherRefreshInterval.current) clearInterval(weatherRefreshInterval.current);
      window.removeEventListener('message', handleVxtMessage);
    };
  }, []);

  // Update weather when airport location changes
  useEffect(() => {
    updateWeather(airportLocation);
  }, [airportLocation]);

  // Update flight data when airport code changes
  useEffect(() => {
    updateFlightData();
  }, [airportCode]);

  const startClock = () => {
    const updateClock = () => {
      setCurrentTime(new Date());
    };
    
    updateClock(); // Initial update
    clockInterval.current = setInterval(updateClock, 1000);
  };

  const setupVxtMessageListener = () => {
    window.addEventListener('message', handleVxtMessage);
  };

  const handleConfigUpdate = (config) => {
    if (config.inputuserTickerText || config.userTickerDirection || 
        config.userTickerSpeed || config.userTickerFrequency || 
        config.showDefaultTicker !== undefined) {
      setTickerConfig(prev => ({
        ...prev,
        userTicker: config.inputuserTickerText || prev.userTicker,
        userTickerDirection: config.userTickerDirection || prev.userTickerDirection,
        userTickerSpeed: config.userTickerSpeed || prev.userTickerSpeed,
        userTickerFrequency: config.userTickerFrequency || prev.userTickerFrequency,
        showDefaultTicker: config.showDefaultTicker !== undefined ? 
          config.showDefaultTicker === "true" : prev.showDefaultTicker
      }));
    }
    
    if (config.rowsCount) {
      setAppConfig(prev => ({ ...prev, rowsCount: config.rowsCount }));
    }
    
    if (config.template) {
      setAppConfig(prev => ({ ...prev, template: config.template }));
    }
    
    if (config.Token) {
      CONFIG.AVIATIONSTACK_API_KEY = config.Token;
    }
    
    if (config.iataCodeCity) {
      const city = IATA_TO_CITY_MAPPING[config.iataCodeCity] || "UNKNOWN";
      setAirportCode(config.iataCodeCity);
      setAirportLocation(city);
      CONFIG.iataCodeCity = config.iataCodeCity;
    }
  };

  const updateWeather = async (location) => {
    try {
      const weatherData = await weatherService.current.fetchWeather(location);
      setWeather(weatherData);
    } catch (error) {
      console.error("Error updating weather:", error);
    }
  };

  const updateFlightData = async () => {
    try {
      flightService.current.updateFromConfig({ iataCodeCity: airportCode });
      
      const [departures, arrivals] = await Promise.all([
        flightService.current.fetchFlights('departure', airportCode),
        flightService.current.fetchArrivals()
      ]);
      
      setFlightData({ departures, arrivals });
      
      // Update flight status updates for ticker
      const updates = [];
      [...departures, ...arrivals].forEach(flight => {
        const type = flight.departure ? 'departure' : 'arrival';
        updates.push(generateFlightStatusUpdate(flight, type));
      });
      setFlightStatusUpdates(updates);
      
    } catch (error) {
      console.error("Error updating flight data:", error);
    }
  };

  const generateFlightStatusUpdate = (flight, type) => {
    const flightNumber = flight.flight?.iataNumber || flight.flight?.icaoNumber || 
                        flight.flight?.number || flight.flight?.iata || "N/A";
    const scheduledTime = new Date(flight[type]?.scheduledTime || flight[type]?.scheduled)
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    
    const cityIata = flight[type === "departure" ? "arrival" : "departure"]?.iataCode || 
                     flight[type === "departure" ? "arrival" : "departure"]?.iata || "Unknown";
    
    return `Flight ${flightNumber} ${type === "departure" ? "to" : "from"} ${cityIata} scheduled at ${scheduledTime}`;
  };

  const setupRefreshIntervals = () => {
    // Weather refresh interval
    weatherRefreshInterval.current = setInterval(async () => {
      if (airportLocation) {
        await updateWeather(airportLocation);
      }
    }, CONFIG.WEATHER_REFRESH_INTERVAL);

    // Flight data refresh interval
    dataRefreshInterval.current = setInterval(async () => {
      await updateFlightData();
    }, CONFIG.DATA_REFRESH_INTERVAL);
  };

  const shouldShowDepartures = appConfig.template === 'flightScheduleMain' || 
                              appConfig.template === 'flightScheduleDepartures';
  const shouldShowArrivals = appConfig.template === 'flightScheduleMain' || 
                            appConfig.template === 'flightScheduleArrivals';

  return (
    <div id="canvas-container">
      <Header 
        airportCode={airportCode}
        currentTime={currentTime}
        weather={weather}
      />
      
      <main>
        <div className="flights-container">
          {shouldShowDepartures && (
            <FlightTable
              type="departures"
              flights={flightData.departures}
              airportLocation={airportLocation}
              rowsCount={appConfig.rowsCount}
              flightService={flightService.current}
            />
          )}
          
          {shouldShowArrivals && (
            <FlightTable
              type="arrivals"
              flights={flightData.arrivals}
              airportLocation={airportLocation}
              rowsCount={appConfig.rowsCount}
              flightService={flightService.current}
            />
          )}
        </div>
      </main>
      
      <Ticker 
        config={tickerConfig}
        flightStatusUpdates={flightStatusUpdates}
      />
    </div>
  );
};

export default AirportApp;