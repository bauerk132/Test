#!/usr/bin/env bash
# Create a monthly AWS budget with email alerts at $15, $22 and $25 (your handoff's three alarms).
#
# RUN ONCE, before any training, from a terminal where `aws` works (Studio terminal is fine):
#     EMAIL=you@example.com LIMIT=25 bash aws/01_budgets.sh
#
# READ THIS BEFORE TRUSTING IT
#   * Budgets EMAIL YOU. They do not stop anything. AWS billing data also lags by hours, so an alert
#     can arrive after money is already spent. The real stop-loss is the hard time limit every
#     job gets from launch/launch_job.py (--max-hours).
#   * The budget covers your WHOLE AWS account for the calendar month. If the account has other
#     spending, raise LIMIT or use a separate account for this project.
#   * Check for leftovers every time you stop working:
#         aws sagemaker list-training-jobs --status-equals InProgress
#         aws sagemaker list-endpoints          # must be empty; one endpoint ~ $1,000/month
#         aws sagemaker list-apps               # running Studio apps that bill by the hour
set -euo pipefail

: "${EMAIL:?set EMAIL=you@example.com}"
LIMIT="${LIMIT:-25}"
NAME="${NAME:-coding-lab-monthly}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

BUDGET_JSON="$(mktemp)"
NOTIFY_JSON="$(mktemp)"

cat > "$BUDGET_JSON" <<JSON
{
  "BudgetName": "$NAME",
  "BudgetLimit": { "Amount": "$LIMIT", "Unit": "USD" },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
JSON

python3 - "$EMAIL" > "$NOTIFY_JSON" <<'PY'
import json, sys
email = sys.argv[1]
def alert(dollars):
    return {
        "Notification": {"NotificationType": "ACTUAL", "ComparisonOperator": "GREATER_THAN",
                         "Threshold": dollars, "ThresholdType": "ABSOLUTE_VALUE"},
        "Subscribers": [{"SubscriptionType": "EMAIL", "Address": email}],
    }
print(json.dumps([alert(15), alert(22), alert(25)]))
PY

aws budgets create-budget \
  --account-id "$ACCOUNT_ID" \
  --budget "file://$BUDGET_JSON" \
  --notifications-with-subscribers "file://$NOTIFY_JSON"

echo "Created budget '$NAME' (\$$LIMIT/month) with email alerts at \$15, \$22, \$25 -> $EMAIL"
echo "Confirm the subscription email AWS sends you, or no alerts will arrive."
