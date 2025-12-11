# Human-in-the-Loop (HITL) Checkpoints

> All blocking gates that require human approval before proceeding.

---

## Overview

HITL checkpoints are **mandatory approval gates** that prevent automated progression until a human reviews and signs off. These protect against:

- Quality failures in product selection
- Brand damage from unapproved marketing
- Financial exposure from unauthorized spending
- Legal liability from unverified claims
- Compliance violations from uncertified products

---

## Checkpoint Registry

| # | Checkpoint | Stage | Owner | Blocking | SLA |
|---|------------|-------|-------|----------|-----|
| 1 | Supplier Shortlist Approval | Procurement | Procurement Lead | Yes | 48 hrs |
| 2 | Sample Order Authorization | Procurement | Finance Lead | Yes | 24 hrs |
| 3 | Product Quality Approval | Curation | Product Lead | Yes | 72 hrs |
| 4 | Final Box Contents | Curation | Product Lead | Yes | 48 hrs |
| 5 | Marketing Copy Review | Narrative | Legal/Marketing | Yes | 72 hrs |
| 6 | Launch Budget Approval | Launch | CFO | Yes | 24 hrs |
| 7 | Compliance Clearance | Curation | Compliance Lead | Yes | 5 days |

---

## Checkpoint 1: Supplier Shortlist Approval

**Stage**: Procurement  
**Owner**: Procurement Lead  
**When**: After Procurement Agent produces supplier shortlist

### Review Criteria
- [ ] Supplier score ≥ 0.55
- [ ] At least one verified supplier (gold/factory verified)
- [ ] Lead time acceptable for drop timeline
- [ ] FOB price within budget constraints
- [ ] Defect rate history acceptable (< 5%)

### Required Documents
- Supplier evaluation JSON
- Cost breakdown (FOB + landed)
- Negotiation template preview
- Supplier verification evidence

### Actions
| Action | Next Step |
|--------|-----------|
| `approve` | Create sample order task |
| `reject` | Return to TrendRadar for alternatives |
| `request_more_suppliers` | Re-run Procurement with expanded search |

### Approval Record
```json
{
  "checkpoint": "supplier_shortlist",
  "candidate_id": "trend-xxx",
  "approved_supplier_id": "sup-123",
  "approved_by": "procurement_lead@zapnest.com",
  "approved_at": "2025-02-10T14:30:00+05:30",
  "notes": "Approved for sample order. Monitor defect rate closely."
}
```

---

## Checkpoint 2: Sample Order Authorization

**Stage**: Procurement  
**Owner**: Finance Lead  
**When**: After supplier shortlist approved

### Review Criteria
- [ ] Budget available for sample + shipping
- [ ] Payment terms acceptable
- [ ] Trade assurance or payment protection in place
- [ ] Sample quantity reasonable

### Required Documents
- Approved supplier details
- Sample cost breakdown
- Payment authorization form

### Spending Limits
| Sample Value | Approver |
|--------------|----------|
| < ₹5,000 | Procurement Lead |
| ₹5,000 - ₹25,000 | Finance Lead |
| > ₹25,000 | CFO |

---

## Checkpoint 3: Product Quality Approval

**Stage**: Curation  
**Owner**: Product Lead  
**When**: After Curation Agent completes QA

### Review Criteria
- [ ] Trust score ≥ 0.6
- [ ] Spec variance ≤ 30% for key claims
- [ ] Visual inspection passed
- [ ] No blocking compliance flags
- [ ] Packaging suitable for brand standards

### Red Flags (Auto-escalate)
- Trust score < 0.5
- Spec variance > 50%
- Safety test failures
- Multiple cosmetic defects

### Required Documents
- Curation Agent output JSON
- Sample test photos
- Spec verification table
- Compliance flag summary

### Actions
| Action | Next Step |
|--------|-----------|
| `approve` | Add to box composition |
| `approve_with_conditions` | Proceed with noted limitations |
| `require_more_tests` | Order additional samples or tests |
| `reject` | Remove from pipeline |

---

## Checkpoint 4: Final Box Contents

**Stage**: Curation  
**Owner**: Product Lead  
**When**: Box composition finalized

### Review Criteria
- [ ] Hero product approved
- [ ] Accessories complement hero
- [ ] Total cost within margin target (> 50%)
- [ ] Packaging spec appropriate for tier
- [ ] All compliance flags cleared

### Required Documents
- Box definition JSON
- Margin calculation
- Packaging mockup
- Product compatibility notes

