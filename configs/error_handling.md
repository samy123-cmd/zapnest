# Error Handling Rules

> Standard error handling and retry policies for all agents.

---

## Error Categories

| Category | Code Range | Retry | Human Escalation |
|----------|------------|-------|------------------|
| Transient | 1xxx | Yes (3x) | After max retries |
| Data | 2xxx | No | Immediate |
| Validation | 3xxx | No | Context-dependent |
| External API | 4xxx | Yes (3x) | After max retries |
| Authorization | 5xxx | No | Immediate |
| System | 9xxx | Yes (1x) | Immediate |

---

## Standard Error Response

All agents must return errors in this format:

```json
{
  "status": "error",
  "error": {
    "code": "2001",
    "category": "data",
    "message": "Missing required field: supplier_id",
    "details": {
      "field": "supplier_id",
      "expected": "string",
      "received": null
    },
    "retry_allowed": false,
    "human_action_required": true,
    "suggested_action": "Provide supplier_id and retry"
  },
  "timestamp": "2025-02-10T10:30:00+05:30",
  "agent": "ProcurementAgent",
  "request_id": "req-abc123"
}
```

---

## Retry Policy

### Exponential Backoff
```
retry_delay_ms = min(base_delay × 2^attempt, max_delay)

base_delay = 1000ms
max_delay = 30000ms
max_attempts = 3
```

| Attempt | Delay |
|---------|-------|
| 1 | 1s |
| 2 | 2s |
| 3 | 4s |

### Jitter
Add random jitter (0-500ms) to prevent thundering herd.

---

## Error Codes

### 1xxx: Transient Errors

| Code | Name | Description | Action |
|------|------|-------------|--------|
| 1001 | `network_timeout` | Request timed out | Retry |
| 1002 | `connection_failed` | Could not connect | Retry |
| 1003 | `service_unavailable` | Upstream 503 | Retry with backoff |

### 2xxx: Data Errors

| Code | Name | Description | Action |
|------|------|-------------|--------|
| 2001 | `missing_required_field` | Required field null/empty | Human ticket |
| 2002 | `invalid_reference` | Referenced ID not found | Human ticket |
| 2003 | `data_inconsistency` | Conflicting data detected | Human ticket |
| 2004 | `stale_data` | Data outdated | Refresh and retry |

### 3xxx: Validation Errors

| Code | Name | Description | Action |
|------|------|-------------|--------|
| 3001 | `schema_violation` | Output doesn't match schema | Fix agent logic |
| 3002 | `threshold_not_met` | Score below threshold | Mark blocked |
| 3003 | `audit_missing` | Claim without evidence | Edit and retry |
| 3004 | `constraint_violated` | Business rule broken | Human review |

### 4xxx: External API Errors

| Code | Name | Description | Action |
|------|------|-------------|--------|
| 4001 | `api_rate_limited` | Rate limit hit | Retry with backoff |
| 4002 | `api_auth_failed` | Authentication error | Human (check keys) |
| 4003 | `api_deprecated` | Endpoint deprecated | Update integration |
| 4004 | `api_response_invalid` | Unexpected response format | Log and escalate |

### 5xxx: Authorization Errors

| Code | Name | Description | Action |
|------|------|-------------|--------|
| 5001 | `unauthorized_action` | No permission for action | Deny and log |
| 5002 | `hitl_required` | Human approval needed | Create HITL ticket |
| 5003 | `approval_denied` | Human rejected action | Log and halt |

### 9xxx: System Errors

| Code | Name | Description | Action |
|------|------|-------------|--------|
| 9001 | `internal_error` | Unhandled exception | Log, retry once |
| 9002 | `configuration_error` | Missing config | Human (DevOps) |
| 9003 | `resource_exhausted` | Out of memory/quota | Scale or throttle |

---

## Circuit Breaker

Implement circuit breaker for external APIs:

```json
{
  "circuit_breaker": {
    "failure_threshold": 5,
    "success_threshold": 2,
    "timeout_ms": 30000,
    "half_open_requests": 1
  }
}
```

| State | Behavior |
|-------|----------|
| `closed` | Normal operation |
| `open` | Fail immediately (no external calls) |
| `half_open` | Allow limited test requests |

---

## Human Ticket Creation

When human escalation is required:

```json
{
  "ticket_type": "agent_error",
  "priority": "high",
  "agent": "ProcurementAgent",
  "error_code": "2003",
  "context": {
    "candidate_id": "trend-xxx",
    "supplier_id": "sup-123"
  },
  "summary": "Data inconsistency: supplier MOQ changed between queries",
  "suggested_action": "Verify current supplier data and re-run",
  "assigned_to": "procurement_lead",
  "sla_hours": 24
}
```

---

## Logging Requirements

All errors must be logged with:

```json
{
  "timestamp": "ISO datetime",
  "level": "error",
  "agent": "AgentName",
  "request_id": "unique-id",
  "error_code": "xxxx",
  "error_message": "...",
  "stack_trace": "...",
  "input_hash": "sha256 of input (not PII)",
  "retry_count": 0,
  "resolved": false
}
```

**PII Protection**: Never log raw customer data. Use hashed IDs only.

---

## Recovery Procedures

### Automatic Recovery
1. Retry transient errors with backoff
2. Refresh stale data and retry
3. Skip optional enrichments on timeout

### Manual Recovery
1. Data errors → Human fixes data → Re-trigger agent
2. Validation errors → Review logic → Patch agent
3. Auth errors → Rotate credentials → Re-deploy

### Rollback
If agent produces bad data that propagated:
1. Identify affected records
2. Mark records as `status: "rollback"`
3. Notify downstream consumers
4. Restore from last known good state
