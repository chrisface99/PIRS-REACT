export const CONFIG = {
  AVIATIONSTACK_API_KEY: "",
  AVIATIONSTACK_BASE_URL: "https://api.aviationstack.com/v1/timetable",
  OPENWEATHER_API_KEY: "d34469173c876dc3e734f40f63a5aa5c",
  OPENWEATHER_URL: "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=pl&q=",
  AIRLINE_ICON_BASE_URL: "https://canvas.samsungvx.com/organizations/ALL/resources/f69d567e0027f6e50da412793b4c0de9/icons/",
  AIRLINE_ICON_T_URL: "https://airlinecodes.info/500px/",
  AIRLINE_ICON_S_URL: "https://airlinecodes.info/airlinelogos/",
  DEFAULT_AIRLINE_ICON: "https://canvas.samsungvx.com/organizations/ALL/resources/f69d567e0027f6e50da412793b4c0de9/icons/default.svg",
  WEATHER_CACHE_TTL: 3600000,
  DATA_REFRESH_INTERVAL: 300000,
  WEATHER_REFRESH_INTERVAL: 600000,
  iataCodeCity: "",
};

export const IATA_TO_CITY_MAPPING = {
  WAW: "WARSAW",
  BCN: "BARCELONA",
  BER: "BERLIN",
  KE: "NAIROBI",
  DEL: "DELHI",
};

export const IATA_CITY_MAPPING = [
  { iata: "NYS", city: "New York" },
  { iata: "ICY", city: "Icy Bay" },
  { iata: "HGZ", city: "Hogatza" },
  { iata: "BYW", city: "Blakely Island" },
  { iata: "BDF", city: "Bradford" },
  { iata: "BCS", city: "Belle Chasse" },
  { iata: "BWL", city: "Blackwell" },
  { iata: "DUF", city: "Corolla" },
  { iata: "FOB", city: "Fort Bragg" },
  { iata: "AFT", city: "Bila" },
  { iata: "RNA", city: "Arona" },
  { iata: "ATD", city: "Atoifi" },
  { iata: "VEV", city: "Barakoma" },
  { iata: "BPF", city: "Batuna Mission Station" },
  { iata: "GEF", city: "Liangia" },
  { iata: "AKS", city: "Auki" },
  { iata: "BNY", city: "Anua" },
  { iata: "BAS", city: "Ballalae" },
  { iata: "FRE", city: "Fera Island" },
  { iata: "HIR", city: "Honiara" },
  { iata: "MBU", city: "Mbambanakira" },
  { iata: "IRA", city: "Kirakira" },
  { iata: "SCZ", city: "Santa Cruz/Graciosa Bay/Luova" }
];