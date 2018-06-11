import React, { Component } from 'react';
import './App.css';
import getTracking from './helpers/getTracking';
import testTracking from './helpers/data/sample_tracking.json';

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      results: null,
      trackingNo: testTracking.tracking,
    }

    this.fetchTracking = this.fetchTracking.bind(this);
  }

  fetchTracking(event){
    getTracking.get()
      .then(data=>{
        console.log(`data returned: ${data}`);
        this.setState({results: JSON.parse(data)});
        console.log('state should be updated');
      })
      .catch(err=>{console.log(err);})
  }
  
  render() {

    const list = this.state.results;
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Fedex Tracking Status</h1>
        </header>
        <div className="interactions">
          <Button 
            onClick={() => this.fetchTracking()}
            className="fetch-btn"
          >
            Get Tracking
          </Button>
        </div>
        {list
         ? <Table 
            list={list}/>
         : <p>No Data To Display</p>}
      </div>
    );
  }
}

const Table = ({ list }) =>
  <div className="results-table">
    <table>
      <tbody>
        <tr>
          <th>Number</th>
          <th>Status</th>
        </tr>
        {list.map(item=>{
          <tr>
            <td>
              {item.trackingNum}
            </td>
            <td>
              {item.lastStatus}
            </td>
          </tr>
        })}
      </tbody>
    </table>
  </div>

const Button = ({ onClick, className, children }) => 
  <button
    onClick={onClick}
    className={className}
    type="button">
    {children}
  </button>
  

export default App;
