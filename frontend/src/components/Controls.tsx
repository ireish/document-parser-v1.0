import React from 'react';
import '../styles/Controls.css';

const Controls: React.FC = () => {
  return (
    <div className="ControlsContainer">
      <button className="ExtractButton">Extract New Document</button>
      <div className="RecentExtractions">
        <h3>Recent extractions</h3>
        <ul>
          <li>Document 1</li>
          <li>Document 2</li>
          <li>Document 3</li>
          <li>....</li>
        </ul>
      </div>
    </div>
  );
};

export default Controls; 