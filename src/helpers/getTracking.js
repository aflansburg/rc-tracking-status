const request = require('request-promise-native');
// this is the endpoint for the REST API
const endpoint = 'http://192.168.1.251:3000/tracking';

const get = () =>{
    return request.get(endpoint);
}

export default {
    get
}