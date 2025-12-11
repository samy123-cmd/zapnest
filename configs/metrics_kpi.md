# Metrics & KPI Templates

> Success metrics, tracking requirements, and reporting templates.

---

## Core Business Metrics

### Primary KPIs

| Metric | Definition | Target | Frequency |
|--------|------------|--------|-----------|
| CAC | Total marketing spend / new customers | ≤ ₹240 | Weekly |
| LTV | Average revenue per customer (12 months) | ≥ ₹720 | Monthly |
| LTV/CAC | Lifetime value / acquisition cost | ≥ 3.0 | Monthly |
| Defect Rate | Defective units / units shipped | ≤ 4% | Per drop |
| Discovery-to-Ship | Days from trend detection to first shipment | ≤ 60 days | Per drop |

### Conversion Funnel

| Stage | Metric | Target |
|-------|--------|--------|
| Awareness | Impressions | Benchmark |
| Interest | CTR | ≥ 1.5% |
| Consideration | Landing Page → Email Signup | ≥ 8% |
| Intent | Email Signup → Cart Add | ≥ 25% |
| Purchase | Cart → Order | ≥ 45% |
| Retention | 90-day Repeat | ≥ 30% |

---

## Agent-Specific Metrics

### TrendRadar

| Metric | Definition | Target |
|--------|------------|--------|
| Candidates per run | Number of candidates returned | 10-20 |
| Shortlist rate | Shortlisted / total candidates | 15-30% |
| Hit rate | Shortlisted → eventually shipped | ≥ 20% |
| Signal accuracy | Shipped products with positive reviews | ≥ 80% |

### Procurement

| Metric | Definition | Target |
|--------|------------|--------|
| Suppliers per candidate | Suppliers evaluated | ≥ 3 |
| Supplier approval rate | Approved / evaluated | 30-50% |
| Landed cost accuracy | Actual vs. estimated | ±10% |
| Lead time accuracy | Actual vs. quoted | ±20% |

### Curation

| Metric | Definition | Target |
|--------|------------|--------|
| Approval rate | Approved / tested | 40-60% |
| Spec accuracy | Measured vs. claimed (variance) | ≤ 25% |
| Trust score distribution | Average trust score | ≥ 0.65 |
| Compliance flag rate | Products with flags | Monitor |

### Narrative

| Metric | Definition | Target |
|--------|------------|--------|
| First-pass approval | Approved without edits | ≥ 70% |
| Audit coverage | Claims with sources / total claims | 100% |
| Email open rate | Opens / delivered | ≥ 35% |
| Email click rate | Clicks / opens | ≥ 20% |

### Launch

| Metric | Definition | Target |
|--------|------------|--------|
| ROAS | Revenue / ad spend | ≥ 3.0 |
| Ad CTR | Clicks / impressions | ≥ 1.5% |
| Budget utilization | Spent / allocated | 85-100% |
| Timeline adherence | Tasks on time / total tasks | ≥ 90% |

### Support

| Metric | Definition | Target |
|--------|------------|--------|
| First response time | Avg time to first response | ≤ 4 hrs |
| Resolution time | Avg time to resolution | ≤ 24 hrs |
| CSAT | Customer satisfaction score | ≥ 4.2/5 |
| Escalation rate | Escalated / total tickets | ≤ 15% |
| First contact resolution | Resolved on first contact | ≥ 60% |

---

## Drop-Level Metrics

Track per drop (drop-XXX):

```json
{
  "drop_id": "drop-001",
  "metrics": {
    "pipeline": {
      "candidates_evaluated": 25,
      "suppliers_contacted": 8,
      "samples_ordered": 4,
      "samples_approved": 2,
      "products_shipped": 2
    },
    "timeline": {
      "trend_detected": "2025-01-15",
      "sample_received": "2025-02-01",
      "box_approved": "2025-02-10",
      "launch_date": "2025-02-28",
      "total_days": 44
    },
    "quality": {
      "defect_reports": 3,
      "units_shipped": 180,
      "defect_rate_pct": 1.67
    },
    "sales": {
      "units_sold": 165,
      "revenue_inr": 493500,
      "avg_order_value": 2990,
      "conversion_rate": 0.14
    },
    "marketing": {
      "impressions": 250000,
      "clicks": 4500,
      "ctr": 0.018,
      "spend_inr": 45000,
      "cac_inr": 272,
      "roas": 10.97
    }
  }
}
```

---

## Weekly Report Template

