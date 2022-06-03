import React, {Component} from "react";

class InstitutionHome extends Component {

    async componentWillMount() {
        await this.getAccessablePatients()
    }

    async getAccessablePatients() {
        let patients = await this.props.healthBlock.methods.getAccessablePatients(this.props.account).call()

        console.log(patients)
    }

    constructor(props) {
        super(props)
        this.state = {
            patientList: []
        }
    }

    render () {
        return (
            <div>
                <h1>Patients List</h1>
                {this.state.patientList.map(patient => {
                    return (
                        <div>
                            <h3>{patient}</h3>
                        </div>
                    )
                })}
            </div>
        );
    }
}

export default InstitutionHome;