# JULink: Pipeline Integration Runbook

This runbook tracks the setup of your Jenkins and Docker environment, including instructions on how to access the Jenkins UI and configure it with GitHub.

---

## 📋 Table of Contents
1. [Phase 0: running Jenkins Container](#phase-0-running-jenkins-container)
2. [Phase 1: Unlock and Complete Jenkins Setup Wizard](#phase-1-unlock-and-complete-jenkins-setup-wizard)
3. [Phase 2: Setting up GitHub Integration in Jenkins](#phase-2-setting-up-github-integration-in-jenkins)
4. [Phase 3: Creating and running Your First Pipeline](#phase-3-creating-and-running-your-first-pipeline)
5. [Phase 4: Progressive Pipeline Stages Checklist](#phase-4-progressive-pipeline-stages-checklist)

---

## Phase 0: Running Jenkins Container
The Jenkins container is running locally on port `9090` with the host's Docker socket mounted.

* **Status**: Running
* **Port mapped**: `9090` (e.g., `http://localhost:9090`)
* **Container Name**: `julink-jenkins`
* **Docker command executed**:
  ```bash
  docker run -d --name julink-jenkins -p 9090:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock -u root jenkins/jenkins:lts
  ```

---

## Phase 1: Unlock and Complete Jenkins Setup Wizard

1. Open your browser and navigate to **`http://localhost:9090`** (or your host IP if running remotely).
2. You will be prompted to unlock Jenkins with an **Administrator password**.
3. Run the following command in your terminal to retrieve the password:
   ```bash
   docker logs julink-jenkins
   ```
   *(Or read it directly from: `/var/jenkins_home/secrets/initialAdminPassword` inside the container).*
4. Paste the password into the browser and click **Continue**.
5. Select **"Install suggested plugins"** and wait for the installation to complete.
6. Create your **First Admin User** and complete the URL configuration step.

---

## Phase 2: Setting up GitHub Integration in Jenkins

To let Jenkins access your GitHub repository and automatically trigger builds on commit:

### 1. Configure GitHub Credentials in Jenkins
1. Go to **Dashboard** -> **Manage Jenkins** -> **Credentials** -> **System** -> **Global credentials (unrestricted)**.
2. Click **Add Credentials**.
3. Select **Kind**: `Username with password` (or `Secret text` if using a GitHub Personal Access Token).
4. Enter your GitHub Username.
5. In **Password** (or **Secret**), paste your **GitHub Personal Access Token (PAT)** *(recommended over raw password)*.
6. Set the **ID** to `github-creds` and click **Create**.

### 2. Configure GitHub Webhook (Optional - for Automatic Triggers)
1. In your GitHub Repository, go to **Settings** -> **Webhooks** -> **Add webhook**.
2. Set the **Payload URL** to `http://<your-public-jenkins-ip>:9090/github-webhook/`.
3. Set **Content type** to `application/json`.
4. Select **Just the push event** and click **Add webhook**.

---

## Phase 3: Creating and Running Your First Pipeline

1. In the Jenkins Dashboard, click **New Item**.
2. Enter the name `julink-pipeline` and select **Pipeline**. Click **OK**.
3. Scroll down to the **Build Triggers** section and check:
   - [x] **GitHub hook trigger for GITScm polling** (if webhooks are configured).
4. Scroll down to the **Pipeline** section:
   - Set **Definition** to: `Pipeline script from SCM`.
   - Set **SCM** to: `Git`.
   - Paste your **Repository URL**: `https://github.com/0Risotto/graduation_project.git`.
   - Under **Credentials**, select `github-creds` from the dropdown list.
   - Set **Branch Specifier** (e.g. `*/main` or `*/master` or whatever branch you are using).
   - Set **Script Path** to: **`pipeline/Jenkinsfile`** (this points to your newly created folder!).
5. Click **Save**.
6. Click **Build Now** to run the empty skeleton pipeline. It will succeed trivially!

---

## Phase 4: Progressive Pipeline Stages Checklist

Once your first run turns green, you can incrementally add the following stages directly inside `pipeline/Jenkinsfile` to build up your fully functional CI/CD pipeline:

- [x] **Step 4.1: Initial Empty Jenkinsfile**
  * Script Location: `pipeline/Jenkinsfile`
  * Status: **Succeeds Trivially** (Verified)
- [x] **Step 4.2: Add Checkout & Init Stages**
  * Add git checkout confirmation.
- [x] **Step 4.3: Add Backend Compilation & Tests Stage**
  * Inside `pipeline/Jenkinsfile`, add:
    ```groovy
    stage('Test & Build Backend') {
        steps {
            dir('backend/julink') {
                sh 'chmod +x mvnw'
                sh './mvnw clean test'
            }
        }
    }
    ```
- [ ] **Step 4.4: Add Frontend Tests & Next.js Build Stage**
  * Inside `pipeline/Jenkinsfile`, add:
    ```groovy
    stage('Test & Build Frontend') {
        steps {
            dir('frontend/julink') {
                sh 'corepack enable'
                sh 'corepack prepare pnpm@latest --activate'
                sh 'pnpm install --no-frozen-lockfile --ignore-scripts'
                sh 'pnpm run build'
            }
        }
    }
    ```
- [x] **Step 4.5: Add Docker Packaging Stage (Backend Part)**
  * Inside `pipeline/Jenkinsfile`, add:
    ```groovy
    stage('Build Docker Images') {
        steps {
            sh 'docker build --network=host -t julink-backend:latest ./backend/julink'
            sh 'docker build --network=host -t julink-frontend:latest ./frontend/julink'
        }
    }
    ```
- [ ] **Step 4.6: End-to-End Green Verification**
  * Trigger a push or commit and verify the complete flow passes!