### Pricing Review
| Tier | Target Price | Min Margin |
|------|-------------|------------|
| Lite | ₹999 - ₹1,499 | 50% |
| Core | ₹2,499 - ₹3,499 | 50% |
| Elite | ₹4,999 - ₹7,999 | 45% |

---

## Checkpoint 5: Marketing Copy Review

**Stage**: Narrative  
**Owner**: Legal + Marketing Lead  
**When**: Narrative Agent produces copy

### Review Criteria
- [ ] All claims have audit sources
- [ ] No unsubstantiated superlatives
- [ ] Brand voice alignment (Futuristic Premium)
- [ ] No competitor disparagement
- [ ] Pricing and availability accurate
- [ ] Required disclaimers included

### Legal Checklist
- [ ] No false advertising risk
- [ ] Privacy policy link included
- [ ] Return policy clear
- [ ] "Results may vary" disclaimers if needed

### Required Documents
- Full narrative output JSON
- Audit table for all claims
- Email sequence preview
- Ad copy variations

### Actions
| Action | Next Step |
|--------|-----------|
| `approve` | Clear for launch |
| `edit_required` | Return to Narrative with feedback |
| `legal_block` | Escalate to legal counsel |

---

## Checkpoint 6: Launch Budget Approval

**Stage**: Launch  
**Owner**: CFO  
**When**: Launch plan finalized

### Review Criteria
- [ ] Total budget within approved limits
- [ ] Channel allocation reasonable
- [ ] KPI targets achievable
- [ ] ROI projections justified
- [ ] Contingency reserved (10%+)

### Budget Thresholds
| Budget | Approver |
|--------|----------|
| < ₹50,000 | Marketing Lead |
| ₹50,000 - ₹200,000 | CFO |
| > ₹200,000 | CEO |

### Required Documents
- Launch plan JSON
- Budget allocation breakdown
- Historical performance benchmarks
- Risk assessment

---

## Checkpoint 7: Compliance Clearance

**Stage**: Curation (Pre-ship)  
**Owner**: Compliance Lead  
**When**: Products with compliance flags

### Common Compliance Flags
| Flag | Requirement | Timeline |
|------|-------------|----------|
| `battery_cert_needed` | BIS certificate for Li-ion | 5-15 days |
| `bis_cert_needed` | BIS registration for electronics | 15-30 days |
| `wireless_cert_needed` | WPC approval for Bluetooth/WiFi | 15-30 days |
| `hazmat_shipping_check` | Dangerous goods declaration | 3-5 days |

### Clearance Process
1. Identify required certifications
2. Collect supplier documentation
3. File applications if needed
4. Receive approval/registration
5. Update product record

### Actions
| Action | Next Step |
|--------|-----------|
| `cleared` | Product ready to ship |
| `pending` | Hold shipment until cleared |
| `blocked` | Cannot ship; seek alternatives |

---

## HITL Dashboard Schema

```json
{
  "pending_checkpoints": [
    {
      "checkpoint_id": "hitl-001",
      "checkpoint_type": "supplier_shortlist",
      "related_id": "trend-20251210-001",
      "created_at": "2025-02-08T10:00:00+05:30",
      "due_at": "2025-02-10T10:00:00+05:30",
      "owner": "procurement_lead",
      "status": "pending",
      "priority": "high",
      "documents": [
        {"type": "supplier_eval", "url": "..."},
        {"type": "cost_breakdown", "url": "..."}
      ]
    }
  ],
  "completed_checkpoints": [
    {
      "checkpoint_id": "hitl-000",
      "approved_by": "product_lead@zapnest.com",
      "approved_at": "2025-02-05T15:30:00+05:30",
      "decision": "approve",
      "notes": "..."
    }
  ],
  "overdue_count": 0,
  "sla_at_risk": 1
}
```

---

## Escalation Path

If checkpoint is overdue:

1. **24 hrs overdue**: Notify owner + backup approver
2. **48 hrs overdue**: Escalate to department head
3. **72 hrs overdue**: Escalate to COO
4. **Blocking launch**: CEO notification

---

## Emergency Override

In exceptional circumstances, CFO or CEO can override a blocking checkpoint with:

```json
{
  "override_type": "emergency",
  "checkpoint_id": "hitl-xxx",
  "overridden_by": "ceo@zapnest.com",
  "reason": "Time-sensitive launch; accept calculated risk",
  "conditions": "Monitor first 100 orders closely",
  "audit_trail": true
}
```

Overrides must be logged and reviewed quarterly.
