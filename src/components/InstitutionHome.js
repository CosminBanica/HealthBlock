import React, {Component} from "react";
import Table from 'react-bootstrap/Table'

class InstitutionHome extends Component {

    async componentWillMount() {
        await this.getAccessablePatients()
    }

    async getAccessablePatients() {
        let patients = await this.props.healthBlock.methods.getAccessablePatients(this.props.account).call()

        this.setState({ patientList: patients })
    }

    async getPatientDocuments(patient) {
        let documents = await this.props.healthBlock.methods.getRecords(patient).call({from: this.props.account})

        this.setState({ currentDocuments: documents })

        console.log(documents)
    }

    addDocument(doctorAddress, timestamp, link) {
        this.props.healthBlock.methods.addRecord(this.state.currentPatient, doctorAddress, timestamp.toString(), link).send({ from: this.props.account })
    }

    constructor(props) {
        super(props)
        this.state = {
            patientList: [],
            currentPatient: 'none',
            currentDocuments: []
        }
    }

    render () {
        let content

        if (this.state.currentPatient === 'none') {
            content = 
            <div>
                <h1>Patients List</h1>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Patient address</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.patientList.map(patient => {
                            return (
                                <tr key="{patient}">
                                    <td>{patient}</td>
                                    <td>
                                        <button className="btn btn-primary" onClick={async () => {
                                            this.setState({currentPatient: patient})
                                            await this.getPatientDocuments(patient)}}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
            </div>
        } else {
            content =
            <div>
                <h1>Patient Documents</h1>
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
                        {this.state.currentDocuments.map(document => {
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

                <form className="mb-3 huge-padding" onSubmit={(event) => {
                        event.preventDefault()
                        let doctorAddress
                        doctorAddress = this.doctorInput.value
                        let timestamp
                        timestamp = new Date().getTime()
                        let link
                        link = this.linkInput.value
                        this.addDocument(doctorAddress, timestamp, link)
                    }}>
                        <div className="input-group mb-4">
                            <label>
                                Doctor address:
                                <input
                                type="text"
                                ref={(input) => { this.doctorInput = input }}
                                className="form-control form-control-lg"
                                placeholder="Node address"
                                name='doctor'
                                required />
                            </label>
                            <br />
                            <label>
                                Document link:
                                <input
                                type="text"
                                ref={(input) => { this.linkInput = input }}
                                className="form-control form-control-lg"
                                placeholder="Institution link"
                                name='link'
                                required />
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg">Add document</button>
                    </form>
            </div>
        }

        return (
            <div>
                {content}
            </div>
        );
    }
}

export default InstitutionHome;