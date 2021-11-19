const Nightmare = require('nightmare')
const nightmare = Nightmare({ show: false })
const axios = require('axios');
const colors = require('colors');



indicatorList = ['Relative Strength Index (14)',
'Stochastic %K (14, 3, 3)',
'Commodity Channel Index (20)',
'Average Directional Index (14)',
'Awesome Oscillator',
'Momentum (10)',
'MACD Level (12, 27)',
'Stochastic RSI Fast (3, 3, 14, 14)',
'Williams Percent Range (14)',
'Bull Bear Power',
'Ultimate Oscillator (7, 14, 28)',
'Exponential Moving Average (10)',
'Simple Moving Average (10)',
'Exponential Moving Average (20)',
'Simple Moving Average (20)',
'Exponential Moving Average (30)',
'Simple Moving Average (30)',
'Exponential Moving Average (50)',
'Simple Moving Average (50)',
'Exponential Moving Average (100)',
'Simple Moving Average (100)',
'Exponential Moving Average (200)',
'Simple Moving Average (200)',
'Ichimoku Cloud Base Line (9, 26, 52, 26)',
'Volume Weighted Moving Average (20)',
'Hull Moving Average (9)']


function getTradingviewIndicators(timeScale){
    let times = {'1m': 0, '5m': 1, '15m': 2, '1h': 3, '4h': 4, '1d': 5}
    let num = times[timeScale]
    let indicators = [];
    return new Promise((resolve, reject) => {
        nightmare
        .goto('https://www.tradingview.com/symbols/EURUSD/technicals/')
        .evaluate(num => {
            let selection = document.getElementsByClassName('itemContent-OyUxIzTS-')[num]
            selection.click()
        }, num)
        .wait(num => {
            let list = []
            function check(element){
                if (element == '—'){
                    return true
                }
            }
            let elements = document.getElementsByClassName('cell-6KbOCOru-')
            for (let i in elements) {
                list.push(elements[i].innerText)
                if (elements[i].innerText == 'Pivot'){
                    break
                }
            }
            if (!list.includes('—')){
                return true
            }
            else if (num == 5 && list[list.findIndex(check) - 1] == 'Volume Weighted Moving Average (20)'){
                return true
            }
        }, num)
        .evaluate(indicators => {
            let elements = document.getElementsByClassName('cell-6KbOCOru-')
            for (let i in elements) {
                indicators.push(elements[i].innerText)
                if (elements[i].innerText == 'Pivot'){
                    break
                }
            }
            return indicators
        }, indicators)
        .then(indicators => {
            // console.log(indicators)
            resolve(indicators)
        })
        .catch(error => {
            console.error('Search failed:', error)
        })
    })

}


var tradingviewIndicators = {}
var buyRating = 0
var sellRating = 0
function filltradingview(){
    getTradingviewIndicators('15m')
    .then(result => {
        buyRating = 0
        sellRating = 0
        for (let i in result){
            if (indicatorList.includes(result[i])){
                tradingviewIndicators[result[i]] = parseFloat(result[parseFloat(i)+1])      // indicator values
                tradingviewIndicators[result[i]] = result[parseFloat(i)+2]      // buy/sell
            }
        }
        let values = Object.values(tradingviewIndicators)
        for (let j in values){
            if (values[j] == 'Buy'){
                buyRating++
            }
            if (values[j] == 'Sell'){
                sellRating++
            }
        }
        // console.log(buyRating, sellRating)      // out of 26
    })
}


var eurusd = {}
function getRates(){
    axios.get('http://webrates.truefx.com/rates/connect.html?f=csv&c=EUR/USD')
    .then(res => {
        let bid = res.data.split(',')[2] + res.data.split(',')[3]
        let ask = res.data.split(',')[4] + res.data.split(',')[5]
        eurusd['bid'] = bid
        eurusd['ask'] = ask
    })
}


function compare(){
    var buy
    var sell
    if (buyRating > sellRating){
        buy = (buyRating - sellRating).toString().green
        // sell = sellRating.toString()
    }
    else {
        buy = (buyRating - sellRating).toString().red
        // buy = buyRating.toString()
    }
    let oldPrice = eurusd['bid']
    setTimeout(() => {
        var price
        newPrice = eurusd['bid']
        if (newPrice > oldPrice){
            price = Math.round(newPrice*1e5 - oldPrice*1e5).toString().green
        }
        else {
            price = Math.round(newPrice*1e5 - oldPrice*1e5).toString().red
        }
        console.log('15min REPORT:', buy, price)
        compare()
    }, 900e3)
}


setInterval(getRates, 5e3)
setInterval(filltradingview, 10e3)
// setInterval(compare, 900e3)

setTimeout(compare, 30e3)