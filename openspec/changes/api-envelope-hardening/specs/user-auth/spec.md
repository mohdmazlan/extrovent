# Spec Delta

## MODIFIED Requirements

### Requirement: Bearer Token Authentication (Exclusive)
All protected endpoints SHALL require `Authorization: Bearer <token>` header. The system MUST extract and validate the JWT token from this header before processing the request. No other authentication method is accepted. Error responses SHALL use the envelope `{"success":false,"data":null,"error":...}` with `Content-Type: application/json` and status `401` per the `api-envelope` contract.

#### Scenario: Request without auth header is rejected
- **WHEN** client makes request without Authorization header
- **THEN** system returns 401 Unauthorized

#### Scenario: Request with invalid token is rejected
- **WHEN** client sends request with malformed or expired JWT
- **THEN** system returns 401 Unauthorized with error details

