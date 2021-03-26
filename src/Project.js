import React from 'react';

class Project extends React.Component {
  render() {
    return (
      <div className="project">
        <h1>Project!</h1>
        <p>{this.props.params.projectId} + 1234567901 + jfkdlsjafkdsjafjfkdsjafkldjsaklfdjskalfjdsaklfjdskla</p>
      </div>
    );
  }
}

export default Project;
