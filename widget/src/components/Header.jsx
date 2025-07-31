// widget/src/components/Header.jsx
import React from 'react';

const Header = ({ airportCode, currentTime, weather }) => {
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date) => {
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return { day, dateStr };
  };

  const { day, dateStr } = formatDate(currentTime);

  return (
    <header>
      <div className="header-left">
        <div id="airport-code">{airportCode}</div>
      </div>
      <div className="header-center">
        <div id="current-time">{formatTime(currentTime)}</div>
        <div id="date-info">
          <span id="current-day">{day}</span>
          <span id="current-date">{dateStr}</span>
        </div>
      </div>
      <div className="header-right">
        <div className="weather-display">
          <span className="weather-icon">{weather.icon}</span>
          <span id="current-temp">{weather.temp}</span>
          <span id="weather-condition">{weather.condition}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;