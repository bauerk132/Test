#!/usr/bin/env bash
# Check (and optionally request) the SageMaker GPU quotas this plan needs.
#
# WHY THIS IS DAY 0
#   New AWS accounts often have a quota of 0 for GPU training instances. A quota of 0 means the
#   first job fails immediately with "ResourceLimitExceeded". Requests can take hours to days,
#   so file them first and do the free steps (dataset inspection) while you wait.
#
# RUN:
#     bash aws/02_quotas.sh            # just show current values
#     bash aws/02_quotas.sh request    # ask AWS to raise each to 1 (needs permission)
set -euo pipefail

# The exact quota names AWS uses. spot and on-demand are separate quotas.
NAMES=(
  "ml.g5.xlarge for training job usage"
  "ml.g6e.xlarge for training job usage"
  "ml.g5.xlarge for spot training job usage"
  "ml.g6e.xlarge for spot training job usage"
)

aws service-quotas list-service-quotas --service-code sagemaker --max-results 100 \
  --query "Quotas[?contains(QuotaName, 'training job usage') && (contains(QuotaName, 'ml.g5.xlarge') || contains(QuotaName, 'ml.g6e.xlarge'))].[QuotaName,QuotaCode,Value]" \
  --output table

if [[ "${1:-}" == "request" ]]; then
  for n in "${NAMES[@]}"; do
    code="$(aws service-quotas list-service-quotas --service-code sagemaker --max-results 100 \
            --query "Quotas[?QuotaName=='$n'].QuotaCode | [0]" --output text)"
    if [[ "$code" == "None" || -z "$code" ]]; then echo "not found on this page of results: $n (use the console: Service Quotas > SageMaker)"; continue; fi
    echo "requesting 1 for: $n ($code)"
    aws service-quotas request-service-quota-increase --service-code sagemaker --quota-code "$code" --desired-value 1 \
      --query "RequestedQuota.[QuotaName,Status]" --output text || echo "  (request refused or already pending)"
  done
fi
echo "Note: results may span multiple pages. If a name is missing, search it in the Service Quotas console."
