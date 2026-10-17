# MindVault — Zero-Cost Production Deployment Guide (₹0)

This guide documents the verified **₹0 (Zero-Cost)** deployment architecture for **MindVault**, preserving:
- All 4 Games: **Prediction Arena**, **Detective**, **Escape Room**, and **Drawice**
- Authoritative **MySQL 8+** DBMS persistence
- Real-time persistent **Socket.IO multiplayer** connections
- 3D Galaxy background, animations, and typography
- **Zero payment / No credit card required**

---

## 1. Architecture Overview

```
                      +---------------------------------------+
                      |               Browser                 |
                      |   (Players around the world on Web)   |
                      +-------------------+-------------------+
                                          |
                        HTTPS (Next.js)   |   WSS (Socket.IO)
                                          v
                      +---------------------------------------+
                      |       Render.com Web Service          |
                      |        (Free Tier - ₹0 / $0)          |
                      |  • Node.js: `node server.js`          |
                      |  • Single Unified Origin              |
                      |  • Zero CORS issues                   |
                      |  • Persistent Socket.IO & Next.js     |
                      |  • NO Credit Card Required            |
                      +-------------------+-------------------+
                                          |
                                          |  Encrypted TLS (Port 4000/3306)
                                          v
                      +---------------------------------------+
                      |     TiDB Cloud Starter (MySQL 8+)     |
                      |        (Free Tier - ₹0 / $0)          |
                      |  • 100% MySQL Protocol Wire-Compatible|
                      |  • 5 GiB Storage (MindVault: ~15MB)   |
                      |  • 50 Million Request Units / Month   |
                      |  • Permanent Free (No Auto-Deletion)  |
                      |  • NO Credit Card Required            |
                      +---------------------------------------+
```

---

## 2. Component Verification & Limits

| Component | Provider | Cost | Credit Card? | Verified Free Limits |
| :--- | :--- | :--- | :--- | :--- |
| **Source Code** | GitHub | **₹0** | No | Unlimited public/private repository. |
| **Fullstack & Sockets** | Render Web Service | **₹0** | **No** | 750 free instance hours/month (runs 24/7 all month). Auto-spins down after 15m idle; wakes up in ~45s. Native WebSocket support. |
| **MySQL Database** | TiDB Cloud Starter | **₹0** | **No** | 5 GiB storage, 50M RUs/month. Standard MySQL 8.0 protocol. Permanent (not a 30-day trial). |

---

## 3. Step 1: Provision the Free MySQL Database (₹0)

1. Navigate to [https://tidbcloud.com](https://tidbcloud.com).
2. Click **Start Free** and sign in using your GitHub account (`bhuvannmurthy15112007-lang`). **No credit card is asked.**
3. Click **Create Cluster** and select **TiDB Serverless / Starter (Free)**:
   - Cluster Name: `mindvault-db`
   - Region: Select nearest region (e.g., `AWS / us-east-1` or `AWS / ap-southeast-1`)
   - Plan: **Free ($0)**
4. Click **Create**. Within 15 seconds, your cluster is provisioned.
5. In the cluster overview, click **Connect**:
   - Connection Type: **General**
   - Click **Generate Password** and securely copy the host, port (`4000`), user, and password.
   - Database name: `test` or create `mindvault`.

---

## 4. Step 2: Migrate Database Data to Cloud (One Command)

We have already generated a complete, non-destructive backup file at `database/mindvault_full_backup.sql` containing all 46 tables, user accounts, detective scenarios, escape puzzles, and words.

Run the automated migration script from your local terminal:

```bash
# Set your TiDB connection variables
$env:TARGET_DB_HOST="gateway01.us-east-1.prod.aws.tidbcloud.com"
$env:TARGET_DB_PORT="4000"
$env:TARGET_DB_USER="<your_username>"
$env:TARGET_DB_PASSWORD="<your_password>"
$env:TARGET_DB_NAME="mindvault"
$env:TARGET_DB_SSL="true"

# Execute migration
node scripts/restore_mysql.js
```

The script will verify the connection, execute all schema and insert statements, and print confirmation that all 46 tables and users are restored.

---

## 5. Step 3: Deploy Full-Stack Application on Render (₹0)

1. Navigate to [https://render.com](https://render.com).
2. Click **Sign Up** and choose **Continue with GitHub** (`bhuvannmurthy15112007-lang`). **No credit card required.**
3. Click **New +** -> **Web Service**.
4. Select your GitHub repository: `bhuvannmurthy15112007-lang/mindvault`.
5. Configure the deployment settings:
   - **Name**: `mindvault`
   - **Region**: Choose the region closest to your database (e.g. Oregon or Ohio)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: **Free (0 USD/month)**
6. Expand **Advanced** -> **Add Environment Variable**:
   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `DB_HOST` | `<your_tidb_host>` |
   | `DB_PORT` | `4000` |
   | `DB_USER` | `<your_tidb_user>` |
   | `DB_PASSWORD` | `<your_tidb_password>` |
   | `DB_NAME` | `mindvault` |
   | `DB_SSL` | `true` |
   | `DB_CONNECTION_LIMIT` | `10` |
7. Click **Create Web Service**.
8. Render will pull from GitHub, run `npm install`, compile all 37 Next.js routes, boot `node server.js`, and provide your public live URL (e.g., `https://mindvault.onrender.com`).

---

## 6. Real-Time Multiplayer Verification Checklist

Once deployed, anyone in the world can open `https://mindvault.onrender.com` without localhost dependencies:

1. **Prediction Arena**:
   - Create room from Phone A.
   - Join room code from Laptop B.
   - Start 2-player game -> verify 30-second timer countdown, input submissions, target calculation, and score persistence.
2. **Detective**:
   - Accusation matrix, crime scenes, evidence deduction, and action-budget deductions.
3. **Escape Room**:
   - 10-minute breakout timer, clues, puzzle submission, room completions, and synchronized hints.
4. **Drawice**:
   - Drawing canvas real-time stroke synchronization across separate devices/networks via Socket.IO, word guessing, and speed scores.
5. **Leaderboard & History**:
   - Check Hall of Champions to confirm scores persist directly in MySQL.
