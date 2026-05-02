const API_KEY = "20dbdf7e66e949ee83982724263004";

let cityInput = document.querySelector("#city-input");
let searchBtn = document.querySelector("#search-btn");
let recentCities = document.querySelector("#recent-cities");
let locationBtn = document.querySelector("#location-btn");
let tempToggleBtn = document.querySelector("#temp-toggle-btn");
let alertBox = document.getElementById("weather-alert");
let alertTitle = document.getElementById("alert-title");
let alertDesc = document.getElementById("alert-desc");
let alertDescToggle = document.getElementById("alert-desc-toggle");


let isCelsius = true;
let currentWeather = null;
let timeInterval = null;

tempToggleBtn.addEventListener("click", () => {
    if (!currentWeather) return;
    isCelsius = !isCelsius;
    renderTemperatures(currentWeather);
});

const WeatherState = {
    THUNDERSTORM:  "thunderstorm",
    SNOW:          "snow",
    RAIN:          "rain",
    FOG:           "fog",
    WINDY:         "windy",
    CLOUDY_DAY:    "cloudy_day",
    CLOUDY_NIGHT:  "cloudy_night",
    SUNNY:         "sunny",
    NIGHT:         "night",
};

function resolveWeatherState(condition, isDay) {
    const c = condition.toLowerCase();

    if (c.includes("thunder") || c.includes("storm"))           return WeatherState.THUNDERSTORM;
    if (c.includes("snow") || c.includes("blizzard") ||
        c.includes("sleet") || c.includes("ice"))               return WeatherState.SNOW;
    if (c.includes("rain") || c.includes("drizzle") ||
        c.includes("shower"))                                    return WeatherState.RAIN;
    if (c.includes("fog") || c.includes("mist") ||
        c.includes("haze") || c.includes("overcast"))           return WeatherState.FOG;
    if (c.includes("wind") || c.includes("gale"))               return WeatherState.WINDY;
    if (c.includes("cloud"))
        return isDay ? WeatherState.CLOUDY_DAY : WeatherState.CLOUDY_NIGHT;

    return isDay ? WeatherState.SUNNY : WeatherState.NIGHT;
}

const BACKGROUND_MAP = {
    [WeatherState.THUNDERSTORM]:  "linear-gradient(to bottom, #1a1a2e, #4a0e0e)",
    [WeatherState.SNOW]:          "linear-gradient(to bottom, #dfe9f3, #a8c0cc)",
    [WeatherState.RAIN]:          "linear-gradient(to bottom, #4a6fa5, #2c3e50)",
    [WeatherState.FOG]:           "linear-gradient(to bottom, #bdc3c7, #95a5a6)",
    [WeatherState.WINDY]:         "linear-gradient(to bottom, #a8c0cc, #6b8fa3)",
    [WeatherState.CLOUDY_DAY]:    "linear-gradient(to bottom, #89a4c7, #b8cce4)",
    [WeatherState.CLOUDY_NIGHT]:  "linear-gradient(to bottom, #2c3e50, #3d5166)",
    [WeatherState.SUNNY]:         "linear-gradient(to bottom, #56ccf2, #2f80ed)",
    [WeatherState.NIGHT]:         "linear-gradient(to bottom, #0f0c29, #302b63)",
};

// ─── Weather Scene Renderer ──────────────────────────────────────────────────

function rand(min, max) { return Math.random() * (max - min) + min; }

