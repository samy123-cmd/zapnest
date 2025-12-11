# Security & Compliance Constraints

> Mandatory security rules and compliance requirements for all agents.

---

## Data Classification

| Level | Examples | Handling |
|-------|----------|----------|
| **Public** | Product descriptions, prices | Can be shared openly |
| **Internal** | Supplier names, margins | Internal systems only |
| **Confidential** | Supplier contacts, contracts | Encrypted, access-logged |
| **Sensitive PII** | Customer names, addresses, phone | Encrypted, minimal retention |

---

## PII Handling Rules

### Never Log or Store
- Full customer names in plain text
- Phone numbers
- Email addresses
- Physical addresses
- Payment credentials

### Use Instead
- Hashed customer IDs (`cust-xxx`)
- Hashed order IDs (`ord-xxx`)
- Anonymized segments

### PII in Agent Outputs
```json
{
  "customer_id": "cust-8a72f",  // ✓ Hashed ID
  "customer_name": "John Doe",  // ✗ Never include
  "email_hash": "sha256...",    // ✓ If absolutely needed
  "segment": "high_value"       // ✓ Anonymized attribute
}
```

---

## Supplier Confidentiality

### Internal Use Only
- Supplier legal names
- Contact emails/phones
- Contract terms
- Pricing agreements
- Defect history

### Public-Facing Outputs
```json
{
  "supplier_id": "sup-123",           // ✓ Internal reference
  "supplier_name": "Shenzhen XYZ Co", // ✗ Never in public copy
  "location": "China",                // ✓ General only
  "verified": true                    // ✓ Status flag
}
```

### Narrative Agent Rule
```
Never mention specific supplier names in product descriptions, 
marketing copy, or customer communications.

❌ "Sourced from Shenzhen ProTech Electronics"
✓ "Sourced from verified factories"
```

---

## Claim Verification

### Mandatory Verification
All consumer-facing claims must have:
1. Source documentation
2. Test data (if measurable)
3. Audit trail entry

### Unverified Claims
If claim cannot be verified:
```json
{
  "claim": "battery_hours",
  "status": "unverified",
  "action": "use_measured_value_or_omit",
  "fallback_phrasing": "In our tests, approximately X hours"
}
```

### Prohibited Claims
- "Best" / "Ultimate" / "#1" without third-party verification
- Specific performance numbers without test data
- Health or safety claims without certification
- Competitor comparisons without evidence

---

## Product Safety & Compliance

### Battery Products
All Li-ion/LiPo battery products must have:

| Requirement | Authority |
|-------------|-----------|
| BIS Registration | Bureau of Indian Standards |
| UN38.3 Test Report | Transport certification |
| IEC 62133 | Safety standard |
| Wh rating labeling | Dangerous goods |

### Electronics
| Requirement | Authority |
|-------------|-----------|
| BIS (CRS) | Compulsory Registration Scheme |
| CE Mark | European conformity |
| FCC | US electromagnetic compatibility |

### Compliance Flags (Auto-detect)
```json
{
  "compliance_flags": [
    "battery_cert_needed",    // Contains Li-ion battery
    "bis_cert_needed",        // Electronic device
    "wireless_cert_needed",   // Bluetooth/WiFi
    "hazmat_shipping_check"   // Battery > 100Wh
  ]
}
```

### Shipping Restrictions
| Battery Capacity | Air Cargo | Ground |
|------------------|-----------|--------|
| < 100Wh | Allowed (with docs) | Allowed |
| 100-160Wh | Restricted | Allowed |
| > 160Wh | Prohibited | Case-by-case |

---

## Indian Commerce Regulations

### Import Rules
1. Valid Import Export Code (IEC)
2. Bill of Entry for customs
3. GST registration and compliance
4. Product-specific import licenses if applicable

### Consumer Protection
1. Clear return policy (minimum 7 days)
2. Warranty information disclosed
3. MRP and inclusive taxes displayed
4. Country of origin labeling

### E-commerce Rules (2020)
1. Seller details on invoice
2. Grievance redressal mechanism
3. No flash sales by related entities
4. Fair trade practices

---

## Tax Compliance

### GST Rates (Reference)
| Category | Rate |
|----------|------|
| Electronics | 18% |
| Accessories | 18% |
| Batteries | 28% |
| Chargers | 18% |

### Tax Calculation Rule
```
Agent outputs must NOT calculate final tax.
Always include disclaimer:

"Estimated price. Final GST calculated at checkout based on delivery location."
```

### Escalation
If tax treatment is unclear:
1. Flag for human review
2. Do not publish unverified tax claims
3. Consult with tax advisor

---

## API Key & Credential Security

### Rules
1. Never include API keys in agent outputs
2. Use environment variables for secrets
3. Rotate keys quarterly
4. Separate keys per environment (dev/prod)

### Key Categories
| Type | Rotation | Access |
|------|----------|--------|
| Platform APIs | Quarterly | Engineering |
| Payment providers | Monthly | Finance + Eng |
| Ad platforms | Quarterly | Marketing + Eng |
| Email services | Quarterly | Marketing + Eng |

### Breach Response
If credential exposure suspected:
1. Revoke immediately
2. Generate new credentials
3. Audit access logs
4. Notify affected services

---

## Data Retention

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Trend signals | 90 days | Analysis |
| Supplier evaluations | 2 years | Audit |
| Product decisions | 3 years | Compliance |
| Customer orders | 7 years | Tax/legal |
| Marketing copy | 2 years | Legal review |
| Support tickets | 3 years | Dispute resolution |

### Deletion
After retention period:
1. Archive to cold storage (encrypted)
2. Delete from active systems
3. Log deletion action

---

## Access Control

### Agent Permissions
| Agent | Can Read | Can Write | Can Delete |
|-------|----------|-----------|------------|
| TrendRadar | Trends, Signals | Candidates | None |
| Procurement | Products, Suppliers | Supplier records | None |
| Curation | Products, Tests | Product status | None |
| Narrative | Products, Boxes | Copy drafts | Own drafts |
| Launch | All marketing | Campaigns | Own drafts |
| Support | Orders, Tickets | Ticket status | None |

### Human Override
Only humans with appropriate role can:
- Delete records
- Override compliance flags
- Approve large financial transactions
- Access raw PII

---

## Audit Logging

All security-relevant actions must be logged:

```json
{
  "event_type": "data_access",
  "timestamp": "ISO datetime",
  "actor": "agent:ProcurementAgent",
  "action": "read",
  "resource_type": "supplier",
  "resource_id": "sup-123",
  "justification": "supplier_evaluation",
  "ip_address": null,  // N/A for agents
  "success": true
}
```

### Required Events
- Data reads (sensitive)
- Data writes
- HITL approvals
- Error escalations
- Credential usage

---

## Incident Response

### Severity Levels
| Level | Example | Response Time |
|-------|---------|---------------|
| P1 | Data breach, payment failures | 15 min |
| P2 | Agent failures blocking orders | 1 hour |
| P3 | Compliance flag missed | 4 hours |
| P4 | Documentation gaps | 24 hours |

### Response Steps
1. **Identify**: Confirm and classify incident
2. **Contain**: Stop further damage
3. **Notify**: Alert relevant stakeholders
4. **Remediate**: Fix root cause
5. **Document**: Post-mortem and learnings
