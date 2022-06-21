import React, { Component } from "react";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

class AccessList extends Component {
  async componentWillMount() {
    await this.getAccessList();
  }

  async getAccessList() {
    let institutions = await this.props.healthBlock.methods
      .getPatientAccessList(this.props.account)
      .call({ from: this.props.account });

    this.setState({ institutions: institutions });
    this.setState({ loading: false });
  }

  addInstitution = async (address) => {
    this.props.healthBlock.methods
      .shareRecords(address)
      .send({ from: this.props.account })
      .on("transactionHash", async (hash) => {
        window.location.reload();
      });
  };

  removeInstitution = async (address) => {
    this.props.healthBlock.methods
      .unshareRecords(address)
      .send({ from: this.props.account })
      .on("transactionHash", async (hash) => {
        window.location.reload();
      });
    window.location.reload();
  };

  constructor(props) {
    super(props);
    this.state = {
      institutions: [],
      loading: true,
    };
  }

  render() {
    let addAddress;
    let removeAddress;
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
          <h1>Access List</h1>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Institution address</th>
              </tr>
            </thead>
            <tbody>
              {this.state.institutions.map((institution) => {
                return (
                  <tr key="{institution}">
                    <td>{institution}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <Form
            onSubmit={(event) => {
              event.preventDefault();
              this.addInstitution(addAddress);
            }}
          >
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Add institution</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter node address"
                value={addAddress}
                onChange={({ target: { value } }) => (addAddress = value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Add
            </Button>
          </Form>

          <Form
            onSubmit={(event) => {
              event.preventDefault();
              this.removeInstitution(removeAddress);
            }}
          >
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Remove institution</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter node address"
                value={removeAddress}
                onChange={({ target: { value } }) => (removeAddress = value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Add
            </Button>
          </Form>
        </div>
      );
    }

    return <div>{content}</div>;
  }
}

export default AccessList;