### JSON Schema
```json
{
  "report_type": "weekly",
  "week_of": "2025-02-03",
  "generated_at": "2025-02-10T00:00:00+05:30",
  "summary": {
    "discovery_candidates": 45,
    "candidates_shortlisted": 12,
    "samples_ordered": 3,
    "samples_approved": 2,
    "drops_launched": 1,
    "box_defect_rate_pct": 1.8,
    "cac_7day_inr": 248,
    "roas_7day": 4.2,
    "waitlist_conversion_pct": 13.5,
    "revenue_weekly_inr": 285000,
    "ltv_estimate_inr": 890
  },
  "alerts": [
    {
      "type": "warning",
      "metric": "cac",
      "message": "CAC slightly above target (248 vs 240)"
    }
  ],
  "agent_health": {
    "trend_radar": {"runs": 7, "success_rate": 1.0},
    "procurement": {"runs": 2, "success_rate": 1.0},
    "curation": {"runs": 3, "success_rate": 0.67},
    "narrative": {"runs": 1, "success_rate": 1.0},
    "launch": {"runs": 1, "success_rate": 1.0},
    "support": {"tickets": 23, "resolution_rate": 0.91}
  },
  "executive_summary": "Strong week with one Core drop launched. Conversion exceeded target at 13.5%. CAC slightly elevated due to new channel testing. Two products approved for next Core box. No quality alerts."
}
```

### Human-Readable Format
```markdown
# ZapNest Weekly Report — Week of Feb 3, 2025

## Executive Summary
Strong week with one Core drop launched. Conversion exceeded target 
at 13.5%. CAC slightly elevated due to new channel testing. 
Two products approved for next Core box. No quality alerts.

## Key Metrics
| Metric | Actual | Target | Status |
|--------|--------|--------|--------|
| CAC | ₹248 | ≤₹240 | ⚠️ |
| ROAS | 4.2 | ≥3.0 | ✅ |
| Conversion | 13.5% | ≥12% | ✅ |
| Defect Rate | 1.8% | ≤4% | ✅ |

## Pipeline
- **45** candidates discovered
- **12** shortlisted for procurement
- **3** samples ordered
- **2** samples approved

## Revenue
- Weekly: ₹2,85,000
- LTV Estimate: ₹890

## Alerts
⚠️ CAC slightly above target (₹248 vs ₹240)

## Agent Health
All agents operational. Curation had 1 blocked run (missing test data).
```

---

## Alert Thresholds

### Critical (Immediate action)
| Metric | Threshold |
|--------|-----------|
| Defect rate | > 6% |
| CAC | > 1.5× target |
| Agent failure | > 3 consecutive |
| Support SLA breach | > 10% tickets |

### Warning (Review required)
| Metric | Threshold |
|--------|-----------|
| Defect rate | > 4% |
| CAC | > 1.2× target |
| Conversion | < 0.8× target |
| ROAS | < 0.9× target |

### Info (Monitor)
| Metric | Threshold |
|--------|-----------|
| Any metric | 10% below target |
| Pipeline slowdown | > 7 days delay |

---

## Dashboard Integration

### Data Sources
```json
{
  "integrations": {
    "analytics": "Google Analytics 4",
    "ads": ["Meta Ads Manager", "Google Ads"],
    "email": "Postmark/SendGrid",
    "ecommerce": "Shopify",
    "support": "Freshdesk/Zendesk"
  }
}
```

### Refresh Schedule
| Data Type | Frequency |
|-----------|-----------|
| Real-time (orders) | 5 min |
| Ads performance | Hourly |
| Email metrics | 4 hours |
| Weekly roll-ups | Daily midnight |
| Monthly reports | 1st of month |

---

## Cohort Analysis

Track cohorts by acquisition month:

```json
{
  "cohort": "2025-02",
  "cohort_size": 245,
  "metrics": {
    "month_0": {"retention": 1.0, "revenue_per_user": 2800},
    "month_1": {"retention": 0.42, "revenue_per_user": 1150},
    "month_2": {"retention": 0.35, "revenue_per_user": 980},
    "month_3": {"retention": 0.31, "revenue_per_user": 920}
  },
  "predicted_ltv": 8750
}
```

### Retention Targets
| Month | Target |
|-------|--------|
| M1 | ≥ 40% |
| M2 | ≥ 32% |
| M3 | ≥ 28% |
| M6 | ≥ 22% |
| M12 | ≥ 18% |
