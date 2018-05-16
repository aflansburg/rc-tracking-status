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
        console.log('state shouldl be updated');
      })
      .catch(err=>{console.log(err);})
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
            ? <ul style={{ listStyleType: 'none' }}>
                {this.state.results.map(item=>
                  <li>Tracking No:  {item.trackingNum}   -   Status:  {item.lastStatus}</li>
                )}
              </ul>
            : <p>Nada!</p>
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
