import React, { Component } from "react";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

class InstitutionsList extends Component {
  async componentWillMount() {
    await this.getAccessList();
  }

  async getAccessList() {
    let institution1 = await this.props.healthBlock.methods
      .institutions(0)
      .call({ from: this.props.account });

    let institution2 = await this.props.healthBlock.methods
      .institutions(1)
      .call({ from: this.props.account });

    let institutions = [institution1, institution2];

    this.setState({ institutions: institutions });
    this.setState({ loading: false });
  }

  constructor(props) {
    super(props);
    this.state = {
      institutions: [],
      loading: true,
    };
  }

  render() {
    let content;

    if (this.state.loading) {
      content = (
        <p id="loader" className="text-center">
          Loading...
        </p>
      );
    } else {
      content = (
        <div>
          <h1>Institutions List</h1>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Institution address</th>
                <th>Institution name</th>
                <th>Institution link</th>
              </tr>
            </thead>
            <tbody>
              {this.state.institutions.map((institution) => {
                return (
                  <tr key="{institution}">
                    <td>{institution.institutionAddress}</td>
                    <td>{institution.name}</td>
                    <td>{institution.link}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      );
    }
    return <div>{content}</div>;
  }
}

export default InstitutionsList;
