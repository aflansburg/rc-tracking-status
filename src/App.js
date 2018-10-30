import React, { Component } from 'react';
import './App.css';
import ReactTable from 'react-table';
import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import moment from 'moment';
import 'react-table/react-table.css';
import getTracking from './helpers/getTracking';
import logo from './rc-logo.png';
import ReactLoading from 'react-loading';
import formatData from './helpers/formatData';
import Popup from "reactjs-popup";
import matchSorter from 'match-sorter';
import statuses from './helpers/data/statuses';
const scheduler = require('node-schedule');

function downloadCSV(data){
  let hiddenElement = document.createElement('a');
  document.body.appendChild(hiddenElement);
  let csvContent = "trackingNum,orderNum,lastStatus,scanned,shipmentCreated,warehouse,reason\r\n";
  data.forEach(item=>{
    Object.keys(item).forEach(k=>{
      if (!["_original", "_index", "_subRows", "_nestingLevel"].includes(k)){
        csvContent += item[k] + ",";
      }
    })
    csvContent += "\r\n";
  })
  let csv = new Blob([csvContent], { type: 'text/csv' });
  hiddenElement.href = URL.createObjectURL(csv);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'tracking_data.csv';
  hiddenElement.click();
  document.body.removeChild(hiddenElement);
 }


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
    // this.downloadFilteredData = this.downloadFilteredData.bind(this);

    // React table dataset refresh job (reloads tracking)
    scheduler.scheduleJob('20 * * * *', ()=>{
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

  componentDidMount(){
    if (window.location.pathname){
      let so = window.location.pathname;
      so = so[0] === '/' ? so.substr(1) : so;
      this.setState({requestedOrder: so, filtered: true});
      console.log(so);
    }
    this.fetchTracking();
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
          <li>10/30/2018 - v2.0 -- Support for UPS added; removed deprecated index method from database client; migrated to new url parser</li>
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
          <h1 className="App-title">Order Tracking Statuses</h1>
        </header>
        <div className="version-interactions">
            <Popup trigger={<Button id="version-btn" className="version-btn">Version Notes</Button>}
                    position="left center" contentStyle={modalStyle}>
              {updates}
            </Popup>
          </div>
          <div className="last-refresh">
            <b>Last refresh:{"\t"}</b>
            {this.state.lastRefresh}
          </div>
          <div className="interactions">
            <Button 
              onClick={() => this.fetchTracking()}
              className={this.state.btnClicked ? 'fetch-btn' : 'fetch-btn pulse' }
            >
              {this.state.btnClicked ? 'Refresh Data' : 'Get Tracking'}
            </Button>
            <div className="post-interactions">
            {list
            // need to set to download filtered list */}
              ? <Button className="fetch-btn csvlink-btn pulse-after" 
                  onClick={() => downloadCSV(
                                    this.refs.table.getResolvedState().sortedData
                                    ? this.refs.table.getResolvedState().sortedData
                                    : list)}>
                  Download CSV
                </Button>
              : null }
            </div>
            
        </div>
         {list
          ? <ReactTable
          ref="table"
          className='-striped -highlight'
          data={list}
          columns={columns}
          defaultFiltered={this.state.requestedOrder
            ? [{id: 'orderNum',
                value: this.state.requestedOrder}]
            : [{}]}
          filterable
          />
          : null
         }
         
      </div>
      
    );
  }
}

