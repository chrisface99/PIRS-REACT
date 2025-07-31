// widget/src/components/FlightTable.jsx
import React, { useState, useEffect } from 'react';
import { 
  getCityNameFromIATA, 
  formatFlightTime, 
  isUpcomingFlight, 
  sortFlightsByTime 
} from '../services/utils';

const FlightTable = ({ type, flights, airportLocation, rowsCount, flightService }) => {
  const [processedFlights, setProcessedFlights] = useState([]);
  const [airlineIcons, setAirlineIcons] = useState({});

  useEffect(() => {
    processFlights();
  }, [flights, rowsCount, type]);

  const processFlights = async () => {
    if (!flights || flights.length === 0) {
      setProcessedFlights([]);
      return;
    }

    let workingFlights = [...flights];

    if (type === 'departures') {
      // Filter upcoming flights for departures
      let upcomingFlights = workingFlights.filter((flight) =>
        isUpcomingFlight(flight.departure?.scheduledTime || flight.departure?.scheduled)
      );

      if (upcomingFlights.length === 0) {
        upcomingFlights = [...workingFlights];
      }

      workingFlights = sortFlightsByTime(upcomingFlights, "departure");
    } else {
      // Filter and sort arrivals
      const now = Date.now();
      workingFlights = workingFlights
        .filter(f => {
          if (!f.arrival || !f.arrival.scheduled) return false;
          const sched = new Date(f.arrival.scheduled).getTime();
          return sched >= now;
        })
        .sort((a, b) => {
          const tA = new Date(a.arrival.scheduled).getTime();
          const tB = new Date(b.arrival.scheduled).getTime();
          return tA - tB;
        });
    }

    // Remove duplicates and limit rows
    const uniqueFlights = [];
    const seenFlightNo = new Set();

    for (const flight of workingFlights) {
      if (uniqueFlights.length >= rowsCount) break;
      
      const flightNumber = flight.flight?.iataNumber || flight.flight?.iata || 
                          flight.flight?.icaoNumber || flight.flight?.number;
      
      if (seenFlightNo.has(flightNumber?.toUpperCase()) || !!flight.codeshared) continue;
      
      uniqueFlights.push(flight);
      if (flightNumber) {
        seenFlightNo.add(flightNumber.toUpperCase());
      }
    }

    setProcessedFlights(uniqueFlights);

    // Fetch airline icons
    const iconPromises = uniqueFlights.map(async (flight) => {
      const airlineCode = flight.airline?.iataCode || flight.airline?.iata || "XX";
      if (!airlineIcons[airlineCode]) {
        const icon = await flightService.fetchAirlineIcon(airlineCode);
        return { [airlineCode]: icon };
      }
      return null;
    });

    const iconResults = await Promise.all(iconPromises);
    const newIcons = iconResults.reduce((acc, result) => {
      if (result) Object.assign(acc, result);
      return acc;
    }, {});

    setAirlineIcons(prev => ({ ...prev, ...newIcons }));
  };

  const renderFlightRow = (flight, index) => {
    const isDeparture = type === 'departures';
    const flightData = isDeparture ? flight.departure : flight.arrival;
    const destinationData = isDeparture ? flight.arrival : flight.departure;

    const flightTime = formatFlightTime(
      flightData?.scheduledTime || flightData?.scheduled, 
      !isDeparture
    );
    
    const estimatedTime = flightData?.estimatedTime || flightData?.estimated 
      ? formatFlightTime(flightData.estimatedTime || flightData.estimated, !isDeparture) 
      : "-";

    const iataCode = destinationData?.iataCode || destinationData?.iata || "Unknown";
    const cityName = getCityNameFromIATA(iataCode);

    const airlineCode = flight.airline?.iataCode || flight.airline?.iata || "XX";
    const airlineIcon = airlineIcons[airlineCode] || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 55"><circle fill="#0381fe" cx="27.5" cy="7.5" r="5.6"/></svg>';

    const flightNumber = flight.flight?.iataNumber || flight.flight?.iata || 
                        flight.flight?.icaoNumber || flight.flight?.number || "N/A";

    let gate = flightData?.gate || "Soon";
    let status = flight.flight_status || flight.status || "N/A";
    let statusDisplay = status;
    let statusClass = status.toLowerCase().replace(/\s/g, "-");

    if (flightData?.delay) {
      status = "delayed";
      statusDisplay = "delayed";
      statusClass = "delayed";
    }

    const rowClass = index % 2 === 0 ? "flight-row-even" : "flight-row-odd";

    return (
      <tr key={`${flightNumber}-${index}`} className={rowClass}>
        <td>{flightTime}</td>
        <td>{cityName} ({iataCode})</td>
        <td>
          <img src={airlineIcon} alt={airlineCode} className="airline-icon" />
          {flightNumber}
        </td>
        <td>{gate}</td>
        <td className={`status-cell ${statusClass}`}>{statusDisplay}</td>
        <td>{estimatedTime}</td>
      </tr>
    );
  };

  const sectionId = type === 'departures' ? 'departures-section' : 'arrivals-section';
  const title = type === 'departures' ? 'DEPARTURES' : 'ARRIVALS';
  const tableId = type === 'departures' ? 'departure-table' : 'arrival-table';
  const columnTitle = type === 'departures' ? 'DESTINATION' : 'ORIGIN';

  return (
    <div className="flight-section" id={sectionId}>
      <div className="section-header">
        <div className="flight-icon">✈️</div>
        <h2>{title}</h2>
      </div>
      <table id={tableId}>
        <thead>
          <tr>
            <th>TIME</th>
            <th>{columnTitle}</th>
            <th>FLIGHT</th>
            <th>GATE</th>
            <th>STATUS</th>
            <th>EST</th>
          </tr>
        </thead>
        <tbody>
          {processedFlights.map((flight, index) => renderFlightRow(flight, index))}
        </tbody>
      </table>
    </div>
  );
};

export default FlightTable;