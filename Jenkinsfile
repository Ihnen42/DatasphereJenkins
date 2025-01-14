pipeline {
    agent any
    tools{
        nodejs('21.7.3')
    }
    stages {
        stage('node') {
            steps {
                sh 'npm i dotenv'
                sh 'npm i @sap/datasphere-cli @sap/hana-client'
                sh 'npm list'
                sh 'datasphere -v'
                sh 'datasphere config host set https://b2468957-21d8-479a-83a0-4be204f57e4b.eu10.hcs.cloud.sap'
                sh 'datasphere login --options-file .login.json'
                sh 'datasphere spaces list --options-file .login.json'
                sh 'node datasphere-cli-jenkins/src/download-objects-from-a-space.js'
            }
        }
    }
}
