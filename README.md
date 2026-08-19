# HACKVERSE 2026

## Team DeepThinkers

### Team Members

1. ch. kumar chandu – Full Stack & Blockchain Developer
2. D. Shiva Kumar – integration & backend
3. K. Vamshi Krishna – Frontend & Commuicator
4. K. Sai Kumar – Graphical Designer


---

# Project Title

## Blockchain-Based Academic Certificate & Digital Credential Verification System

**Credora** is a blockchain-based academic certificate and digital credential verification system designed to make educational certificates secure, tamper-resistant, and easily verifiable.

---

## Problem Statement

Traditional academic certificate verification systems often depend on centralized databases and manual verification processes. This can lead to:

- Certificate forgery and tampering
- Time-consuming manual verification
- Difficulty in validating certificates issued by different institutions
- Dependence on centralized databases
- Lack of transparency in certificate authenticity
- Difficulty for employers and institutions to quickly verify credentials

There is a need for a secure, transparent, and reliable system that allows academic credentials to be verified efficiently while preventing unauthorized modification.

---

## Proposed Solution

**Credora** provides a blockchain-based platform for issuing and verifying academic certificates and digital credentials.

The system stores certificate information securely and generates a unique cryptographic hash for each certificate. The hash is recorded on the blockchain through a smart contract.

When a certificate needs to be verified:

1. The certificate is uploaded to the system.
2. Its cryptographic hash is calculated.
3. The system retrieves the corresponding blockchain record.
4. The generated hash is compared with the stored hash.
5. If both hashes match, the certificate is considered authentic.
6. If the hashes do not match, the certificate may have been modified or is not registered.

This provides a tamper-resistant and transparent verification mechanism.

---

# Technologies Used

### Frontend

- React.js
- HTML5
- Bootstrap
- JavaScript

### Backend

- Node.js
- Express.js
- REST API

### Database

- MongoDB
- MongoDB Atlas

### Blockchain

- Solidity
- Ethereum-compatible Smart Contracts
- Hardhat
- Ethers.js
- Polygon Amoy Testnet

### Cloud & Infrastructure

- Alchemy RPC
- Cloudinary
- Git
- GitHub

### Authentication & Security

- JWT Authentication
- Role-Based Access Control
- Cryptographic Hashing

---

# System Architecture

```text
                    ┌──────────────────────┐
                    │       User           │
                    │ Student / Institution│
                    │ Employer / Verifier  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      React.js        │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │      Backend         │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └──────────┐
                 ▼                             ▼
       ┌──────────────────┐          ┌──────────────────┐
       │     MongoDB      │          │ Blockchain Layer │
       │   User & Data    │          │ Smart Contract   │
       └──────────────────┘          └────────┬─────────┘
                                               │
                                               ▼
                                    ┌────────────────────┐
                                    │  Polygon Amoy      │
                                    │    Test Network    │
                                    └────────────────────┘

```

# How to Run
Start Backend and Frontend


From the project root:

npm run dev

This starts both the backend and frontend applications.

Run Backend Separately
npm run dev --prefix backend

Run Frontend Separately
npm run dev --prefix frontend

Build Frontend
npm run build


# Demo
Live Demo

URL : https://hv-2026-0001-deep-thinkers.vercel.app/

Demo Video

Youtube URL : https://youtu.be/L620lBfMAMc?si=twvdvnBPBwBbnDdz


# Deployment

The application consists of three major layers:

Frontend  :Vercel

The React frontend can be deployed using a frontend hosting platform.

Backend :Rendor

The Node.js and Express backend can be deployed using a cloud hosting platform.

Database : MongoDB Atlas and Cloudinary (for storing the pdf/images)

MongoDB Atlas is used as the cloud database.

Blockchain  : Alchemy/Polygom Amoy.

The smart contract is deployed on the Polygon Amoy testnet.

RPC

Alchemy is used to connect the backend/blockchain deployment environment to Polygon Amoy.


# Screenshots

Home Page
![Alt text](/home/shiva/Pictures/Screenshots/)

![Alt text](/home/shiva/Downloads/CERT-2026-0U3-9554.pdf)


Project Stucture: 
```text
credora/
│
├── backend/
│   ├── src/
│   │   ├── blockchain/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── contracts/
│   └── CertificateRegistry.sol
│
├── scripts/
│   └── deploy.js
│
├── docs/
│
├── hardhat.config.js
├── package.json
├── package-lock.json
└── README.md
```


# Installation
1. Clone the repository
git clone https://github.com/shivadevarakonda-16/HV-2026-0001-DeepThinkers.git
cd HV-2026-0001-DeepThinkers

2. Install root dependencies
npm install

3. Install backend dependencies
npm install --prefix backend

4. Install frontend dependencies
npm install --prefix frontend




# Future Enhancements

# majaor Area of focus is Passport Fraud Detection and VISA Fraud Detection.
1.Support for additional blockchain networks
2.Decentralized identity integration
3.IPFS-based decentralized certificate storage
4.Mobile application
5.Advanced institutional dashboards
6.Automated certificate revocation management
7.Multi-university credential interoperability
8.Zero-knowledge proof based privacy-preserving verification
9.Mainnet deployment after production testing


# Git Workflow

Create Repository
       ↓
Clone Repository
       ↓
Create Project Structure
       ↓
Develop
       ↓
Commit
       ↓
Push
       ↓
Test
       ↓
Final Code
       ↓
Submit GitHub URL
