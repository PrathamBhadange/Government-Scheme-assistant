# Member 1 Scheme Data and Eligibility API

This module uses fictional **demo data only**. The records, benefits, conditions, ministries, and `example.com` URLs are not official. Replace them with verified government scheme information before any real use.

## Run and response contract

From the project root:

```sh
npm install
npm start
```

The default base URL is `http://localhost:5000`. Successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "message": "...", "errors": [] }`.

### Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/schemes?search=education&department=...&status=ACTIVE&category=EDUCATION&page=1&limit=20` | Search and filter scheme cards |
| GET | `/api/schemes/:schemeId` | Get complete scheme details |
| GET | `/api/schemes/:schemeId/documents` | Get `requiredDocuments` |
| POST | `/api/schemes/eligibility` | Evaluate every scheme |
| POST | `/api/schemes/:schemeId/eligibility` | Evaluate one scheme |

Eligibility accepts only these Citizen-like fields: `age` (non-negative number), `annualIncome` (non-negative number), `isStudent` (boolean), and `isRuralResident` (boolean). A Citizen object may omit fields. Every defined criterion is checked; undefined criteria are ignored. `minAge` and `maxAge` are inclusive, and income qualifies when `annualIncome <= maxAnnualIncome`.

Each result has `schemeId`, `schemeName`, `eligibilityStatus`, `eligible`, `reasons`, and `missingInformation`. `ELIGIBLE` maps to `true`, `NOT_ELIGIBLE` to `false`, and `NEEDS_INFORMATION` to `null`. A failed known criterion is not the same as a missing attribute. Inactive and closed schemes are never eligible. Results are preliminary deterministic estimates, not AI or official confirmations.

Example:

```json
POST /api/schemes/SCH001/eligibility
{ "age": 20, "annualIncome": 300000, "isStudent": true }
```

```json
{
  "success": true,
  "data": {
    "schemeId": "SCH001",
    "schemeName": "Demo Learning Opportunity Scheme",
    "eligibilityStatus": "ELIGIBLE",
    "eligible": true,
    "reasons": ["Minimum age criterion passed.", "Maximum age criterion passed.", "Income criterion passed.", "Student status criterion passed."],
    "missingInformation": []
  }
}
```

## Scheme contract

Required UML-compatible fields are `schemeId`, `name`, `description`, `ministry`, `department`, `eligibilityCriteria`, `benefits`, `requiredDocuments`, `startDate`, `endDate`, `status`, and `sourceUrl`. Optional `category` supports filtering. `SchemeStatus` is `ACTIVE`, `INACTIVE`, or `CLOSED`. `DocumentType` is `IDENTITY_PROOF`, `ADDRESS_PROOF`, `INCOME_PROOF`, `PASSPORT`, `CASTE_CERTIFICATE`, `LAND_RECORD`, or `OTHER`. Supported criteria are `minAge`, `maxAge`, `maxAnnualIncome`, `studentRequired`, and `ruralResidentRequired`.

Member 4 can render the `GET /api/schemes` `data` array as scheme cards and use `GET /api/schemes/:schemeId` for a detail view. Member 2 can call the documents endpoint and use each returned `DocumentType` to drive document collection and verification. To add a scheme, add a complete record to `backend/src/data/schemes.json`, use only validated enums and criteria, use ISO-compatible dates, and run the tests. `Scheme` validates all records at load time.

`SchemeSource` is represented by the local-demo source helper in `schemeService.js`; `fetchSchemes()` reads local JSON and `parseAndUpdate()` intentionally reports that external ingestion is not implemented. There is no database, authentication, OCR, DigiLocker, government portal, WhatsApp/SMS, or official API integration.
