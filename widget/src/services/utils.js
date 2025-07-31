// widget/src/services/utils.js
import { IATA_CITY_MAPPING } from "./config.js";

export function getCityNameFromIATA(iata) {
  const mapping = IATA_CITY_MAPPING.find((entry) => entry.iata === iata);
  return mapping ? mapping.city : "Unknown City";
}

export function formatFlightTime(dateString, useUTC = false) {
  const date = new Date(dateString);
  if (useUTC) {
    // Always show UTC time
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC"
    });
  } else {
    // Show local time
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
}

export function isUpcomingFlight(flightTime, isArrival = false) {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  const flightDateTime = new Date(flightTime);
  const flightHour = flightDateTime.getHours();
  const flightMinutes = flightDateTime.getMinutes();

  return (
    flightHour > currentHour ||
    (flightHour === currentHour && flightMinutes >= currentMinutes)
  );
}

export function sortFlightsByTime(flights, timeField) {
  return flights.sort((a, b) => {
    const timeA = new Date(a[timeField].scheduled);
    const timeB = new Date(b[timeField].scheduled);
    return timeA - timeB;
  });
}

export function generateRandomGate() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 7));
  const number = Math.floor(Math.random() * 20) + 1;
  return `${letter}${number}`;
}

export function getRandomFlightStatus() {
  const statusOptions = ["On Time", "Boarding", "Delayed", "Cancelled"];
  const statusClasses = ["on-time", "boarding", "delayed", "cancelled"];
  const randomIndex = Math.floor(Math.random() * statusOptions.length);

  return {
    status: statusOptions[randomIndex],
    statusClass: statusClasses[randomIndex],
  };
}