import React, { Component } from 'react';
import './App.css';
import ReactTable from "react-table";
import moment from 'moment';
import 'react-table/react-table.css';
import getTracking from './helpers/getTracking';
import {CSVLink} from 'react-csv';
import logo from './rc-logo.png';
import beta from './beta.png';
import ReactLoading from 'react-loading';
const scheduler = require('node-schedule');


class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      results: null,
      btnClicked: false,
      isLoading: true,
    }

    this.fetchTracking = this.fetchTracking.bind(this);

    const job = scheduler.scheduleJob('12 * * * *', ()=>{
      getTracking.get()
      .then(data=>{
        this.setState({results: JSON.parse(data)});
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
    getTracking.get()
      .then(data=>{
        this.setState({results: JSON.parse(data)});
        this.setState({isLoading: false});
      })
      .catch(err=>{console.log(err);})
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
          columns={columns}
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
  Cell: props => <a href={`https://www.fedex.com/apps/fedextrack/?tracknumbers=${props.value}`} target="_blank">{props.value}</a>,
},{
  Header: 'Order No.',
  accessor: 'orderNum',
}, {
  Header: 'Status',
  id: "lastStatus",
  accessor: d => d.lastStatus,
  Cell: row => (
    <div style={{
      color:
        row.value && ["delivery exception", "shipment exception"].includes(row.value.toLowerCase())
        ? "#ff3721" 
        : row.value && row.value.toLowerCase() === "shipment information sent to fedex" ? "#4286f4" : "#1ebc09",
    }}>{row.value}</div>
  ),
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
        return row[filter.id].toLowerCase() === "shipment information sent to fedex";
    }
    if (filter.value === "exception"){
      if (row[filter.id])
        return row[filter.id].toLowerCase() === "delivery exception" || row[filter.id].toLowerCase() === 'shipment exception';
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
      <option value="infoSent">Shipment info sent</option>
    </select>
}, {
  Header: 'Scanned?',
  id: "scanned",
  accessor: d => {
    if (d.lastStatus && !['delivery exception', 'shipment exception', 'shipment information sent to fedex'].includes(d.lastStatus.toLowerCase())
        && Number(moment().date()) > Number(moment(d.shipDate).format("DD"))){
        return '✔';
    }
    else {
      return 'X';
    }
  },
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
  accessor: d => {
    if (d.shipDate)
      return moment(d.shipDate)
        .local()
        .format("MM-DD-YYYY");
  },
}, {
  id: 'actualShipDate',
  Header: 'Date In Transit',
  accessor: d => {
    if (d.actualShipDate)
      return moment(d.actualShipDate)
        .local()
        .format("MM-DD-YYYY");
  }
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
