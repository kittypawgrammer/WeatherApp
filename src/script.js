const API_KEY = "20dbdf7e66e949ee83982724263004";

let cityInput = document.querySelector("#city-input");
let searchBtn = document.querySelector("#search-btn");
let recentCities = document.querySelector("#recent-cities");


let timeInterval = null;

function saveCity(city) {
    // Get old cities from storage
    let cities = localStorage.getItem("recentCities");

    // Convert string → array (if exists)
    if (cities) {
        cities = JSON.parse(cities);
    } else {
        cities = [];
    }
    // Make first letter capital (Delhi, Mumbai)
    city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    // Check if city already exists
    if (cities.includes(city)) {
        return; // stop if duplicate
    }

    // Add new city at beginning
    cities.unshift(city);

    // Keep only last 5 cities
    if (cities.length > 5) {
        cities.pop();
    }

    // Save back to localStorage
    localStorage.setItem("recentCities", JSON.stringify(cities));


}

function loadRecentCities() {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];

    // clear old options
    recentCities.innerHTML = `<option value="">Select a city</option>`;

    cities.forEach(city => {
        let option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        recentCities.appendChild(option);
    });
}

let getData = async (city) => {

    if (!city) {
        alert("Please enter a city name");
        return;
    }

    try {
        let url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=yes&alerts=yes`;
        let response = await fetch(url);
        let data = await response.json();

        console.log(data);

        if (data.error) {
            alert("City not found");
            return;
        }

        // document.getElementById("recent-cities");

        //set current time based on city's timezone
        const tz = data.location.tz_id;

        function updateTime() {
            const now = new Date();

            document.getElementById("live-time").innerText =
                now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });

            document.getElementById("current-date").innerText =
                now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }

        if (timeInterval) clearInterval(timeInterval);

        updateTime();

        timeInterval = setInterval(updateTime, 1000);

        //get all data from api:

        document.getElementById("city-name").innerText =
            `${data.location.name}, ${data.location.country}`;

        document.getElementById("temperature").innerText =
            `${data.current.temp_c}` + "°C";

        document.getElementById("feels-like").innerText =
            `Feels-like:` + `${data.current.feelslike_c}`;

        document.getElementById("sunrise").innerText =
            `${data.forecast.forecastday[0].astro.sunrise}`;

        document.getElementById("sunset").innerText =
            `${data.forecast.forecastday[0].astro.sunset}`;

        document.getElementById("humidity").innerText =
            `${data.current.humidity}` + "%";

        document.getElementById("wind-speed").innerText =
            `${data.current.wind_kph}` + "kph";

        document.getElementById("pressure").innerText =
            `${data.current.pressure_in}` + " in";

        document.getElementById("uv-index").innerText =
            `${data.current.uv}`;

        document.getElementById("weather-icon").src =
             "https:" + data.forecast.forecastday[0].day.condition.icon;

         document.getElementById("weather-condition").innerText =
            `${data.forecast.forecastday[0].day.condition.text}`;

        // 5-day forecast
        const forecastContainer = document.getElementById("forecast-cards");
        forecastContainer.innerHTML = "";

        data.forecast.forecastday.forEach(day => {
            const date = new Date(day.date + "T12:00:00");
            const label = date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

            const card = document.createElement("div");
            card.className = "forecast-card flex items-center gap-4";

            const img = document.createElement("img");
            img.src = `https:${day.day.condition.icon}`;
            img.alt = day.day.condition.text;
            img.className = "w-10 h-10 object-contain";

            const temp = document.createElement("p");
            temp.className = "font-bold w-14";
            temp.textContent = `${day.day.avgtemp_c}°C`;

            const dateLabel = document.createElement("p");
            dateLabel.className = "text-gray-500 ml-auto";
            dateLabel.textContent = label;

            card.appendChild(img);
            card.appendChild(temp);
            card.appendChild(dateLabel);
            forecastContainer.appendChild(card);
        });

        saveCity(city);
        loadRecentCities();


    } catch (error) {
        console.log("Error:", error);
    }


};

// Enter key on input
cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        getData(cityInput.value);
        cityInput.value = "";
    }
});


//Recent search
recentCities.addEventListener("change", (e) => {
    let selectedCity = e.target.value;

    if (selectedCity) {
        getData(selectedCity);
    }
});

loadRecentCities();
