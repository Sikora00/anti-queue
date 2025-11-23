#!/bin/bash

COUNT=${1:-1}
URL="http://localhost:3000/reporting/generate"

echo "Generating $COUNT reports..."

for ((i=1; i<=COUNT; i++))
do
   echo "Request #$i"
   curl -X POST $URL
   echo ""
done

echo "Done."
