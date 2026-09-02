# IPX Security Policy

## Security posture

IPX treats identity, ownership assertions, evidence integrity, access control, cryptographic material, customer records, legal workflow data, and provenance records as security-sensitive assets.

This public repository does not authorize security testing against production systems, customer environments, private infrastructure, or third-party services.

## Reporting vulnerabilities

Do not publish exploitable vulnerability details, credentials, private keys, customer information, personal data, or confidential evidence in public issues or pull requests.

Security reports should include the affected component, reproducible impact, prerequisite conditions, and a minimal proof sufficient to validate the issue without accessing unrelated data or causing service disruption.

## Production security requirements

A production IPX service is not considered release-ready unless applicable controls include:

- authenticated and authorized access with least privilege;
- tenant and account isolation;
- secure session and credential handling;
- encryption in transit and at rest for sensitive information;
- key rotation and revocation procedures;
- replay protection and idempotency for consequential operations;
- tamper-evident evidence and audit records;
- input validation and safe file handling;
- rate limiting and abuse controls;
- secrets kept outside source control;
- dependency and supply-chain review;
- security logging without leaking confidential material;
- backup, restore, incident response, and recovery procedures;
- privacy-aware retention, export, deletion, and legal-hold behavior where applicable;
- adversarial tests for impersonation, forged evidence, cross-account access, replay, tampering, privilege escalation, and unauthorized disclosure.

## Supported versions

Only the current production release and any explicitly maintained release line should be treated as supported. Repository documentation must not imply support for abandoned or experimental branches.

## Safe-harbor limitation

No blanket authorization for penetration testing is granted by this file. Written authorization is required before testing any non-local IPX system.