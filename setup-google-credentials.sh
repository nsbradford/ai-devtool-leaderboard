#!/bin/bash
# Helper script to convert Google Cloud service account JSON to Base64
# Usage: ./setup-google-credentials.sh path/to/service-account.json

if [ -z "$1" ]; then
  echo "Usage: ./setup-google-credentials.sh path/to/service-account.json"
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "Error: File not found: $1"
  exit 1
fi

echo "Converting $1 to Base64..."
base64 -i "$1" | tr -d '\n'
echo ""
echo ""
echo "Copy the Base64 string above and paste it into your .env.local file as GOOGLE_APPLICATION_CREDENTIALS"
