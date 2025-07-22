import React from "react";
import apiKeys from "./apiKeys";
import Clock from "react-live-clock";
import Forcast from "./forcast";
import loader from "./images/WeatherIcons.gif";
import ReactAnimatedWeather from "react-animated-weather";

const dateBuilder = (d) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  const day = days[d.getDay()];
  const date = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day}, ${date} ${month} ${year}`;
};

const defaults = {
  color: "white",
  size: 112,
  animate: true,
};

class Weather extends React.Component {
  state = {
    lat: undefined,
    lon: undefined,
    errorMessage: null,
    temperatureC: undefined,
    city: undefined,
    country: undefined,
    humidity: undefined,
    main: undefined,
    icon: "CLEAR_DAY",
    isLoading: true,
    hasLocationPermission: false
  };

  _isMounted = false;
  timerID = null;

  componentDidMount() {
    this._isMounted = true;
    this.fetchLocationAndWeather();
    this.timerID = setInterval(() => {
      if (this.state.lat && this.state.lon) {
        this.getWeather(this.state.lat, this.state.lon);
      }
    }, 600000); // Update every 10 minutes
  }

  componentWillUnmount() {
    this._isMounted = false;
    clearInterval(this.timerID);
  }

  fetchLocationAndWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (this._isMounted) {
            this.setState(
              { hasLocationPermission: true },
              () => this.getWeather(position.coords.latitude, position.coords.longitude)
            );
          }
        },
        (error) => {
          if (this._isMounted) {
            this.setState({
              errorMessage: "Using default location (Delhi)",
              hasLocationPermission: false
            });
            this.getWeather(28.67, 77.22); // Default to Delhi coordinates
          }
        },
        { timeout: 10000 } // 10 second timeout
      );
    } else {
      this.setState({ errorMessage: "Geolocation not supported" });
      this.getWeather(28.67, 77.22); // Fallback to Delhi
    }
  };

  getWeather = async (lat, lon) => {
    if (!this._isMounted) return;

    try {
      const response = await fetch(
        `${apiKeys.base}weather?lat=${lat}&lon=${lon}&units=metric&APPID=${apiKeys.key}`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.weather || !data.weather[0]) {
        throw new Error("Invalid weather data received");
      }

      const weatherMain = data.weather[0].main;
      const icon = this.getWeatherIcon(weatherMain);

      if (this._isMounted) {
        this.setState({
          lat,
          lon,
          city: data.name || "Unknown location",
          temperatureC: data.main ? Math.round(data.main.temp) : undefined,
          humidity: data.main?.humidity,
          main: weatherMain,
          country: data.sys?.country,
          icon,
          isLoading: false,
          errorMessage: null
        });
      }
    } catch (error) {
      console.error("Weather fetch error:", error);
      if (this._isMounted) {
        this.setState({
          isLoading: false,
          errorMessage: "Failed to load weather data"
        });
      }
    }
  };

  getWeatherIcon = (weatherMain) => {
    const iconMap = {
      Haze: "CLEAR_DAY",
      Clouds: "CLOUDY",
      Rain: "RAIN",
      Snow: "SNOW",
      Dust: "WIND",
      Drizzle: "SLEET",
      Fog: "FOG",
      Smoke: "FOG",
      Tornado: "WIND"
    };
    return iconMap[weatherMain] || "CLEAR_DAY";
  };

  render() {
    const { isLoading, errorMessage, temperatureC, city, country, icon, main } = this.state;

    if (isLoading) {
      return (
        <div className="loading-container">
          <img 
            src={loader} 
            alt="Loading weather data" 
            style={{ width: "50%", WebkitUserDrag: "none" }} 
          />
          <h3 style={{ color: "white", fontSize: "22px", fontWeight: "600" }}>
            Detecting your location...
          </h3>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="error-container">
          <h3 style={{ color: "white" }}>{errorMessage}</h3>
        </div>
      );
    }

    if (!temperatureC) {
      return (
        <div className="error-container">
          <h3 style={{ color: "white" }}>Weather data not available</h3>
        </div>
      );
    }

    return (
      <React.Fragment>
        <div className="city">
          <div className="title">
            <h2>{city}</h2>
            <h3>{country}</h3>
          </div>
          <div className="mb-icon">
            <ReactAnimatedWeather
              icon={icon}
              color={defaults.color}
              size={defaults.size}
              animate={defaults.animate}
            />
            <p>{main}</p>
          </div>
          <div className="date-time">
            <div className="dmy">
              <div className="current-time">
                <Clock format="HH:mm:ss" interval={1000} ticking={true} />
              </div>
              <div className="current-date">{dateBuilder(new Date())}</div>
            </div>
            <div className="temperature">
              <p>
                {temperatureC}°<span>C</span>
              </p>
            </div>
          </div>
        </div>
        <Forcast icon={icon} weather={main} />
      </React.Fragment>
    );
  }
}

export default Weather;