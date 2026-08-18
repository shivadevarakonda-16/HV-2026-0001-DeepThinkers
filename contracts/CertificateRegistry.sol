// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Decentralized Academic Credential and Certificate Verification Registry
 * Team: DeepThinkers (HV2026-0001) - Problem Statement: HV-CYB-03
 */
contract CertificateRegistry {
    address public owner;

    struct Certificate {
        string certificateId;
        string dataHash;        // SHA-256 hash of cert metadata
        string fileHash;        // SHA-256 hash of PDF/image
        address issuer;
        string issuerName;
        string studentName;
        uint256 issueTimestamp;
        bool isRevoked;
        string revocationReason;
        uint256 revocationTimestamp;
    }

    struct IssuerInfo {
        string name;
        string institutionCode;
        bool isAuthorized;
        uint256 addedAt;
    }

    // Mappings
    mapping(string => Certificate) private certificates;
    mapping(string => bool) private certificateExists;
    mapping(address => IssuerInfo) public authorizedIssuers;
    string[] public certificateIds;

    // Events for transparency and indexers
    event CertificateIssued(
        string indexed certificateId,
        string indexed fileHash,
        string dataHash,
        address indexed issuer,
        string studentName,
        uint256 timestamp
    );

    event CertificateRevoked(
        string indexed certificateId,
        address indexed revokedBy,
        string reason,
        uint256 timestamp
    );

    event IssuerAuthorized(address indexed issuer, string name, string institutionCode);
    event IssuerRevoked(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only registry owner can perform this operation");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender].isAuthorized || msg.sender == owner, "Caller is not an authorized issuing institution");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = IssuerInfo({
            name: "Credora Root Foundation",
            institutionCode: "ROOT-001",
            isAuthorized: true,
            addedAt: block.timestamp
        });
    }

    /**
     * @dev Authorize a new academic institution to issue credentials
     */
    function authorizeIssuer(address _issuer, string memory _name, string memory _code) external onlyOwner {
        require(_issuer != address(0), "Invalid issuer address");
        authorizedIssuers[_issuer] = IssuerInfo({
            name: _name,
            institutionCode: _code,
            isAuthorized: true,
            addedAt: block.timestamp
        });
        emit IssuerAuthorized(_issuer, _name, _code);
    }

    /**
     * @dev Revoke an institution's issuing privileges
     */
    function revokeIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuers[_issuer].isAuthorized, "Issuer is not authorized");
        authorizedIssuers[_issuer].isAuthorized = false;
        emit IssuerRevoked(_issuer);
    }

    /**
     * @dev Issue a new tamper-proof academic certificate on-chain
     */
    function issueCertificate(
        string memory _certificateId,
        string memory _dataHash,
        string memory _fileHash,
        string memory _issuerName,
        string memory _studentName
    ) external onlyAuthorizedIssuer {
        require(!certificateExists[_certificateId], "Certificate ID already exists in blockchain registry");
        require(bytes(_certificateId).length > 0, "Certificate ID cannot be empty");
        require(bytes(_fileHash).length > 0, "File hash cannot be empty");

        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            dataHash: _dataHash,
            fileHash: _fileHash,
            issuer: msg.sender,
            issuerName: _issuerName,
            studentName: _studentName,
            issueTimestamp: block.timestamp,
            isRevoked: false,
            revocationReason: "",
            revocationTimestamp: 0
        });

        certificateExists[_certificateId] = true;
        certificateIds.push(_certificateId);

        emit CertificateIssued(_certificateId, _fileHash, _dataHash, msg.sender, _studentName, block.timestamp);
    }

    /**
     * @dev Revoke an issued certificate with an official reason
     */
    function revokeCertificate(string memory _certificateId, string memory _reason) external {
        require(certificateExists[_certificateId], "Certificate does not exist");
        Certificate storage cert = certificates[_certificateId];
        require(msg.sender == cert.issuer || msg.sender == owner, "Only the original issuing institution or owner can revoke");
        require(!cert.isRevoked, "Certificate is already revoked");

        cert.isRevoked = true;
        cert.revocationReason = _reason;
        cert.revocationTimestamp = block.timestamp;

        emit CertificateRevoked(_certificateId, msg.sender, _reason, block.timestamp);
    }

    /**
     * @dev Verify a certificate by ID - returns full on-chain status
     */
    function verifyCertificate(string memory _certificateId) external view returns (
        bool exists,
        string memory dataHash,
        string memory fileHash,
        address issuer,
        string memory issuerName,
        string memory studentName,
        uint256 issueTimestamp,
        bool isRevoked,
        string memory revocationReason
    ) {
        if (!certificateExists[_certificateId]) {
            return (false, "", "", address(0), "", "", 0, false, "");
        }
        Certificate memory cert = certificates[_certificateId];
        return (
            true,
            cert.dataHash,
            cert.fileHash,
            cert.issuer,
            cert.issuerName,
            cert.studentName,
            cert.issueTimestamp,
            cert.isRevoked,
            cert.revocationReason
        );
    }

    /**
     * @dev Total number of registered certificates
     */
    function getTotalCertificates() external view returns (uint256) {
        return certificateIds.length;
    }
}
