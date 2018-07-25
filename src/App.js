import React, { Component } from 'react';
import './App.css';
import ReactTable from "react-table";
import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import moment from 'moment';
import 'react-table/react-table.css';
import getTracking from './helpers/getTracking';
import {CSVLink} from 'react-csv';
import logo from './rc-logo.png';
import beta from './beta.png';
import ReactLoading from 'react-loading';
import formatData from './helpers/formatData';
import Popup from "reactjs-popup";
import matchSorter from 'match-sorter';
const scheduler = require('node-schedule');

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      results: null,
      btnClicked: false,
      isLoading: true,
      lastRefresh: '',
      requestedOrder: false,
      filtered: false,
    }

    this.fetchTracking = this.fetchTracking.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);

    scheduler.scheduleJob('12 * * * *', ()=>{
      getTracking.get()
      .then(data=>{
        data = formatData(data);
        this.setState({results: data});
        this.setState({lastRefresh: moment().format('MMMM Do YYYY, h:mm:ss a')});
        console.log('Results updated');
      })
      .catch(err=>{console.log(err);})
    })
  }
  // will need to migrate with deprecation of this method to componentDidMount()
  componentWillMount(){
    this.setState({isLoading: true});
    this.fetchTracking();
  }

  componentDidMount(){
    if (window.location.pathname){
      let so = window.location.pathname;
      so = so[0] === '/' ? so.substr(1) : so;
      this.setState({requestedOrder: so, filtered: true});
    }
  }

  fetchTracking(event){
    this.setState({isLoading: true});
    this.setState({btnClicked: true});
    this.setState({lastRefresh: moment().format('MMMM Do YYYY, h:mm:ss a')});
    getTracking.get()
      .then(data=>{
        data = formatData(data);
        this.setState({results: data});
        this.setState({isLoading: false});
      })
      .catch(err=>{console.log(err);})
  }
  handleDateChange(date){
    this.setState({selectedDate: date})
  }
  
  render() {

    const list = this.state.results;

    const modalStyle = {
      maxWidth: "480px",
      width: "100%",
    }

    const updates = () =>{ 
      return(
        <div className="version-notes">
          <ul>
            <li><b>7/24/18 14:08pm:</b> The backend API engine has been updated to include Warehouse 
            location codes and implementation for better 'Reason' text search filtering.</li>
          </ul>
        </div>
      )}

    return (
      <div className="App">
      {this.state.isLoading 
        ? <div className="loading-container">
            <ReactLoading type="spokes" color="#FF0F0F" className="loading-animation"/>
          </div> 
        : null}
        <header className="App-header">
          <img src={logo} alt="Rough Country Logo"/>
          <h1 className="App-title">Tracking Status</h1>
          <img src={beta} className="beta-img" alt="beta"/>
          <div className="version-interactions">
            <Popup trigger={<Button className="version-btn">Version Notes</Button>}
                   position="left center" contentStyle={modalStyle}>
              {updates}
            </Popup>
          </div>
        </header>
        <div className="last-refresh">
          <b>Last refresh:{"\t"}</b>
          {this.state.lastRefresh}
        </div>
        <div className="interactions">
          <Button 
            onClick={() => this.fetchTracking()}
            // className="fetch-btn pulse"
            className={this.state.btnClicked ? 'fetch-btn' : 'fetch-btn pulse' }
          >
            {this.state.btnClicked ? 'Refresh Data' : 'Get Tracking'}
          </Button>
          <div className="post-interactions">
          {list
          // need to set to download filtered list
            ? <Button className="fetch-btn csvlink-btn pulse-after">
                <CSVLink className="csvlink" filename={"tracking_data.csv"} data={list} target="_blank">
                  Download CSV
                </CSVLink>
              </Button>
            : null }
            
          </div>
        </div>
         {list
          ? <ReactTable
          className='-striped -highlight'
          data={list}
          columns={columns()}
          defaultFiltered={this.state.requestedOrder
                    ? [{id: 'orderNum',
                        value: this.state.requestedOrder}]
                    : [{}]}
          filterable
          // uncomment following for fixed scrolling header - causes issue
          // defaultPageSize={20}
          // style={{
            // height: "800px" // This will force the table body to overflow and scroll, since there is not enough room
          // }}
          />
          : null
         }
      </div>
    );
  }
}

