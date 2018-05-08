import React, { Component } from 'react';
import './App.css';
import fedexBatchTrack from './helpers/fedexBatchTracking';
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
    fedexBatchTrack(this.state.trackingNo)
      .then(data=>{
        this.setState = {results: data}
      })
  }
  
  componentDidMount(){


  }

  render() {
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
        <div>
          { this.state.results
            ? <p>{this.state.results}</p>
            : null
          }
        </div>
      </div>
    );
  }
}

class Table extends Component {

  render(){
    return(
      <div className="results-table">

      </div>
    )
  }
}

const Button = ({ onClick, className, children }) => 
  <button
    onClick={onClick}
    className={className}
    type="button">
    {children}
  </button>
  

export default App;
