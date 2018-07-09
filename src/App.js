import React, { Component } from 'react';
import './App.css';
import ReactTable from "react-table";
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import moment from 'moment';
import 'react-table/react-table.css';
import getTracking from './helpers/getTracking';
import {CSVLink} from 'react-csv';
import logo from './rc-logo.png';
import beta from './beta.png';
import ReactLoading from 'react-loading';
import formatData from './helpers/formatData';
const scheduler = require('node-schedule');

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      results: null,
      btnClicked: false,
      isLoading: true,
      lastRefresh: '',
    }

    this.fetchTracking = this.fetchTracking.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);

    const job = scheduler.scheduleJob('12 * * * *', ()=>{
      getTracking.get()
      .then(data=>{
        data = formatData(data);
        this.setState({results: data});
        console.log('Results updated');
      })
      .catch(err=>{console.log(err);})
    })
  }

  componentWillMount(){
    this.setState({isLoading: true});
    this.fetchTracking();
  }

  fetchTracking(event){
    this.setState({isLoading: true});
    this.setState({btnClicked: true});
    this.setState({lastRefresh: moment().format('MMMM Do YYYY, h:mm:ss a')}),
    getTracking.get()
      .then(data=>{
        data = formatData(data);
        this.setState({results: data});
        this.setState({isLoading: false});
        data.forEach(dd=>{
          if (dd.orderNum === '2294828')
            console.log(JSON.stringify(dd));
        })
      })
      .catch(err=>{console.log(err);})
  }
  handleDateChange(date){
    this.setState({selectedDate: date})
  }
  
  render() {

    const list = this.state.results;
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
          <img src={beta} className="beta-img" alt="beta image"/>
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
        row.value && ["delivery exception", "shipment exception"].includes(row.value.toLowerCase())
        ? "#ff3721" 
        : row.value && ['label created', 'shipment information sent to fedex', 'pending'].includes(row.value.toLowerCase()) ? "#4286f4" : "#1ebc09",
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
        return row[filter.id].toLowerCase() === "arrived at fedex location";
    }
    if (filter.value === "departed"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "departed fedex location";
    }
    if (filter.value === "onVehicle"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "on fedex vehicle for delivery";
    }
    if (filter.value === "infoSent"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "shipment information sent to fedex" || row[filter.id].toLowerCase() === "label created" || row[filter.id].toLowerCase() === "pending";
    }
    if (filter.value === "exception"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "delivery exception" || row[filter.id].toLowerCase() === 'shipment exception';
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
  },
  Filter: ({ filter, onChange }) =>
    <select
      onChange={event => onChange(event.target.value)}
      style={{ width: "100%"}}
      value={filter ? filter.value : "all"}
    >
      <option value="all">Show All</option>
      <option value="delivered">Delivered</option>
      <option value="inTransit">In Transit</option>
      <option value="arrived">Arrived FedEx location</option>
      <option value="departed">Departed FedEx location</option>
      <option value="onVehicle">On FedEx vehicle</option>
      <option value="exception">Exception</option>
      <option value="infoSent">Label Created</option>
      <option value="postOfficePickup">Ready for Pickup</option>
      <option value="outForDelivery">Out for delivery</option>
      <option value="arrivedPostOffice">Arrived at Post Office</option>
    </select>
}, {
  Header: 'Scanned?',
  id: "scanned",
  accessor: d => {
    if (d.lastStatus && ['delivery exception', 'shipment exception'].includes(d.lastStatus.toLowerCase())){
        return 'X';
    }
    else if (d.lastStatus && ['shipment information sent to fedex', 
        'no data at this time', 'label created', 'pending'].includes(d.lastStatus.toLowerCase()) && d.shipDate <= moment().add(-1, 'days').local().format('M/D/YYYY')){
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
  id: 'shipDate',
  Header: 'Ship Date',
  accessor: 'shipDate',
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
    </select>
}, {
  id: 'actualShipDate',
  Header: 'Date In Transit',
  accessor: d => {
    if (d.actualShipDate)
      return moment(d.actualShipDate)
        .local()
        .format("MM-DD-YYYY");
  },
  width: 125,
  // TO DO: add filter for date
}, {
  id: 'reason',
  Header: 'Reason',
  accessor: 'reason',
  // TO DO: add filter for reason
}]

const Button = ({ onClick, className, children }) => 
  <button
    onClick={onClick}
    className={className}
    type="button">
    {children}
  </button>

export default App;
