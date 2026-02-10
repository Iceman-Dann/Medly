import React from 'react';

const TestComponent = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', fontFamily: 'Arial' }}>
      <h1>Test Component Working!</h1>
      <p>If you can see this, React is working properly.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', border: '1px solid #ccc' }}>
        <h2>Environment Check:</h2>
        <p>URL: {window.location.href}</p>
        <p>User Agent: {navigator.userAgent}</p>
        <p>Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TestComponent;
