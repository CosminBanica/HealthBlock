import React, { Component } from 'react'
import InstitutionHome from './InstitutionHome'
import PatientHome from './PatientHome'

class Home extends Component {

    render () {
        let content

        if (this.props.accountType === 'patient') {
            content = <PatientHome 
                account={this.props.account}
                healthBlock={this.props.healthBlock}
            />
        } else if (this.props.accountType === 'doctor') {
            // content = <DoctorHome />
        } else if (this.props.accountType === 'institution') {
            content = <InstitutionHome 
                account={this.props.account}
                healthBlock={this.props.healthBlock}
            />
        }

        return (
            <div id="content" className="mt-3">
                {content}
            </div>
        );
    }
}

export default Home;