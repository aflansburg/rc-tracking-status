const request = require('request-promise-native');
const endpoint = 'http://192.168.1.242:3000/tracking';

const get = () =>{
    return request.get(endpoint);
}

export default {
    get
}