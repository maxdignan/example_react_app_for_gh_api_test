import React from 'react';

class Project extends React.Component {
  render() {
    return (
      <div className="project">
        <h1>Project!</h1>
        <div style={styleSheet}>Bunch of red text</div>
        <p>{this.props.params.projectId} + 1234567901 + jfkdlsjafkdsjafjfkdsjafkldjsaklfdjskalfjdsaklfjdskla jfkdlsjafkldsjaklfdjsaklfjdskuivhfiodhskljvdsklajf</p>
      </div>
    );
  }
}

const styleSheet = {
  backgroundColor: 'red',
}

export default Project;
