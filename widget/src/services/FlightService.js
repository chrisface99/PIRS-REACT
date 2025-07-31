// widget/src/services/FlightService.js
import { CONFIG } from "./config.js";

class FlightService {
  constructor() {
    this._lastFetchTime = null;
    this._lastFetchType = null;
    this._lastData = null;
    this._fetchInProgress = false;
    this._fetchQueue = [];
  }

  async fetchArrivals() {
    const code = (typeof CONFIG.iataCodeCity === 'string' && CONFIG.iataCodeCity.length === 3)
      ? CONFIG.iataCodeCity
      : "WAW";
    
    // Get current date in YYYY-MM-DD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const flightDate = `${year}-${month}-${day}`;
    const url = `https://api.aviationstack.com/v1/flights?access_key=${CONFIG.AVIATIONSTACK_API_KEY}&arr_iata=${code}&arr_scheduled_time_arr=${flightDate}`;
    
    console.log("[FlightService] Fetching flights from URL:", url);
    
    if (!CONFIG.AVIATIONSTACK_API_KEY || CONFIG.AVIATIONSTACK_API_KEY === "") {
      console.error("[FlightService] API key is missing or empty!", CONFIG.AVIATIONSTACK_API_KEY);
      return [];
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[FlightService] Fetch failed: HTTP status ${response.status} - ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error("Error fetching arrivals:", error, "URL:", url, "API Key:", CONFIG.AVIATIONSTACK_API_KEY);
      return [];
    }
  }

  updateFromConfig(config) {
    if (config && typeof config.iataCodeCity === "string" && config.iataCodeCity.length === 3) {
      CONFIG.iataCodeCity = config.iataCodeCity;
    }
  }

  getFetchUrl(type, iataCode) {
    const code = (typeof CONFIG.iataCodeCity === 'string' && CONFIG.iataCodeCity.length === 3)
      ? CONFIG.iataCodeCity
      : (typeof iataCode === 'string' && iataCode.length === 3)
        ? iataCode
        : "WAW";
    return `${CONFIG.AVIATIONSTACK_BASE_URL}?access_key=${CONFIG.AVIATIONSTACK_API_KEY}&iataCode=${code}&type=${type}`;
  }

  async fetchFlights(type = "departure", iataCode) {
    const now = Date.now();
    if (
      this._lastFetchTime &&
      this._lastFetchType === type &&
      now - this._lastFetchTime < 180000 &&
      this._lastData
    ) {
      return this._lastData;
    }

    if (this._fetchInProgress) {
      return new Promise((resolve, reject) => {
        this._fetchQueue.push({ type, resolve, reject });
      });
    }

    this._fetchInProgress = true;
    if (!this._lastFetchTime) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const url = this.getFetchUrl(type, iataCode);
    console.log("[FlightService] Fetching flights from URL:", url);
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      this._lastFetchTime = Date.now();
      this._lastFetchType = type;
      this._lastData = data.data || [];
      
      while (this._fetchQueue.length > 0) {
        const queued = this._fetchQueue.shift();
        queued.resolve(this._lastData);
      }
      
      return this._lastData;
    } catch (error) {
      while (this._fetchQueue.length > 0) {
        const queued = this._fetchQueue.shift();
        queued.reject(error);
      }
      console.error("Error fetching flight data:", error);
      return [];
    } finally {
      this._fetchInProgress = false;
    }
  }

  async fetchAirlineIcon(airlineCode) {
    const iconUrlSvgS = `${CONFIG.AIRLINE_ICON_S_URL}${airlineCode}.svg`;
    try {
      const responseSvgS = await fetch(iconUrlSvgS);
      if (responseSvgS.ok) {
        return iconUrlSvgS;
      }
    } catch (error) {
      console.error(`Error fetching airline icon SVG from S_URL for ${airlineCode}:`, error);
    }

    const iconUrlPngT = `${CONFIG.AIRLINE_ICON_T_URL}${airlineCode}.png`;
    try {
      const responsePngT = await fetch(iconUrlPngT);
      if (responsePngT.ok) {
        return iconUrlPngT;
      }
    } catch (error) {
      console.error(`Error fetching airline icon PNG from T_URL for ${airlineCode}:`, error);
    }

    const iconUrlSvgBase = `${CONFIG.AIRLINE_ICON_BASE_URL}${airlineCode}.svg`;
    try {
      const responseSvgBase = await fetch(iconUrlSvgBase);
      if (responseSvgBase.ok) {
        const text = await responseSvgBase.text();
        const trimmed = text.trim();
        if (
          trimmed.length > 0 &&
          !trimmed.toLowerCase().includes('<html') &&
          (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml'))
        ) {
          return iconUrlSvgBase;
        }
      }
    } catch (error) {
      console.error(`Error fetching airline icon SVG from BASE_URL for ${airlineCode}:`, error);
    }
    
    const externalDefault = `${CONFIG.DEFAULT_AIRLINE_ICON}`;
    try {
      const responseDefault = await fetch(externalDefault);
      if (responseDefault.ok) {
        const text = await responseDefault.text();
        const trimmed = text.trim();
        if (
          trimmed.length > 0 &&
          !trimmed.toLowerCase().includes('<html') &&
          (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml'))
        ) {
          return externalDefault;
        }
      }
    } catch (error) {
      console.error(`Error fetching external default airline icon:`, error);
    }
    
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 55"><circle fill="#0381fe" cx="27.5" cy="7.5" r="5.6"/><circle fill="#0381fe" cx="27.5" cy="47.5" r="5.6"/><circle fill="#0381fe" cx="7.5" cy="27.5" r="5.6"/><circle fill="#00d694" cx="47.5" cy="27.5" r="5.6"/></svg>';
  }
}

export default FlightService;