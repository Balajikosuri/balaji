const request = require('request')

function getGoogleHomePage(finalCallBack) {
  request('http://www.google.com', (error, response, body) => {
    console.error('error:', error)
    finalCallBack(error)
    console.log('statusCode:', response && response.statusCode)
    console.log('body:', body)
    finalCallBack(null, body)
  })
}

module.exports = getGoogleHomePage
getGoogleHomePage()