const columns = () => [{
  Header: 'Tracking No.',
  accessor: 'trackingNum',
  Cell: props => (
    // <a href={`https://www.fedex.com/apps/fedextrack/?tracknumbers=${props.value}`} target="_blank">{props.value}</a>,
    <a href={
      props.value && props.value.startsWith('4')
      ? `https://www.fedex.com/apps/fedextrack/?tracknumbers=${props.value}`
      : props.value.startsWith('9') ? `https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=2&text28777=&tLabels=${props.value}%2C`
      : `https://www.ontrac.com/trackingresults.asp?tracking_number=${props.value}`
    } target="_blank">{props.value}</a>
  ),
  width: 210,
  filterMethod: (filter, row) =>{
    if (filter.value === "all"){
      return true;
    }
    if (filter.value === "fedex"){
      if (row[filter.id])
        return row[filter.id].startsWith("4")
    }
    if (filter.value === "usps"){
      if (row[filter.id])
        return row[filter.id].startsWith("9")
    }
    if (filter.value === "ontrac"){
      if (row[filter.id])
        return row[filter.id].startsWith("C")
    }
  },
  Filter: ({ filter, onChange }) =>
  <select onChange={event=> onChange(event.target.value)}
  style={{width: "100%"}}
  value={filter ? filter.value : "all"}>
    <option value="all">Show All</option>
    <option value="fedex">FedEx</option>
    <option value="usps">USPS</option>
    <option value="ontrac">Ontrac</option>
  </select>
},{
  Header: 'Order No.',
  accessor: 'orderNum',
  width: 100,
}, {
  Header: 'Status',
  id: "lastStatus",
  accessor: d => d.lastStatus,
  Cell: row => (
    <div style={{
      color:
        row.value && ["delivery exception", "shipment exception", "will arrive late", 
                      "exception: incorrect/incomplete address - unable to deliver"].includes(row.value.toLowerCase())
        ? "#ff3721" 
        : row.value && ['label created', 'shipment information sent to fedex', 'pending', 'no status information',
                        'shipping label created, usps awaiting item', 'no data at this time', 'no status'].includes(row.value.toLowerCase()) ? "#4286f4" : "#1ebc09",
    }}>{row.value}</div>
  ),
  width: 350,
  filterMethod: (filter, row) => {
    if (filter.value === "all"){
      return true;
    }
    if (filter.value === "delivered"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "delivered";
    }
    if (filter.value === "inTransit"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "in transit";
    }
    if (filter.value === "arrived"){
      if (row[filter.id])
        return ['arrived at usps regional origin facility', 'arrived at usps regional origin facility',
                'arrived at fedex location'].includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "departed"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "departed fedex location";
        return ['departed usps regional origin facility', 'departed usps regional origin facility',
                'departed fedex location'].includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "onVehicle"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "on fedex vehicle for delivery";
    }
    if (filter.value === "infoSent"){
      if (row[filter.id])
        return ['label created', 'shipment information sent to fedex', 'pending', 'no status information',
                'shipping label created, usps awaiting item', 'no status'].includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "exception"){
      if (row[filter.id])
        return ["delivery exception", "shipment exception", "will arrive late", 
                "exception: incorrect/incomplete address - unable to deliver"].includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "postOfficePickup"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "at post office ready for pickup";
    }
    if (filter.value === "outForDelivery"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "out for delivery";
    }
    if (filter.value === 'arrivedPostOffice'){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "arrived at post office"
    }
    if (filter.value === 'forwarded'){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "forwarded to address"
    }
  },
  Filter: ({ filter, onChange }) =>
    <select
      onChange={event => onChange(event.target.value)}
      style={{ width: "100%"}}
      value={filter ? filter.value : "all"}
    >
      <option value="all">Show All</option>
      <option value="exception">Exception</option>
      <option value="infoSent">Label Created</option>
      <option value="inTransit">In Transit</option>
      <option value="arrived">Arrived At Carrier Facility</option>
      <option value="departed">Departed Carrier Facility</option>
      <option value="onVehicle">On FedEx vehicle</option>
      <option value="postOfficePickup">Ready for Pickup</option>
      <option value="forwarded">Forwarded</option>
      <option value="outForDelivery">Out for delivery</option>
      <option value="delivered">Delivered</option>
    </select>
}, {
  Header: 'Scanned?',
  id: "scanned",
  accessor: d => {
    if (d.lastStatus && 
        ["delivery exception", "shipment exception", "will arrive late", 
         "exception: incorrect/incomplete address - unable to deliver"].includes(d.lastStatus.toLowerCase())){
        return 'X';
    }
    else if (d.lastStatus && ['shipment information sent to fedex', 
        'no data at this time', 'label created', 'pending', 'shipping label created, usps awaiting item', 'no status'].includes(d.lastStatus.toLowerCase()) && d.shipDate <= moment().add(-1, 'days').local().format('M/D/YYYY')){
      return 'X';
    }
    else if (!d.shipDate){
      return 'X';
    }
    else if (d.lastStatus && !['on fedex vehicle for delivery', 'arrived at fedex location', 'at fedex destination facility',
                  'departed fedex location'].includes(d.lastStatus.toLowerCase())){
        return '✔';
    }
    else if (!d.lastStatus){
      return 'X';
    }
    else {
      return '✔';
    }
  },
  width: 115,
  Cell: row => (
    <div style={{
      color:
        row.value && row.value === 'X'
        ? "#ff3721" 
        : "#4286f4"
    }}>{row.value}</div>
  ),
  filterMethod: (filter, row) => {
    if (filter.value === "all"){
      return true;
    }
    if (filter.value === "Yes"){
      if (row[filter.id])
        return row[filter.id] === "✔";
    }
    if (filter.value === "No"){
      if (row[filter.id])
        return row[filter.id] === "X";
    }
  },
  Filter: ({ filter, onChange }) =>
    <select
      onChange={event => onChange(event.target.value)}
      style={{ width: "100%"}}
      value={filter ? filter.value : "all"}
    >
      <option value="all">Show All</option>
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>
},
{
  // id: 'shipDate',
  // Header: 'Ship Date',
  // accessor: 'shipDate',
  id: 'shipmentCreated',
  Header: 'Ship Date',
  accessor: 'shipmentCreated',
  width: 115,
  filterMethod: (filter, row) => {
    if (filter.value === "all"){
      return true;
    }
    if (filter.value === moment().local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment().local().format('l');
    }
    if (filter.value === moment(moment().add(-1, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-1, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-2, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-2, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-3, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-3, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-4, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-4, 'days')).local().format('l');
    }
  },
  Filter: ({ filter, onChange }) =>
    <select
      onChange={event => onChange(event.target.value)}
      style={{ width: "100%"}}
      value={filter ? filter.value : "all"}
    >
      <option value="all">Show All</option>
      <option value={moment().format('l')}>{moment().format('l')}</option>
      <option value={moment(moment().add(-1, 'days')).format('l')}>{moment(moment().add(-1, 'days')).format('l')}</option>
      <option value={moment(moment().add(-2, 'days')).format('l')}>{moment(moment().add(-2, 'days')).format('l')}</option>
      <option value={moment(moment().add(-3, 'days')).format('l')}>{moment(moment().add(-3, 'days')).format('l')}</option>
      {/* <option value={moment(moment().add(-4, 'days')).format('l')}>{moment(moment().add(-4, 'days')).format('l')}</option> */}
    </select>
}
// ,{
//   id: 'shipmentCreated',
//   Header: 'Created',
//   accessor: 'shipmentCreated',
//   width: 125,
//   filterMethod: (filter, row) => {
//     if (filter.value === "all"){
//       return true;
//     }
//     if (filter.value === moment().local().format('l')){
//       if (row[filter.id])
//         return row[filter.id] === moment().local().format('l');
//     }
//     if (filter.value === moment(moment().add(-1, 'days')).local().format('l')){
//       if (row[filter.id])
//         return row[filter.id] === moment(moment().add(-1, 'days')).local().format('l');
//     }
//     if (filter.value === moment(moment().add(-2, 'days')).local().format('l')){
//       if (row[filter.id])
//         return row[filter.id] === moment(moment().add(-2, 'days')).local().format('l');
//     }
//     if (filter.value === moment(moment().add(-3, 'days')).local().format('l')){
//       if (row[filter.id])
//         return row[filter.id] === moment(moment().add(-3, 'days')).local().format('l');
//     }
//     if (filter.value === moment(moment().add(-4, 'days')).local().format('l')){
//       if (row[filter.id])
//         return row[filter.id] === moment(moment().add(-4, 'days')).local().format('l');
//     }
//   },
//   Filter: ({ filter, onChange }) =>
//     <select
//       onChange={event => onChange(event.target.value)}
//       style={{ width: "100%"}}
//       value={filter ? filter.value : "all"}
//     >
//       <option value="all">Show All</option>
//       <option value={moment().format('l')}>{moment().format('l')}</option>
//       <option value={moment(moment().add(-1, 'days')).format('l')}>{moment(moment().add(-1, 'days')).format('l')}</option>
//       <option value={moment(moment().add(-2, 'days')).format('l')}>{moment(moment().add(-2, 'days')).format('l')}</option>
//       <option value={moment(moment().add(-3, 'days')).format('l')}>{moment(moment().add(-3, 'days')).format('l')}</option>
//       <option value={moment(moment().add(-4, 'days')).format('l')}>{moment(moment().add(-4, 'days')).format('l')}</option>
//     </select>
// }
,{
  id: 'warehouse',
  Header: 'Warehouse',
  accessor: 'warehouse',
  width: 120,
  filterMethod: (filter, row) => {
    if (filter.value === "all"){
      return true;
    }
    if (filter.value === "W3"){
      if (row[filter.id])
        return row[filter.id] === "W3";
    }
    if (filter.value === "W6"){
      if (row[filter.id])
        return row[filter.id] === "W6";
    }
  },
  Filter: ({ filter, onChange }) =>
    <select
      onChange={event => onChange(event.target.value)}
      style={{ width: "100%"}}
      value={filter ? filter.value : "all"}
    >
      <option value="all">Show All</option>
      <option value="W3">W3</option>
      <option value="W6">W6</option>
    </select>
}
,{
  id: 'reason',
  Header: 'Reason',
  accessor: d => d.reason,
  filterMethod: (filter, rows) =>
    matchSorter(rows, filter.value, { threshold: matchSorter.rankings.CONTAINS, keys: ["reason"] }),
  filterAll: true,
}]

const Button = ({ onClick, className, children }) => 
  <button
    onClick={onClick}
    className={className}
    type="button">
    {children}
  </button>

export default App;
