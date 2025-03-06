import { useCallback, useEffect, useMemo, useState } from 'react';
import './WeatherDetails.css';

const WeatherDetails = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [buttonText, setButtonText] = useState('Current Location');
    const API = useMemo(()=> import.meta.env.VITE_API_KEY,[]);
    const [sunrise, setSunrise] = useState('');
    const [sunset, setSunset] = useState('');
    const[hourly,setHourly]=useState([]);
    const[daily,setDaily]=useState([]);
    const[currentTime,SetCurrentTime] = useState('');
    const[currentDate,setCurrentDate] = useState('');
    const[timeZone,setTimeZone] = useState(0);

    const fetchWeatherDataByCoords = useCallback( async (lat, lon) => {
      try {
          const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API}&units=metric`);
          
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setWeatherData({
              humidity: data.main.humidity,
              clouds: data.clouds.all,
              location: data.name,
              weatherCondition: data.weather[0].main,
              windspeed: data.wind.speed,
              pressure: data.main.pressure,
              feeltemp: data.main.feels_like,
              temperature: data.main.temp,
              timezone: data.timezone
          });
          updateSunriseSunSet(data);
          setTimeZone(data.timezone);
          updateBg(data.weather[0].main.toLowerCase());
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API}&units=metric`;
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) {
          throw new Error('Network response was not ok for forecast');
      }
      const forecastData = await forecastResponse.json();
      const hourlyData = forecastData.list.filter((_, index) => index < 8).slice(0, 5);
      const dailyData = forecastData.list.filter((_, index) => index % 8 === 0).slice(0, 5);
      setHourly(hourlyData);
      setDaily(dailyData);
      } catch (error) {
          console.error("Fetching data problem", error);
      }
  },[API]);
  const fetchWeatherData = useCallback(async (city) => {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API}&units=metric`);
        if (!response.ok) throw new Error('Response from the network was not ok');
        const data = await response.json();

        setWeatherData({
            humidity: data.main.humidity,
            clouds: data.clouds.all,
            location: data.name,
            weatherCondition: data.weather[0].main,
            windspeed: data.wind.speed,
            pressure: data.main.pressure,
            feeltemp: data.main.feels_like,
            temperature: data.main.temp
        });

        updateSunriseSunSet(data);
        fetchHrAndDl(city);
        setTimeZone(data.timezone);
        updateBg(data.weather[0].main.toLowerCase());
    } catch (error) {
        console.error("Fetching data problem", error);
        alert("Input a valid location");
    }
}, [API]);
const updateSunriseSunSet=useCallback((data)=>{
    const sunriseDate = new Date(data.sys.sunrise * 1000);
            const sunsetDate = new Date(data.sys.sunset * 1000);
            const sunrisetTime = sunriseDate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true});
            const sunseTime =sunsetDate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true});
            setSunrise(sunrisetTime);
            setSunset(sunseTime);
},[]);
const fetchHrAndDl = useCallback(async(city)=>{

    try{
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API}&units=metric`);
        if(!response.ok){
            throw new Error("Response from the Network was not Ok");
        }
        const data = await response.json();
        console.log(data);
        const hourlyData = data.list.filter((_,index)=>index < 8).slice(0,5);
        const dailyData = data.list.filter((_,index)=>index%8===0).slice(0,5);
        setHourly(hourlyData);
        setDaily(dailyData);

    }catch(error){
        console.error("Fetching data problem",error);
    }
},[API]);
useEffect(() => {
    const updateTime = () => {
        if (timeZone) {
            const now = new Date();
            const localTime = new Date(now.getTime() + timeZone * 1000);
            const hours = localTime.getUTCHours();
            const minutes = localTime.getUTCMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            SetCurrentTime(`${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`);
            
            const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const dayOfWeek = weekDays[localTime.getUTCDay()];
            const day = localTime.getUTCDate();
            const month = months[localTime.getUTCMonth()];
            const year = localTime.getFullYear();
            setCurrentDate(`${dayOfWeek}, ${day < 10 ? '0' + day : day} ${month} ${year}`);
        }
    };
    
    updateTime(); 
    const intervalId = setInterval(updateTime, 60000);
    
    return () => clearInterval(intervalId); 
}, [timeZone]);


    const handleClick = useCallback(() => {
        if (navigator.geolocation) {
            setButtonText('Wait...');
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherDataByCoords(latitude, longitude);
                setButtonText('Current Location');
                setInterval(() => {
                    fetchWeatherDataByCoords(latitude, longitude);
                }, 900000);
            }, error => {
                console.error("Error getting location", error);
                const defaultCity = "New Delhi";
                fetchWeatherData(defaultCity);
                setButtonText('Current Location');
            });
        } else {
            console.error("Geolocation is not supported by this browser");
            setButtonText('Current Location');
        }
    },[]);

    

    useEffect(() => {
        const toggle = document.getElementById('darkModeToggle');
        const darkModeToggle = () => {
            document.body.classList.toggle('dark-mode');
            const moonIcon = document.getElementById('moonIcon');
            const sunIcon = document.getElementById('sunIcon');
            if (document.body.classList.contains('dark-mode')) {
                moonIcon.style.display = 'none';
                sunIcon.style.display = 'inline';
            } else {
                moonIcon.style.display = 'inline';
                sunIcon.style.display = 'none';
            }
        };
        toggle.addEventListener('click', darkModeToggle);
        return () => {
            toggle.removeEventListener('click', darkModeToggle);
        };
    }, []);

    useEffect(() => {
        const searchBtn = document.getElementById('searchBtn');
        const inputCity = document.getElementById('inputCity');
        const search = () => {
            const city = inputCity.value;
            if (city) {
                localStorage.setItem('lastSearchedCity', city);
                fetchWeatherData(city);
                fetchHrAndDl(city);
            }
        };
        searchBtn.addEventListener('click', search);
        return () => {
            searchBtn.removeEventListener('click', search);
        };
    }, []);
    const updateBg = useCallback((weather) => {
      const body = document.body;
      body.classList.remove('clear-weather', 'cloudy-weather', 'rainy-weather');
      if (weather.includes('clear')) {
          body.classList.add('clear-weather');
      } else if (weather.includes('cloud')) {
          body.classList.add('cloudy-weather');
      } else if (weather.includes('rain')) {
          body.classList.add('rainy-weather');
      } else {
          body.classList.add('clear-weather');
      }
      if (body.classList.contains('dark-mode')) {
          body.classList.add('dark-mode');
      }
  },[]);
    useEffect(() => {
        const lastSearchedCity = localStorage.getItem('lastSearchedCity');
        if (lastSearchedCity) {
            fetchWeatherData(lastSearchedCity);
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherDataByCoords(latitude, longitude);
                setInterval(() => {
                    fetchWeatherDataByCoords(latitude, longitude);
                }, 900000);
            }, error => {
                console.error("Error getting location", error);
                fetchWeatherData("New Delhi");
            });
        }
    }, []);
    const weatherIcon = {
        "clear sky":"fa-sun",
        "few clouds":"fa-cloud-sun",
        "scattered clouds":"fa-cloud",
        "broken clouds":"fa-cloud",
        "shower rain":"fa-cloud-showers-heavy",
        "rain":"fa-cloud-showers-heavy",
        "light rain":"fa-cloud-showers-heavy",
        "thunderstorm":"fa-bolt",
        "snow":"fa-snowflake",
        "mist":"fa-smog"
    };

    return (
        <div>
      <div className="row mb-4">
        <div className="col-md-2">
          <button className="btn btn-light d-flex align-items-center" id="darkModeToggle">
            <i className="fas fa-moon mr-2" id="moonIcon"></i>
            <i className="fas fa-sun mr-2" id="sunIcon" style={{ display: 'none' }}></i>
          </button>
        </div>
        <div className="col-md-8">
          <div className="input-group mt-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search for your preferred city..."
              id="inputCity"
            />
            <div className="input-group-append">
              <button className="btn btn-outline-secondary" type="button" id="searchBtn">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-2 text-right">
          <button
            className="btn btn-success d-flex align-items-center justify-content-center"
            id="currentLocationBtn"
            onClick={handleClick}
          >
            <i className="fas fa-map-marker-alt mr-2"></i> {buttonText}
          </button>
        </div>
      </div>

      {weatherData ? (
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card text-center p-4 shadow-sm">
              <h3 id="location-live">{weatherData.location}</h3>
              <h1 className="display-4" id="location-time">{currentTime}</h1>
              <p id="location-date">{currentDate}</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card text-center p-4 shadow-sm">
              <h1 className="display-4" id="temperature">
                {weatherData.temperature}°C
              </h1>
              <p id="feelTemp">Feels like: {weatherData.feeltemp}°C</p>
              <p id="weatherCondition">
                <strong>{weatherData.weatherCondition}</strong>
              </p>
              <div className="d-flex justify-content-around">
                <div className="text-center">
                  <i className="fas fa-tint"></i>
                  <br />
                  <small>Humidity</small>
                  <br />
                  <p id="humidity">{weatherData.humidity}%</p>
                </div>
                <div className="text-center">
                  <i className="fas fa-wind"></i>
                  <br />
                  <small>Wind Speed</small>
                  <br />
                  <p id="windspeed">{weatherData.windspeed} km/h</p>
                </div>
                <div className="text-center">
                  <i className="fas fa-tachometer-alt"></i>
                  <br />
                  <small>Pressure</small>
                  <br />
                  <p id="pressure">{weatherData.pressure} hPa</p>
                </div>
                <div className="text-center">
                  <i className="fas fa-cloud"></i>
                  <br />
                  <small>Cloud</small>
                  <br />
                  <p id="cloud">{weatherData.clouds}%</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3" id="sunset">
            <div className="card p-4 shadow-sm">
              <div className="d-flex justify-content-around">
                <div className="text-center">
                  <i className="fas fa-sun"></i>
                  <br />
                  <small>Sunrise</small>
                  <br />
                  <p id="sunrise-time">{sunrise}</p>
                </div>
                <div className="text-center">
                  <i className="fas fa-cloud-sun"></i>
                  <br />
                  <small>Sunset</small>
                  <br />
                  <p id="sunset-time">{sunset}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}

      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card p-4 shadow-sm" id="daily">
            <h5 className="card-title">5 Days Forecast:</h5>
            <ul className="forecast list-unstyled">
              {daily.map((day) => {
                const date = new Date((day.dt + timeZone) * 1000);
                const localDate = new Date(date.getTime() + new Date().getTimezoneOffset() * 60000);
                const dayOfWeek = localDate.toLocaleString('en-US', { weekday: 'long' });
                const formattedDate = localDate.getDate();
                const month = localDate.toLocaleDateString('en-US', { month: 'short' });
                const weatherICon = weatherIcon[day.weather[0].description] || 'fa-cloud';
                return (
                  <li key={day.dt}>
                    <i className={`fas ${weatherICon}`}></i> {day.main.temp}°C
                    <span className="float-right">{`${dayOfWeek}, ${formattedDate} ${month}`}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card p-4 shadow-sm" id="hourly">
            <h5 className="card-title">Hourly Forecast:</h5>
            <div className="d-flex justify-content-between">
              {hourly.map((hour) => {
                const date = new Date((hour.dt + timeZone) * 1000);
                const localDate = new Date(date.getTime() + new Date().getTimezoneOffset() * 60000);
                const time = localDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                });
                const weatherICon = weatherIcon[hour.weather[0].description] || 'fa-cloud';
                return (
                  <div className="text-center" key={hour.dt}>
                    <small>{time}</small>
                    <br />
                    <i className={`fas ${weatherICon}`}></i>
                    <br />
                    <small>{hour.main.temp}°C</small>
                    <br />
                    <small>{hour.wind.speed} km/h</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
 
    );
};

export default WeatherDetails;
