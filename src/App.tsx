import React from 'react';
import DrawSignature from './drawSignature';
import './App.css';

function App() {
  return (
    <div className="App">
      <div style={{ height: '300px', width: '100%', background: '#999' }} />
      <DrawSignature canvasWidth="400px"  canvasHeight="200px" />
      <div style={{ height: '1300px', width: '100%', background: '#999' }}></div>
    </div>
  );
}

export default App;
