let iataCodeCity = "";
let AIRPORT_LOCATION = "";
let flightStatusUpdates = [];
let showDefaultTicker = true;

function addFlightStatusUpdate(flight, type) {
  const time = new Date(flight[type].scheduled).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const city = flight[type === "departure" ? "arrival" : "departure"].iata || "Unknown";
  const update = `Flight ${flight.flight.iata} ${
    type === "departure" ? "to" : "from"
  } ${city} is scheduled at ${time}.`;
  flightStatusUpdates.push(update);
}

function createChannel() {
  const channel = $vxt.createChannel($vxtSubChannelId);

  channel.subscribe("get", (response) => {
    console.log(response);

    if (response.error) {
      console.error("Error in response:", response.error);
      return;
    }

    const selectedIataCode = response.payload?.iataCodeCity || "WAW";
    updateAirportCode(selectedIataCode);

    if (response.payload?.Token) {
      // Send token to React app via postMessage
      window.postMessage({
        type: 'VXT_TOKEN_UPDATE',
        token: response.payload.Token
      }, '*');
    }

    if (response.payload?.showDefaultTicker !== undefined) {
      showDefaultTicker = response.payload.showDefaultTicker === "true";
    }

    // Send configuration to React app
    window.postMessage({
      type: 'VXT_CONFIG_UPDATE',
      config: response.payload
    }, '*');

    channel.publish("data", {
      type: "contents",
      payload: {
        categories: [
          {
            name: `Airport Flight Schedule for ${AIRPORT_LOCATION}`,
            displayMode: "grid",
          },
          {
            name: `Airport Flight Schedule - Departures for ${AIRPORT_LOCATION}`,
            displayMode: "grid",
          },
          {
            name: `Airport Flight Schedule - Arrivals for ${AIRPORT_LOCATION}`,
            displayMode: "grid",
          },
        ],
        content: [/* your existing content config */]
      },
    });
  });
}

function updateAirportCode(selectedIataCode) {
  const iataToCityMapping = {
    WAW: "WARSAW",
    BCN: "BARCELONA",
    BER: "BERLIN",
    KE: "NAIROBI",
    DEL: "DELHI",
  };

  const city = iataToCityMapping[selectedIataCode] || "UNKNOWN";
  iataCodeCity = selectedIataCode;
  AIRPORT_LOCATION = city;

  // Send airport code update to React app
  window.postMessage({
    type: 'VXT_AIRPORT_UPDATE',
    code: iataCodeCity,
    location: AIRPORT_LOCATION
  }, '*');
}

function waitForVxtApi() {
  const interval = setInterval(() => {
    if (window.$vxt) {
      clearInterval(interval);
      createChannel();
    }
  }, 100);
}

waitForVxtApi();