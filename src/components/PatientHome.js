import React, {Component} from "react";
import Table from 'react-bootstrap/Table'

class PatientHome extends Component {
    async componentWillMount() {
        await this.getDocuments()
    }

    async getDocuments(patient) {
        let documents = await this.props.healthBlock.methods.getRecords(this.props.account).call({from: this.props.account})

        this.setState({ documents: documents })

        console.log(documents)
    }

    constructor(props) {
        super(props)
        this.state = {
            documents: []
        }
    }

    render () {
        return (
            <div>
                <h1>Document List</h1>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Institution address</th>
                            <th>Doctor address</th>
                            <th>Patient address</th>
                            <th>Timestamp</th>
                            <th>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.documents.map(document => {
                            return (
                                <tr key="{document.timestamp}">
                                    <td>{document.institution}</td>
                                    <td>{document.doctor}</td>
                                    <td>{document.patient}</td>
                                    <td>{document.timestamp}</td>
                                    <td>{document.link}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
            </div>
        );
    }
}


export default PatientHome;