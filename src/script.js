const API_KEY = "20dbdf7e66e949ee83982724263004";

let cityInput = document.querySelector("#city-input");
let searchBtn = document.querySelector("#search-btn");
let recentCities = document.querySelector("#recent-cities");
let locationBtn = document.querySelector("#location-btn");
let tempToggleBtn = document.querySelector("#temp-toggle-btn");

let isCelsius = true;
let currentWeather = null;
let timeInterval = null;

//Recent city
function saveCity(city) {
    let cities = localStorage.getItem("recentCities");

    if (cities) {
        cities = JSON.parse(cities);
    } else {
        cities = [];
    }

    city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    if (cities.includes(city)) {
        return;
    }

    cities.unshift(city);

    if (cities.length > 5) {
        cities.pop();
    }

    localStorage.setItem("recentCities", JSON.stringify(cities));
}

// load dropdown
function loadRecentCities() {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];

    recentCities.innerHTML = `<option value="">Select a city</option>`;

    cities.forEach(city => {
        let option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        recentCities.appendChild(option);
    });
}

//set current time based on city's timezone
function updateTime(tz) {
    const now = new Date();

    document.getElementById("live-time").innerText =
        now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });

    document.getElementById("current-date").innerText =
        now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}


// update UI state
async function updateUIState(weather) {
    currentWeather = weather;
    console.log(weather);
    
    if (timeInterval) clearInterval(timeInterval);
    updateTime(weather.tz);
    
    timeInterval = setInterval(() => {
        updateTime(weather.tz);
    }, 1000);

    document.getElementById("city-name").innerText = `${weather.cityName}, ${weather.country}`;
    document.getElementById("sunrise").innerText = weather.sunrise;
    document.getElementById("sunset").innerText = weather.sunset;
    document.getElementById("humidity").innerText = `${weather.humidity}%`;
    document.getElementById("wind-speed").innerText = `${weather.windKph} km/h`;
    document.getElementById("pressure").innerText = `${weather.pressure} in`;
    document.getElementById("weather-icon").src = "https:" + weather.weatherIcon;
    document.getElementById("weather-condition").innerText = weather.weatherCondition;

    // 5-day forecast
    const forecastContainer = document.getElementById("forecast-cards");
    forecastContainer.innerHTML = "";

    weather.forecast.forEach(day => {
        const date = new Date(day.date + "T12:00:00");
        const label = date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

        const card = document.createElement("div");
        card.className = "forecast-card flex items-center gap-4";
        
        const img = document.createElement("img");
        img.src = `https:${day.day.condition.icon}`;
        img.alt = day.day.condition.text;   
        img.className = "w-10 h-10 object-contain";

        const temp = document.createElement("p");
        temp.className = "forecast-temp font-bold w-14";
        temp.textContent = `${day.day.avgtemp_c}°C`;

        const dateLabel = document.createElement("p");
        dateLabel.className = "text-gray-500 ml-auto";
        dateLabel.textContent = label;

        card.appendChild(img);
        card.appendChild(temp);
        card.appendChild(dateLabel);
        forecastContainer.appendChild(card);
    });

    saveCity(weather.cityName);
    loadRecentCities();
}

// API (city)
async function getWeatherFromAPIByCity(city) {
    let url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=yes&alerts=yes`;
    let response = await fetch(url);
    let data = await response.json();

    console.log("getWeatherFromAPIByCity: ", JSON.stringify(data));

    if (data.error) {
        alert("City not found");
        return;
    }

    return {
        cityName: data.location.name,
        country: data.location.country,
        tempC: data.current.temp_c,
        tempF: data.current.temp_f,
        feelsLikeC: data.current.feelslike_c,
        feelsLikeF: data.current.feelslike_f,
        sunrise: data.forecast.forecastday[0].astro.sunrise,
        sunset: data.forecast.forecastday[0].astro.sunset,
        humidity: data.current.humidity,
        windKph: data.current.wind_kph,
        pressure: data.current.pressure_in,
        uv: data.current.uv,
        weatherIcon: data.current.condition.icon,
        weatherCondition: data.current.condition.text,
        tz: data.location.tz_id,
        forecast: data.forecast.forecastday
    };
}

// API (lat, long)
async function getWeatherFromAPIByLatLong(lat, long) {
    let url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${long}&days=5&aqi=yes&alerts=yes`;
    let response = await fetch(url);
    let data = await response.json();

    console.log("getWeatherFromAPIByLatLong: ", JSON.stringify(data));

    if (data.error) {
        alert("City not found");
        return;
    }

    return {
        cityName: data.location.name,
        country: data.location.country,
        tempC: data.current.temp_c,
        tempF: data.current.temp_f,
        feelsLikeC: data.current.feelslike_c,
        feelsLikeF: data.current.feelslike_f,
        sunrise: data.forecast.forecastday[0].astro.sunrise,
        sunset: data.forecast.forecastday[0].astro.sunset,
        humidity: data.current.humidity,
        windKph: data.current.wind_kph,
        pressure: data.current.pressure_in,
        uv: data.current.uv,
        weatherIcon: data.current.condition.icon,
        weatherCondition: data.current.condition.text,
        tz: data.location.tz_id,
        forecast: data.forecast.forecastday
    };
}


//get data from api
let getDataByCity = async (city) => {

    if (!city) {
        alert("Please enter a city name");
        return;
    }

    try {
        let weather = await getWeatherFromAPIByCity(city);
        await updateUIState(weather);
        return weather;
    }
    catch (error) {
        console.log("Error:", error);
    }
};

//get current location from browser
async function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return {undefined, undefined};
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const long = position.coords.longitude;
                console.log("fetched location coordinates:", lat, long);
                resolve({ lat, long });
            },
            () => {
                console.log("fetch location coordinates failed");
                alert("Location access denied");
                reject();
            }
        );
    });
}

//get data from api
let getDataByLatLong = async (lat, long) => {

    if (!lat || !long) {
        alert("Current location not detected");
        return;
    }

    try {
        let weather = await getWeatherFromAPIByLatLong(lat, long);
        await updateUIState(weather);
    }
    catch (error) {
        console.log("Error:", error);
    }
};


// Listner for search bar 
cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();

        // get weather data
        getDataByCity(cityInput.value);

        cityInput.value = "";
    }
});


// Listner for recent cities dropdown
recentCities.addEventListener("change", (e) => {
    let selectedCity = e.target.value;
    if (selectedCity) {
        // get weather data
        getDataByCity(selectedCity);
    }
});

// listner for current location button
locationBtn.addEventListener("click", async () => {
    // fetch lat and long from browser
    let {lat, long} = await getCurrentLocation();
    console.log("current location button - coordinates:", lat, long);

    // get weather data
    getDataByLatLong(lat, long);
});




loadRecentCities();
