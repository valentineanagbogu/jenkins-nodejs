node {
   def commit_id
   stage('preparation') {
     checkout scm
     sh "git rev-parse --short HEAD > .git/commit-id"                        
     commit_id = readFile('.git/commit-id').trim()
   }
   stage('test') {
     nodejs(nodeJSInstallationName: 'nodejs') {
       sh 'npm install --only=dev'
       sh 'npm test'
     }
   }
   stage('docker build/push') {
     docker.withRegistry('https://registry-1.docker.io', 'dockerhub') {
       def app = docker.build("valentineanagbogu/jenkins-nodejs:${commit_id}", '.').push()
     }
   }
}