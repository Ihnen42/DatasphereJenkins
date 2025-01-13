pipeline {
    agent any
    tools{
        nodejs('21.7.3')
    }
    stages {
        stage('node') {
            steps {
                sh 'npm version'
                sh 'datasphere -v'
            }
        }
    }
}
