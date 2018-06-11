const request = require('request-promise-native');
const endpoint = 'http://localhost:3000/tracking';

const get = () =>{
    return request.get(endpoint);
}

export default {
    get
}