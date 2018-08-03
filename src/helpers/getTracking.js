const request = require('request-promise-native');

// this is the endpoint for the REST API
const settings = require('./data/settings.json');

function get () {
    return request.get(`http://${settings.endpoint}/tracking`);
}

export default {
    get
}