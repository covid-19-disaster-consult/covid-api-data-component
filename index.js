let requestOptions = {
    method: 'GET',
    redirect: 'follow'
    };
let dataArray = [];            //holds parsed data for each country
let globalTotals = [0, 0, 0]; // holds the global number of cases, deaths, and recovered

let refreshPage = setInterval(getData, 1000000); // refreshes api call every 1M seconds

getData();

//****************************************************************************************
// Fetches and parses data from API and accumulates global aggregates for cases, deaths, 
// and recovered.
//****************************************************************************************
function getData() {
    fetch("https://api.covid19api.com/summary", requestOptions)
    .then(res => {
        return res.json();
    }).then(obj => {
        globalTotals = [0, 0, 0];
        console.log(obj);
        idx = 0;
        for (let [key, value] of Object.entries(obj.Countries)) {
            if(!value.Country == '' && !value.Country.includes('The') && !value.Country.includes('Republic ') && !value.Country.includes('(Islamic') && !value.Country.includes('*') && !value.Country.includes('Nam') && !value.Country.includes('SAR') && !value.Country.includes('Russian F') && !value.Country.includes('St.')) {
                let newEntry = {
                    id: idx = 0,
                    country: value.Country == 'US' ? 'United States' : (value.Country == 'Korea, South' ? 'South Korea' : value.Country),
                    totalconfirmed: value.TotalConfirmed,
                    totaldeaths: value.TotalDeaths,
                    totalrecovered: value.TotalRecovered
                }
                idx++;
                dataArray.push(newEntry);
                globalTotals[0] += newEntry.totalconfirmed;
                globalTotals[1] += newEntry.totaldeaths;
                globalTotals[2] += newEntry.totalrecovered;
            }  
            dataArray.sort((a, b) => a.country.localeCompare(b.country));
        }
    })
    .then(() => {
        document.getElementById('globalcases').innerText = "Cases: " + numFormat(globalTotals[0]);
        document.getElementById('globaldeaths').innerText = "Deaths: " + numFormat(globalTotals[1]);
        document.getElementById('globalrecovered').innerText = "Recovered: " + numFormat(globalTotals[2]); 
        populateGlobal(); // calls next function after this one is finished
    })
    .catch(error => console.log('error', error));    
}  

//****************************************************************************************
// Fires when each time a new country is selected from the dropdown. Displays data in the 
// bottom box relevant to the country selected.
//****************************************************************************************
function getDataForCountry(selectedIndex) {
    if(dataArray[selectedIndex]?.totalconfirmed < 1) {
        document.getElementById('currentcountry').setAttribute("style", "color: #00c767");
    }
    else {
        document.getElementById('currentcountry').setAttribute("style", "color: #E800000");
    }
    document.getElementById('currentcountry').innerText = dataArray[selectedIndex]?.country;
    document.getElementById('currentcases').innerText = "Cases: " + numFormat(dataArray[selectedIndex]?.totalconfirmed);
    document.getElementById('currentdeaths').innerText = "Deaths: " + numFormat(dataArray[selectedIndex]?.totaldeaths);
    document.getElementById('currentrecovered').innerText = "Recovered: " + numFormat(dataArray[selectedIndex]?.totalrecovered);
}

//****************************************************************************************
// Populates the dropdown menu drawing from the contents of dataArray.
//****************************************************************************************
function populateGlobal() {
    document.getElementById('select').innerHTML = dataArray
    .map(
            d => d.country == 'United States' ? `<option selected>${d.country}</option>` :  `<option>${d.country}</option>`
        );
    getDataForCountry(document.getElementById('select').selectedIndex); // calls next function after this one is finished
}

function numFormat(num) {
    let s = '';

    let x = 0;
    while(num > 0) {
        if(x % 3 == 0 && x != 0) {
            s+= ',';
        }
        s += num % 10;
        num = Math.floor(num / 10);
        x++;
    }

    return s.split("").reverse().join("") || "0";
}