function buildSunnyScene() {
    const rays = [];
    for (let i = 0; i < 12; i++) {
        const angle = i * 30;
        const delay = (i * 0.15).toFixed(2);
        const len = i % 2 === 0 ? 90 : 65;
        const x2 = (160 + len * Math.cos((angle - 90) * Math.PI / 180)).toFixed(1);
        const y2 = (130 + len * Math.sin((angle - 90) * Math.PI / 180)).toFixed(1);
        rays.push(`<line x1="160" y1="130" x2="${x2}" y2="${y2}"
            stroke="rgba(255,230,100,0.85)" stroke-width="4" stroke-linecap="round"
            style="transform-origin:160px 130px; animation:sunRayPulse 2.4s ease-in-out ${delay}s infinite;"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <circle cx="160" cy="130" r="54" fill="rgba(255,240,120,0.18)"
        style="transform-origin:160px 130px; animation:sunHaloBreathe 3s ease-in-out infinite;"/>
      <circle cx="160" cy="130" r="44" fill="rgba(255,220,60,0.95)"/>
      ${rays.join("\n")}
    </svg>`;
}

function buildNightScene() {
    const stars = [];
    for (let i = 0; i < 45; i++) {
        const cx = rand(20, 780).toFixed(1);
        const cy = rand(10, 420).toFixed(1);
        const r  = rand(0.8, 2.5).toFixed(1);
        const delay = rand(0, 4).toFixed(2);
        const dur   = rand(1.8, 4.0).toFixed(2);
        stars.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(220,235,255,0.95)"
            style="animation:starTwinkle ${dur}s ease-in-out ${delay}s infinite;"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <mask id="moonMask">
          <rect width="800" height="600" fill="white"/>
          <circle cx="655" cy="80" r="42" fill="black"/>
        </mask>
      </defs>
      ${stars.join("\n")}
      <circle cx="630" cy="100" r="52" fill="rgba(210,225,255,0.92)"
        mask="url(#moonMask)"
        style="animation:moonGlow 4s ease-in-out infinite;"/>
    </svg>`;
}

function buildRainScene() {
    const streaks = [];
    for (let i = 0; i < 60; i++) {
        const x1 = rand(0, 820).toFixed(1);
        const y1 = rand(-200, -10).toFixed(1);
        const len = rand(18, 35);
        const x2  = (parseFloat(x1) + len * Math.sin(20 * Math.PI / 180)).toFixed(1);
        const y2  = (parseFloat(y1) + len * Math.cos(20 * Math.PI / 180)).toFixed(1);
        const delay = rand(0, 2.5).toFixed(2);
        const dur   = rand(0.55, 0.95).toFixed(2);
        const opacity = rand(0.35, 0.75).toFixed(2);
        const sw = rand(0.8, 1.6).toFixed(1);
        streaks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
            stroke="rgba(174,214,241,${opacity})" stroke-width="${sw}" stroke-linecap="round"
            style="animation:rainFall ${dur}s linear ${delay}s infinite;"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      ${streaks.join("\n")}
    </svg>`;
}

function buildThunderstormScene() {
    const streaks = [];
    for (let i = 0; i < 90; i++) {
        const x1 = rand(0, 820).toFixed(1);
        const y1 = rand(-200, -10).toFixed(1);
        const len = rand(22, 42);
        const x2  = (parseFloat(x1) + len * Math.sin(25 * Math.PI / 180)).toFixed(1);
        const y2  = (parseFloat(y1) + len * Math.cos(25 * Math.PI / 180)).toFixed(1);
        const delay = rand(0, 1.8).toFixed(2);
        const dur   = rand(0.4, 0.75).toFixed(2);
        const opacity = rand(0.4, 0.8).toFixed(2);
        const sw = rand(0.8, 2.0).toFixed(1);
        streaks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
            stroke="rgba(140,180,220,${opacity})" stroke-width="${sw}" stroke-linecap="round"
            style="animation:rainFall ${dur}s linear ${delay}s infinite;"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      ${streaks.join("\n")}
      <rect x="0" y="0" width="800" height="600" fill="rgba(220,235,255,1)"
        style="animation:lightningFlash 7s ease-in-out 0s infinite;"/>
      <polyline points="400,20 385,120 405,120 388,240 410,240 380,340"
        fill="none" stroke="rgba(255,255,200,0.95)" stroke-width="3"
        stroke-linejoin="round" stroke-linecap="round"
        style="animation:lightningFlash 7s ease-in-out 0.05s infinite;"/>
    </svg>`;
}

function buildSnowScene() {
    const flakes = [];
    for (let i = 0; i < 50; i++) {
        const cx  = rand(0, 800).toFixed(1);
        const r   = rand(2, 6).toFixed(1);
        const delay = rand(0, 5).toFixed(2);
        const dur   = rand(4, 9).toFixed(2);
        const opacity = rand(0.5, 0.9).toFixed(2);
        flakes.push(`<circle cx="${cx}" cy="-10" r="${r}" fill="rgba(240,248,255,${opacity})"
            style="animation:snowFall ${dur}s ease-in-out ${delay}s infinite;"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      ${flakes.join("\n")}
    </svg>`;
}

function buildFogScene() {
    const yPositions = [80, 180, 270, 360, 430, 520];
    const heights    = [60, 80, 55, 70, 65, 50];
    const durations  = [18, 22, 25, 20, 28, 24];
    const delays     = [0, -6, -12, -4, -9, -16];
    const opacities  = [0.4, 0.3, 0.45, 0.35, 0.3, 0.4];
    const bands = yPositions.map((y, i) =>
        `<ellipse cx="400" cy="${y}" rx="600" ry="${heights[i]}"
            fill="rgba(200,210,215,${opacities[i]})"
            style="animation:fogDrift ${durations[i]}s ease-in-out ${delays[i]}s infinite;"/>`
    );
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      ${bands.join("\n")}
    </svg>`;
}

function buildCloudyDayScene() {
    function cloudGroup(baseX, baseY, scale, opacity, dur, delay) {
        const circles = [
            { cx: 0, cy: 0, r: 40 }, { cx: 45, cy: -15, r: 50 },
            { cx: 95, cy: -5, r: 42 }, { cx: 140, cy: 10, r: 36 }, { cx: -35, cy: 10, r: 32 },
        ];
        const c = circles.map(p =>
            `<circle cx="${baseX + p.cx * scale}" cy="${baseY + p.cy * scale}" r="${p.r * scale}" fill="rgba(230,240,255,${opacity})"/>`
        ).join("");
        return `<g style="animation:cloudDrift ${dur}s linear ${delay}s infinite;">${c}</g>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      ${cloudGroup(-250, 80,  1.0, 0.75, 45, 0)}
      ${cloudGroup(-400, 200, 0.7, 0.55, 60, -20)}
      ${cloudGroup(-150, 320, 0.85, 0.45, 38, -10)}
      ${cloudGroup(-350, 450, 0.6, 0.4, 55, -30)}
    </svg>`;
}

function buildCloudyNightScene() {
    const stars = [];
    for (let i = 0; i < 30; i++) {
        const cx = rand(20, 780).toFixed(1);
        const cy = rand(10, 350).toFixed(1);
        const r  = rand(0.8, 2.0).toFixed(1);
        const delay = rand(0, 4).toFixed(2);
        const dur   = rand(2, 4.5).toFixed(2);
        stars.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(200,215,240,0.8)"
            style="animation:starTwinkle ${dur}s ease-in-out ${delay}s infinite;"/>`);
    }
    function darkCloud(baseX, baseY, scale, opacity, dur, delay) {
        const circles = [
            { cx: 0, cy: 0, r: 40 }, { cx: 45, cy: -15, r: 50 },
            { cx: 95, cy: -5, r: 42 }, { cx: 140, cy: 10, r: 36 }, { cx: -35, cy: 10, r: 32 },
        ];
        const c = circles.map(p =>
            `<circle cx="${baseX + p.cx * scale}" cy="${baseY + p.cy * scale}" r="${p.r * scale}" fill="rgba(40,55,80,${opacity})"/>`
        ).join("");
        return `<g style="animation:cloudDrift ${dur}s linear ${delay}s infinite;">${c}</g>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      ${stars.join("\n")}
      ${darkCloud(-250, 120, 1.0, 0.85, 55, -5)}
      ${darkCloud(-400, 280, 0.75, 0.70, 70, -25)}
      ${darkCloud(-150, 400, 0.9, 0.65, 42, -15)}
    </svg>`;
}

function buildWindyScene() {
    const yPositions = [60, 120, 190, 250, 310, 380, 430, 480, 530, 570, 200, 340];
    const widths     = [300, 450, 380, 500, 420, 350, 480, 320, 460, 390, 510, 370];
    const opacities  = [0.5, 0.4, 0.6, 0.35, 0.5, 0.45, 0.55, 0.4, 0.5, 0.35, 0.45, 0.6];
    const durations  = [3.5, 4.2, 3.0, 5.0, 3.8, 4.5, 3.2, 4.8, 3.6, 5.2, 4.0, 3.4];
    const delays     = [0, -1.5, -0.8, -2.5, -1.0, -3.2, -0.4, -2.0, -1.8, -0.6, -3.0, -1.2];
    const lines = yPositions.map((y, i) => {
        const w = widths[i];
        const d = `M -${(w * 0.1).toFixed(0)},${y} C ${(w * 0.3).toFixed(0)},${y - 25} ${(w * 0.6).toFixed(0)},${y + 20} ${w + 100},${y - 10}`;
        const sw = rand(1.5, 3.5).toFixed(1);
        return `<path d="${d}" fill="none" stroke="rgba(180,205,220,${opacities[i]})" stroke-width="${sw}"
            stroke-linecap="round"
            style="animation:windSweep ${durations[i]}s ease-in-out ${delays[i]}s infinite;"/>`;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      ${lines.join("\n")}
    </svg>`;
}

function renderWeatherScene(state) {
    const container = document.getElementById("weather-scene");
    if (!container) return;
    container.innerHTML = "";
    const builders = {
        [WeatherState.SUNNY]:        buildSunnyScene,
        [WeatherState.NIGHT]:        buildNightScene,
        [WeatherState.RAIN]:         buildRainScene,
        [WeatherState.THUNDERSTORM]: buildThunderstormScene,
        [WeatherState.SNOW]:         buildSnowScene,
        [WeatherState.FOG]:          buildFogScene,
        [WeatherState.CLOUDY_DAY]:   buildCloudyDayScene,
        [WeatherState.CLOUDY_NIGHT]: buildCloudyNightScene,
        [WeatherState.WINDY]:        buildWindyScene,
    };
    const builder = builders[state];
    if (builder) container.innerHTML = builder();
}

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


function renderTemperatures(weather) {
    const temp = isCelsius ? `${weather.tempC} °C` : `${weather.tempF} °F`;
    const feelsLike = isCelsius ? `${weather.feelsLikeC} °C` : `${weather.feelsLikeF} °F`;

    document.getElementById("temperature").innerText = temp;
    document.getElementById("feels-like").innerText = `Feels-like: ${feelsLike}`;

    document.querySelectorAll(".forecast-temp").forEach((el, i) => {
        const day = weather.forecast[i];
        if (day) el.textContent = isCelsius ? `${day.day.avgtemp_c}°C` : `${day.day.avgtemp_f}°F`;
    });

    renderHourlyCards(weather.hourly);

    tempToggleBtn.textContent = isCelsius ? "°C / °F" : "°F / °C";
}

// update UI state
async function updateUIState(weather) {
    currentWeather = weather;
    document.body.style.background = BACKGROUND_MAP[weather.weatherState];
    renderWeatherScene(weather.weatherState);
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
        temp.textContent = "";

        const dateLabel = document.createElement("p");
        dateLabel.className = "text-gray-500 ml-auto";
        dateLabel.textContent = label;

        card.appendChild(img);
        card.appendChild(temp);
        card.appendChild(dateLabel);
        forecastContainer.appendChild(card);
    });

    //alert
    renderTemperatures(weather);

    if (weather.alerts && weather.alerts.length > 0) {
        const alert = weather.alerts[0];

        alertTitle.innerText = alert.headline || alert.event;
        alertDesc.innerText = alert.desc;

        const isLong = alert.desc.length > 100;
        alertDesc.classList.toggle("line-clamp-3", isLong);
        alertDescToggle.classList.toggle("hidden", !isLong);
        alertDescToggle.textContent = "show more";

        alertDescToggle.onclick = () => {
            const collapsed = alertDesc.classList.toggle("line-clamp-3");
            alertDescToggle.textContent = collapsed ? "show more" : "show less";
        };

        const severity = alert.severity?.toLowerCase();
        alertBox.className = "p-4 rounded-xl mb-4";

        if (severity === "severe") {
            alertBox.classList.add("bg-red-200", "text-red-900");
        } else if (severity === "moderate") {
            alertBox.classList.add("bg-yellow-200", "text-yellow-900");
        } else {
            alertBox.classList.add("bg-blue-200", "text-blue-900");
        }

        alertBox.classList.remove("hidden");
    } else {
        alertBox.classList.add("hidden");
    }


    saveCity(weather.cityName);
    loadRecentCities();
}

function renderHourlyCards(hourly) {
    const container = document.getElementById("hourly-cards");
    container.innerHTML = "";

    hourly.forEach(hour => {
        const hourNum = parseInt(hour.time.split(" ")[1].split(":")[0]);
        const isDay = hourNum >= 6 && hourNum < 20;

        const gradientClass = isDay
            ? "from-amber-400 to-amber-300"
            : "from-slate-600 to-slate-800";

        const timeLabel = new Date(hour.time).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        const temp = isCelsius ? `${hour.temp_c}°C` : `${hour.temp_f}°F`;

        const card = document.createElement("div");
        card.className = `hour-card flex flex-col items-center bg-gradient-to-b ${gradientClass} rounded-3xl px-4 sm:px-5 py-5 min-w-24 sm:min-w-25 gap-2 shrink-0`;

        card.innerHTML = `
            <p class="font-bold text-white text-base sm:text-lg">${timeLabel}</p>
            <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" class="w-10 h-10 object-contain">
            <p class="text-white font-bold">${temp}</p>
            <p class="text-white text-sm">${hour.wind_kph} km/h</p>
        `;

        container.appendChild(card);
    });
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
        weatherState: resolveWeatherState(data.current.condition.text, data.current.is_day),
        tz: data.location.tz_id,
        forecast: data.forecast.forecastday,
        hourly: data.forecast.forecastday[0].hour,
        alerts: data.alerts?.alert || []
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
        weatherState: resolveWeatherState(data.current.condition.text, data.current.is_day),
        tz: data.location.tz_id,
        forecast: data.forecast.forecastday,
        hourly: data.forecast.forecastday[0].hour,
        alerts: data.alerts?.alert || []
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
