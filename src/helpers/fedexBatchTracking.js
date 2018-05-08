import soap from "soap";
const credentials = require('./data/credentials.json');
// const wsdl = "./wsdata/TrackService/TrackService_v14.wsdl";
// const TRACK_PATH = "http://fedex.com/ws/track/v14";

const auth = {
    key: credentials.webSvcSandbox.key,
    password: credentials.webSvcSandbox.secret,
    accountNum: credentials.webSvcSandbox.acctNum,
    meterNum: credentials.webSvcSandbox.meterNum,
    testUrl: credentials.webSvcSandbox.url,
}

const chunkArray = (arr, chunk_size) => {
    let results = [];
    while (arr.length){
        results.push(arr.splice(0, chunk_size))
    }
    return results;
}

async function fedexBatchTrack(trackingNumbers){

    const batches = trackingNumbers.length > 30 
                    ? chunkArray(trackingNumbers, 30)
                    : trackingNumbers;
    
                    console.log(`There will be ${batches.length} calls to the Fedex Tracking API.`)

    let promiseArray = [];

    batches.forEach(batch => {

        const selDetails = batch.map(trckNo => {
            return {
                PackageIdentifier: {
                    Type: "TRACKING_NUMBER_OR_DOORTAG",
                    Value: trckNo
                }
            }
        });

        const request = {
            WebAuthenticationDetail: {
                UserCredential: {
                    Key: auth.key,
                    Password: auth.password,
                },
            },
            ClientDetail: {
                AccountNumber: auth.accountNum,
                MeterNumber: auth.meterNum,
            },
            Version: {
                ServiceId: "trck",
                Major: "14",
                Intermediate: "0",
                Minor: "0",
            },
            SelectionDetails: selDetails,
        }
        
        const thisPromise = new Promise((resolve, reject) =>{
            soap.createClientAsync(__dirname + '/wsdata/TrackService/TrackService_v14.wsdl', {namespaceArrayElements: true})
                .then((client) => {
                    return client.trackAsync(request);
                })
                .then((result) => {
                    /* Unexpected behavior:
                    result with async method returns an array that contains JSON [0] and the SOAP XML
                    */
                    const results = result[0].CompletedTrackDetails;
                    const trckData = (results ? results.map(t=>{
                        return {
                            trackingNo: t.TrackDetails[0].TrackingNumber,
                            ...(t.TrackDetails[0].StatusDetail
                                ? {status: t.TrackDetails[0].StatusDetail.Description} 
                                : {status: 'No status'})
                        }
                    }) : null);
                    trckData
                        ? resolve(trckData)
                        : reject(trckData)
                });
        });
        return promiseArray.push(thisPromise);
    });
    return await Promise.all(promiseArray);
}

export default fedexBatchTrack;