const columns = [{
  Header: 'Tracking No.',
  accessor: 'trackingNum',
  Cell: props => (
    // <a href={`https://www.fedex.com/apps/fedextrack/?tracknumbers=${props.value}`} target="_blank">{props.value}</a>,
    <a href={
      props.value && props.value.startsWith('4')
      ? `https://www.fedex.com/apps/fedextrack/?tracknumbers=${props.value}`
      : props.value.startsWith('9') ? `https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=2&text28777=&tLabels=${props.value}%2C`
      : props.value.startsWith('C') ? `https://www.ontrac.com/trackingresults.asp?tracking_number=${props.value}` 
      : `https://www.ups.com/track?loc=en_US&tracknum=${props.value}`
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
    if (filter.value === "ups"){
      if (row[filter.id])
        return row[filter.id].startsWith("1Z");
    }
  },
  Filter: ({ filter, onChange }) =>
  <select onChange={event=> onChange(event.target.value)}
  style={{width: "100%"}}
  value={filter ? filter.value : "all"}>
    <option value="all">Show All</option>
    <option value="ups">UPS</option>
    <option value="usps">USPS</option>
    <option value="ontrac">Ontrac</option>
    <option value="fedex">FedEx</option>
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
        row.value && statuses.exceptions.includes(row.value.toLowerCase())
        ? "#ff3721" 
        : row.value && statuses.labelCreated.includes(row.value.toLowerCase()) ? "#4286f4" : "#1ebc09",
    }}>{row.value}</div>
  ),
  width: 350,
  filterMethod: (filter, row) => {
    if (filter.value === "all"){
      return true;
    }
    if (filter.value === "delivered"){
      if (row[filter.id])
        return statuses.delivered.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "inTransit"){
      if (row[filter.id])
        return statuses.inTransit.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "arrivedCarrier"){
      if (row[filter.id])
        return statuses.arrivedCarrier.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "departedCarrier"){
      if (row[filter.id])
        return statuses.departedCarrier.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "onVehicle"){
      if (row[filter.id])
        return statuses.onVehicle.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "labelCreated"){
      if (row[filter.id])
        return statuses.labelCreated.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "exception"){
      if (row[filter.id])
        return statuses.exceptions.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "readyForPickup"){
      if (row[filter.id])
        return statuses.readyForPickup.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === "outForDelivery"){
      if (row[filter.id])
        return statuses.outForDelivery.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === 'forwarded'){
      if (row[filter.id])
        return statuses.forwarded.includes(row[filter.id].toLowerCase());
    }
    if (filter.value === 'customs'){
      if (row[filter.id])
        return statuses.customs.includes(row[filter.id].toLowerCase());
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
      <option value="labelCreated">Label Created</option>
      <option value="inTransit">In Transit</option>
      <option value="arrivedCarrier">Arrived At Carrier Facility</option>
      <option value="departedCarrier">Departed Carrier Facility</option>
      <option value="onVehicle">On Vehicle</option>
      <option value="customs">Customs Clearance</option>
      <option value="readyForPickup">Ready for Pickup</option>
      <option value="forwarded">Forwarded</option>
      <option value="outForDelivery">Out for delivery</option>
      <option value="delivered">Delivered</option>
    </select>
}, {
  Header: 'Scanned?',
  id: "scanned",
  accessor: d => {
    if (d.lastStatus && statuses.labelCreated.includes(d.lastStatus.toLowerCase()) && d.shipmentCreated <= moment().add(-1, 'days').local().format('M/D/YYYY')){
      return 'X';
    }
    else if (!d.shipmentCreated){
      return 'X';
    }
    else if (!d.lastStatus){
      return 'X';
    }
    else if (d.lastStatus.toLowerCase() === 'an error occurred in the request to ups.'){
      return '?';
    }
    else if (!statuses.exceptions.includes(d.lastStatus.toLowerCase())) {
      return '✔';
    }
    else {
      return '✔';
    }
  },
  width: 115,
  Cell: row => (
    <div style={{
      color:
        row.value && row.value === 'X' || row.value === '?'
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
    if (filter.value === moment(moment().add(-5, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-5, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-6, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-6, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-7, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-7, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-8, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-8, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-9, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-9, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-10, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-10, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-11, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-11, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-12, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-12, 'days')).local().format('l');
    }
    if (filter.value === moment(moment().add(-13, 'days')).local().format('l')){
      if (row[filter.id])
        return row[filter.id] === moment(moment().add(-13, 'days')).local().format('l');
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
      <option value={moment(moment().add(-4, 'days')).format('l')}>{moment(moment().add(-4, 'days')).format('l')}</option>
      <option value={moment(moment().add(-5, 'days')).format('l')}>{moment(moment().add(-5, 'days')).format('l')}</option>
      <option value={moment(moment().add(-6, 'days')).format('l')}>{moment(moment().add(-6, 'days')).format('l')}</option>
      <option value={moment(moment().add(-7, 'days')).format('l')}>{moment(moment().add(-7, 'days')).format('l')}</option>
      <option value={moment(moment().add(-8, 'days')).format('l')}>{moment(moment().add(-8, 'days')).format('l')}</option>
      <option value={moment(moment().add(-9, 'days')).format('l')}>{moment(moment().add(-9, 'days')).format('l')}</option>
      {/* <option value={moment(moment().add(-10, 'days')).format('l')}>{moment(moment().add(-10, 'days')).format('l')}</option>
      <option value={moment(moment().add(-11, 'days')).format('l')}>{moment(moment().add(-11, 'days')).format('l')}</option>
      <option value={moment(moment().add(-12, 'days')).format('l')}>{moment(moment().add(-12, 'days')).format('l')}</option>
      <option value={moment(moment().add(-13, 'days')).format('l')}>{moment(moment().add(-13, 'days')).format('l')}</option> */}
    </select>
},
{
  id: 'warehouse',
  Header: 'Warehouse',
  accessor: 'warehouse',
  width: 135,
  filterMethod: (filter, row) => {
    if (filter.value === "all"){
      return true;
    }
    if (filter.value === "W3"){
      if (row[filter.id])
        return row[filter.id] === "W3 - Newbern";
    }
    if (filter.value === "W6"){
      if (row[filter.id])
        return row[filter.id] === "W6 - Reno";
    }
  },
  Filter: ({ filter, onChange }) =>
    <select
      onChange={event => onChange(event.target.value)}
      style={{ width: "100%"}}
      value={filter ? filter.value : "all"}
    >
      <option value="all">Show All</option>
      <option value="W3">W3 - Newbern</option>
      <option value="W6">W6 - Reno</option>
    </select>
}
,{
  id: 'reason',
  Header: 'Details',
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
