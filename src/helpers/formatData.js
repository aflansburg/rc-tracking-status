const moment = require('moment');

export default function formatData(data){
    data = JSON.parse(data);
    data = data.filter(d => d.trackingNum !== null);
    data = data.filter(d => d.trackingNum !== undefined);    
    data.forEach(d=>{
        if (d.lastLocation && d.lastLocation.City && d.lastLocation.StateOrProvinceCode){
            d.lastLocation = `${d.lastLocation.City}, ${d.lastLocation.StateOrProvinceCode}`
        }
        else {
            d.lastLocation = ''
        }
        // mongodb stores dates as GMT - this will do a +7 offset to hit CST (can add options for other timezones at a later date)
        if (d.shipDate){
            d.shipDate = String(moment(d.shipDate).utcOffset(300).format('M/D/YYYY'));
        }
        if (d.shipmentCreated){
            d.shipmentCreated = String(moment(d.shipmentCreated).utcOffset(300).format('M/D/YYYY'));
        }
        if (d.warehouse === 'W3'){
            d.warehouse = 'W3 - Newbern';
        }
        if (d.warehouse === 'W6'){
            d.warehouse = 'W6 - Reno';
        }
            
    })
    return data;
}