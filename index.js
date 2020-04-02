let requestOptions = {
    method: 'GET',
    redirect: 'follow'
    };
let dataArray = [];            //holds parsed data for each country
let globalTotals = [0, 0, 0]; // holds the global number of cases, deaths, and recovered
let allThisData = [];
let chartMap = new Map();

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
        idx = 0;
        for (let [key, value] of Object.entries(obj.Countries)) {
            if(!value.Country == '' && !value.Country.includes('The') && !value.Country.includes('Republic ') && !value.Country.includes('(Islamic') && !value.Country.includes('*') && !value.Country.includes('Nam') && !value.Country.includes('SAR') && !value.Country.includes('Russian F') && !value.Country.includes('St.')) {
                let newEntry = {
                    id: idx = 0,
                    country: value.Country == 'US' ? 'United States' : (value.Country == 'Korea, South' ? 'South Korea' : value.Country),
                    slug: value.Slug,
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
    document.getElementById('currentcountry').innerText = dataArray[selectedIndex]?.country;
    document.getElementById('currentcases').innerText = "Cases: " + numFormat(dataArray[selectedIndex]?.totalconfirmed);
    document.getElementById('currentdeaths').innerText = "Deaths: " + numFormat(dataArray[selectedIndex]?.totaldeaths);
    document.getElementById('currentrecovered').innerText = "Recovered: " + numFormat(dataArray[selectedIndex]?.totalrecovered);
    getDailyByCountry(dataArray[selectedIndex]);
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

function getDailyByCountry(country) {
    document.getElementById('graph').style.display = "none";
    document.getElementById('loading').style.display = "block";
    chartMap.clear();
    fetch("https://api.covid19api.com/country/" + country.slug +"/status/confirmed", requestOptions)
  .then(response => response.json())
  .then(result => allThisData = result)
  .then(_=> {
      let date;
    for(let o of allThisData) {
        if(o.Status == "confirmed") {
            date = new Date(o.Date).getTime();
            chartMap.set(date, (chartMap.get(date) || 0) + o.Cases); 
            console.log(chartMap.get(date) + " cases of COVID in " + country.country);
        }
    }
    makeChart(chartMap);
  })
  .catch(error => console.log('error', error));
}


function makeChart(map) {
    document.getElementById('graph').style.display = "block";
    document.getElementById('loading').style.display = "none";
    const ctx = document.getElementById('graph').getContext('2d');
    let xlabels = [];
    xlabels = Array.from(map.keys());
    for(let i = 0; i < xlabels.length; i++) {
        xlabels[i] = new Date(xlabels[i]).toString().substring(4, 10);
    }
    let ylabels = [];
    ylabels = Array.from(map.values());
    
    const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: xlabels,
        datasets: [{
            label: 'COVID-19 Cases',
            data: ylabels,
            pointRadius: 2,
            backgroundColor: 
                'rgba(232, 0, 0, 0.15)',
            borderColor: 
                'rgba(232, 0, 0, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            xAxes :[{
                ticks: {fontSize: 10}
            }],
            yAxes: [{
                ticks: {
                    fontSize: 10,
                    beginAtZero: true,
                    callback: function(value, index, values) {
                        if(Math.floor(value / 1000) > 1) {
                            return value/1000 + 'k';
                        } else {
                            return value;
                        }
                    }
                }
            }]
        }
    }
});
}
