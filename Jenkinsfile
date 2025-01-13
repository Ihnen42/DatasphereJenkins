pipeline {
    agent any
    tools{
        nodejs('21.7.3')
    }
    stages {
        stage('node') {
            steps {
                sh 'npm i dotenv'
                sh 'npm list'
                sh 'datasphere -v'
                sh 'echo params.ENVIRONMENT >> .env'
                sh 'node datasphere-cli-jenkins/src/download-objects-from-a-space.js'
            }
        }
    }
}
