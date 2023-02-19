# Create a Jenkins Pipeline for a NodeJS Application: Build, Test and Push to Dockerhub
![jenkins-dock-node](https://user-images.githubusercontent.com/104782642/219955534-86bf08f9-f7fb-4931-b24d-2b0a7ce3c08f.png)

## Our Goal:
The goal of the project is to create a Jenkins pipeline by writing a Jenkinsfile, which will build the application, test, 
and publish the image to dockerhub, from where it can be fetched and deployed to a dev environment or a kubernetes cluster.

Steps to accomplish 
1. Install docker
2. Run a Jenkins container on docker
3. Configure Jenkins with the required plugins and tool
4. Install a docker client on Jenkins
5. Configure Jenkinsfile to build and test NodeJS application
6. Build and push image to Dockerhub

### Step 1: Install docker 
The procedure to install docker can be found here: https://docs.docker.com/engine/install <br>
It contains instructions on how to install docker on different Operating systems. <br>
I'll be using Ubuntu 22.04.1<br>
Confirm your docker is active by running ```systemctl status docker```

![1  system ctl](https://user-images.githubusercontent.com/104782642/219955825-8154a8ff-00c3-43cc-b661-98e8e7646132.JPG)

### Step 2; Run a Jenkins container on docker
create a directory for jenkins home and assign permission to it: <br>
```sudo mkdir -p /var/jenkins_home ``` <br>
```sudo chown -R 1000:1000 /var/jenkins_home/``` <br>

Run a jenkins container with the code below: <br>
```docker run -dt --restart always -p 8080:8080 -p 50000:50000 -v /var/jenkins_home:/var/jenkins_home --name jenkins jenkins/jenkins:lts``` <br>
This will pull the latest image from the jenkins online repo, map the jenkins volume on the host to the container. 
I also used the *--restart* flag to ensure the container is always restarted should it ever stop running. <br>
Confirm the jenkins container is successfully running with ```docker ps```<br>

![2  docker ps](https://user-images.githubusercontent.com/104782642/219955881-406fe9dc-8c8e-4400-9db1-eaa9a3951734.JPG)

Access the jenkins UI on the browser with the host ip address on port 8080, and you shoukd see the jenkins sign-in page.


### Step 3: Configure Jenkins with the required plugin and tools

![3  jenkins sign in](https://user-images.githubusercontent.com/104782642/219955950-c28e38ff-1b18-4ce8-9fdf-6fa1245a3213.JPG)

 Reveal the initial administrative password and paste it on the browser <br>
 ``` cat /var/jenkins_home/secrets/initialAdminPassword``` <br>
 Install suggested plugins. This may take about 2 minutes. <br>

![4  install plugins](https://user-images.githubusercontent.com/104782642/219956041-42393fe5-5892-44a6-ace9-18e4b19bdccc.JPG)

 Create the first admin user and launch the dashboard <br>

![5 first user](https://user-images.githubusercontent.com/104782642/219956078-ed4c5c49-48a0-4ba9-ba4a-6242bcb6ff64.JPG)

 welcome to jenkins

![6  dashboard](https://user-images.githubusercontent.com/104782642/219956110-1f969c31-46c4-4912-84c5-fd474f2ab2d5.JPG)

 
 
 We will need to do some additional configuration in jenkins for our project:<br>
 we need to install three more plugins (NodeJS, Docker Pipeline & CloudBees Docker Build and Publish)<br>
 
 To do this navigate to Manage Jenkins -> Manage Plugins -> Available Plugins<br>
 Search for nodejs plugin -> 'Download now and install after restart'<br>
 Do the same for both the Docker Pipeline & CloudBees Docker Build and Publish<br>
 
 ![7  nodejs](https://user-images.githubusercontent.com/104782642/219956200-c4379d6c-35b7-450b-8479-54ed901fb0ae.JPG)

 The NodeJS plugin will enable us to configure the build tool with NodeJS.<br>
 The Docker Pipeline & CloudBees Docker Build and Publish plugins will enable us to run and build docker in a jenkins pipeline.<br>
 
 Another configuration we need to do is to setup NodeJS in Global Tool Configuration <br>
 Manage Jenkins -> Global Tool Configuration<br>
 Add a 'nodejs' engine as shown below and save. (this is case-sensitive, and will be called later in our Jenkinsfile)<br>
 
![8  node engine](https://user-images.githubusercontent.com/104782642/219956297-f5595d7c-75f3-4151-8e5d-30cd77be8f0b.JPG)
 
 Next is to configure our Dockerhub credentials on Jenkins.<br>
 Create a dockerhub account on https://hub.docker.com/signup <br>
 Create a project repository on Dockerhub <br>
 Manage Jenkins -> Manage Credential -> Global Credentials -> Add Credentials <br>
 
![9  dockerhub cred](https://user-images.githubusercontent.com/104782642/219956366-a471c4f0-252d-4838-829a-97e2f24b399c.JPG)

 Put the username and password of your dockerhub account
 Set the ID as 'dockerhub' (this will also be called later in our Jenkinsfile)
 
 ### Step 4: Install docker client on Jenkins 
 For this step, I created a Dockerfile in this repo https://github.com/valentineanagbogu/docker-client.git <br>

![10  jenkins docker](https://user-images.githubusercontent.com/104782642/219956452-6a137530-68aa-4077-af74-9ea644d72f45.JPG)

 This Docker file will build a new Jenkins image and use the root user to download and extract docker client in the inside the jenkins container.<br>
 To do this, I cloned the repo from git, and then used the dockerfile to build the image <br>
 ```git clone git@github.com:valentineanagbogu/docker-client.git``` <br>
 ```docker build -t jenkins-docker .``` <br>
 

This will build the image in the current directory using the Dockerfile from the cloned repo, with the image name 'jenkins-docker'<br>

![11  image build](https://user-images.githubusercontent.com/104782642/219956598-b54c804e-5aa3-496b-91a5-ca10b30fe683.JPG)

From here the goal is to replace the existing jenkins container using this new image which contains a docker client. <br>
So I'm going to stop and remove the current jenkins container. This will not affect out installed plugins and config because the jenkins home */var/jenkins_home/* will not be affected. <br>

So confirm the new image ```docker image ls```<br>
![12  confirm new image](https://user-images.githubusercontent.com/104782642/219956644-78a9bc19-b316-4dae-9e27-c5fe1018413d.JPG)

Stop jenkins container ```docker stop jenkins``` <br>
remove jenkins container ```docker rm jenkins``` <br>

![13  stop rm docker](https://user-images.githubusercontent.com/104782642/219956784-8e5278c1-9e65-46f1-a720-1298fbfc2dcb.JPG)

Run the new image with the command below: <br>
```docker run -dt --restart always -p 8080:8080 -p 50000:50000 -v /var/jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock --name jenkins jenkins-docker``` <br>
This will spin a new jenkins container using the jenkins-image which we just created 'jenkins-docker' it will also map the docker.sock volume to the host. <br>
Confirm that jenkins is running again from the new image ```docker ps```

![13  new jenkins](https://user-images.githubusercontent.com/104782642/219956812-dfae89e3-fbb3-454a-9caf-21274c3109a3.JPG)


### Step 5: Configure Jenkinsfile to build and test NodeJS application
The new step is to configure the Jenkinsfile<br>
The Jenkins file is hosted in the project repo: misc/Jenkinsfile<br>
Project repository -> https://github.com/valentineanagbogu/jenkins-nodejs.git<br>

![15  Jenkinsfile](https://user-images.githubusercontent.com/104782642/219957027-6055371d-d230-4185-a062-19fcd70d6a6c.JPG)

#### Build steps
This build can run on any node <br>
I defined a function *commit_id* which will be used to tag the image before pushing to dockerhub.<br>
The first stage is the preparation stage. Here we checkout the source code and read the commit_id from the temporary .git/commit-id directory. <br>
The second stage is the test stage. We install the nodejs engine and run the npm install and npm test command. The npm test will run the test script in the *test/test.js* file just to demostrate the process. <br>
The last stage is the docker build/push stage. Here we authenticate Jenkins with dockerhub by referencing the 'dockerhub' credential we configured earlier. <br>
And lastly build the docker image and push to our custom repo is dockerhub. <br>

#### Create a pipeline
Now that we have configured the Jenkinsfile, we login to Jenkins to create the pipeline.<br>
On the Jenkins Dashboard, create a new item, enter an item name and select pipeline <br>

![16 create new pipe](https://user-images.githubusercontent.com/104782642/219957180-32f08b72-e9bb-4716-b917-0a4ebf8cef2f.JPG)

Configure the pipeline to pull from git, and enter the github repository <br>

![17 pipeline scm](https://user-images.githubusercontent.com/104782642/219957238-694d0fe0-b747-4315-a824-1b23a17fff98.JPG)

set the scrit path as misc/Jenkinsfile <br>

![18  script path](https://user-images.githubusercontent.com/104782642/219957246-21e63d4e-66a1-4157-82b0-b00ac820cbef.JPG)

Save and Build <br>

![19 build success](https://user-images.githubusercontent.com/104782642/219957271-c549e5d9-893b-4593-bf86-750471ae5d37.JPG)

From the above we can see the build is successful. We can also check the console output for all the build processes<br>

![21  console output](https://user-images.githubusercontent.com/104782642/219957295-4107d31d-3eba-4541-b644-b86611219c44.JPG)

![22  console 2](https://user-images.githubusercontent.com/104782642/219957310-7d2a3fe0-bee7-4805-bdbc-c2e7cfcac565.JPG)

Next we can confirm that the image was pushed to dockerhub <br>

![20  dockerhub](https://user-images.githubusercontent.com/104782642/219957328-af0a4f75-1a4e-4b21-8675-5fc943acd257.JPG)

#### Finally, we can pull the image from dockerhub, run the container and test the application <br>
Provide credentials and login to docker hub ```docker login``` <br>
Pull the image we just created from dockerhub using the tag name ```docker pull valentineanagbogu/jenkins-nodejs:8e841b7```<br>
Confirm the image has been pulled from dockerhub ```docker image ls```<br>
Run the image to start the application ``` docker run -dt -p 3000:3000 --name node-js-app valentineanagbogu/jenkins-nodejs:8e841b7``` <br>
Curl the ip address and port to get the *Hello World!* response from the app. <br>

![23  Hello world 1](https://user-images.githubusercontent.com/104782642/219957464-05c9f10b-6108-4708-9411-a0ea6f33d294.JPG)

![24  Hello world 2](https://user-images.githubusercontent.com/104782642/219957479-fd5b9ed6-d12d-4e2e-9933-d3e5b30ad3ae.JPG)

## End!


 
