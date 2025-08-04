# run-pica-mcp.ps1
$env:PICA_SECRET = (Get-Content .env | Where-Object {$_ -match "PICA_SECRET="}) -replace "PICA_SECRET=", ""

Write-Host "Starting Pica MCP Server locally on port 8001..." -ForegroundColor Green
Write-Host "Make sure you have configured your Pica connections at: https://app.picaos.com/connections" -ForegroundColor Yellow

# Run Pica MCP locally from node_modules
npx @picahq/pica-mcp --port 8001