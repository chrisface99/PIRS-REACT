// extension/index.js
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
    console.log("[Extension] Received VXT response:", response);

    if (response.error) {
      console.error("Error in response:", response.error);
      return;
    }

    const selectedIataCode = response.payload?.iataCodeCity || "WAW";
    updateAirportCode(selectedIataCode);

    // Send all configuration to React app
    if (response.payload) {
      // Send token update
      if (response.payload.Token) {
        window.postMessage({
          type: 'VXT_TOKEN_UPDATE',
          token: response.payload.Token
        }, '*');
      }

      // Send complete configuration update
      window.postMessage({
        type: 'VXT_CONFIG_UPDATE',
        config: response.payload
      }, '*');

      if (response.payload.showDefaultTicker !== undefined) {
        showDefaultTicker = response.payload.showDefaultTicker === "true";
      }
    }

    console.log("[Extension] Show Default Ticker:", showDefaultTicker);

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
        content: [
          {
            resourceType: "content",
            resourceId: "FlightScheduleMain",
            resourceName: "Airport Flight Schedule",
            thumbnailPath: "https://i.imgur.com/XDU7y1T.png",
            isLandscape: true,
            category: `Airport Flight Schedule for ${AIRPORT_LOCATION}`,
            orientation: "landscape",
            keywords: "airport, main dashboard",
            config: {
              Configuration: [
                {
                  type: "hidden",
                  id: "template",
                  value: "flightScheduleMain",
                },
                {
                  type: "hidden",
                  id: "Token",
                  value: response.payload?.Token,
                },
                {
                  type: "hidden",
                  id: "iataCodeCity",
                  value: iataCodeCity,
                },
                {
                  type: "message",
                  id: "welcomeMessageHeading",
                  value: "",
                  caption: "Flight Schedule Ticker Configuration",
                  size: "large",
                  position: "top",
                },
                {
                  type: "message",
                  id: "welcomeMessageHeading",
                  value: "Please input text which you want to paste in Ticker element of Flight schedule",
                  caption: "",
                  size: "medium",
                  position: "top",
                },
                {
                  type: "text",
                  id: "inputuserTickerText",
                  caption: "",
                  value: "Welcome to the Airport Flight Information System!",
                  useTranslate: true,
                  multiLine: true,
                  charactersLimit: 300,
                  label: "Ticker Text",
                },
                {
                  type: "divider",
                  id: "extensionDivider",
                },
                {
                  type: "message",
                  id: "welcomeMessageHeading",
                  value: "Choose whether you want the default ticker information to scroll from left to right or from right to left.",
                  caption: "",
                  size: "medium",
                  position: "top",
                },
                {
                  type: "dropdown",
                  id: "userTickerDirection",
                  caption: "Ticker Direction",
                  list: ["left", "right"],
                  value: "left",
                },
                {
                  type: "range",
                  id: "userTickerSpeed",
                  caption: "Select ticker speed",
                  min: 1,
                  max: 100,
                  step: 1,
                  value: 60,
                },
                {
                  type: "range",
                  id: "userTickerFrequency",
                  caption: "Select ticker frequency",
                  min: 1,
                  max: 60,
                  step: 1,
                  value: 20,
                },
                {
                  type: "message",
                  id: "welcomeMessageHeading",
                  value: "Select true if you want to show the status of the flight in the ticker.",
                  caption: "",
                  size: "medium",
                  position: "top",
                },
                {
                  type: "dropdown",
                  id: "showDefaultTicker",
                  caption: "Show default ticker",
                  list: ["false", "true"],
                  value: "true",
                },
                {
                  type: "divider",
                  id: "extensionDivider",
                },
                {
                  type: "message",
                  id: "welcomeMessageHeading",
                  value: "",
                  caption: "Flight Schedule Table Configuration",
                  size: "medium",
                  position: "top",
                },
                {
                  type: "range",
                  id: "rowsCount",
                  caption: "Select number of rows",
                  min: 1,
                  max: 30,
                  step: 1,
                  value: 15,
                },
              ],
            },
          },
          {
            resourceType: "content",
            resourceId: "FlightScheduleDepartures",
            resourceName: "Airport Flight Schedule - Departures",
            thumbnailPath: "https://i.imgur.com/XDU7y1T.png",
            isLandscape: true,
            category: `Airport Flight Schedule - Departures for ${AIRPORT_LOCATION}`,
            orientation: "landscape",
            keywords: "airport, departures",
            config: {
              Configuration: [
                {
                  type: "hidden",
                  id: "iataCodeCity",
                  value: iataCodeCity,
                },
                {
                  type: "hidden",
                  id: "Token",
                  value: response.payload?.Token,
                },
                {
                  type: "hidden",
                  id: "template",
                  value: "flightScheduleDepartures",
                },
                // ... (same ticker configuration as main)
                {
                  type: "message",
                  id: "welcomeMessageHeading",
                  value: "",
                  caption: "Flight Schedule Ticker Configuration",
                  size: "large",
                  position: "top",
                },
                {
                  type: "text",
                  id: "inputuserTickerText",
                  caption: "",
                  value: "Welcome to the Airport Flight Information System!",
                  useTranslate: true,
                  multiLine: true,
                  charactersLimit: 300,
                  label: "Ticker Text",
                },
                {
                  type: "dropdown",
                  id: "userTickerDirection",
                  caption: "Ticker Direction",
                  list: ["left", "right"],
                  value: "left",
                },
                {
                  type: "range",
                  id: "userTickerSpeed",
                  caption: "Select ticker speed",
                  min: 1,
                  max: 100,
                  step: 1,
                  value: 60,
                },
                {
                  type: "dropdown",
                  id: "showDefaultTicker",
                  caption: "Show default ticker",
                  list: ["false", "true"],  
                  value: "true",
                },
                {
                  type: "range",
                  id: "rowsCount",
                  caption: "Select number of rows",
                  min: 1,
                  max: 30,
                  step: 1,
                  value: 15,
                },
              ],
            },
          },
          {
            resourceType: "content",
            resourceId: "FlightScheduleArrivals",
            resourceName: "Airport Flight Schedule - Arrivals",
            thumbnailPath: "https://i.imgur.com/XDU7y1T.png",
            isLandscape: true,
            category: `Airport Flight Schedule - Arrivals for ${AIRPORT_LOCATION}`,
            orientation: "landscape",
            keywords: "airport, arrivals",
            config: {
              Configuration: [
                {
                  type: "hidden",
                  id: "template",
                  value: "flightScheduleArrivals",
                },
                {
                  type: "hidden",
                  id: "Token",
                  value: response.payload?.Token,
                },
                {
                  type: "hidden",
                  id: "iataCodeCity",
                  value: iataCodeCity,
                },
                // ... (same ticker configuration as main)
                {
                  type: "message",
                  id: "welcomeMessageHeading",
                  value: "",
                  caption: "Flight Schedule Ticker Configuration",
                  size: "large",
                  position: "top",
                },
                {
                  type: "text",
                  id: "inputuserTickerText",
                  caption: "",
                  value: "Welcome to the Airport Flight Information System!",
                  useTranslate: true,
                  multiLine: true,
                  charactersLimit: 300,
                  label: "Ticker Text",
                },
                {
                  type: "dropdown",
                  id: "userTickerDirection",
                  caption: "Ticker Direction",
                  list: ["left", "right"],
                  value: "left",
                },
                {
                  type: "range",
                  id: "userTickerSpeed",
                  caption: "Select ticker speed",
                  min: 1,
                  max: 100,
                  step: 1,
                  value: 60,
                },
                {
                  type: "dropdown",
                  id: "showDefaultTicker",
                  caption: "Show default ticker",
                  list: ["false", "true"],
                  value: "true",
                },
                {
                  type: "range",
                  id: "rowsCount",
                  caption: "Select number of rows",
                  min: 1,
                  max: 30,
                  step: 1,
                  value: 15,
                },
              ],
            },
          },
        ],
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

  console.log("[Extension] Airport updated:", iataCodeCity, AIRPORT_LOCATION);
}

function waitForVxtApi() {
  const interval = setInterval(() => {
    if (window.$vxt) {
      clearInterval(interval);
      console.log("[Extension] VXT API found, creating channel");
      createChannel();
    }
  }, 100);
}

// Initialize extension
console.log("[Extension] Starting VXT API wait...");
waitForVxtApi();