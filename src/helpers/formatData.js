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
    })
    return data;
}