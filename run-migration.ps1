# PowerShell script to run Supabase migration

Write-Host "Supabase Migration Runner" -ForegroundColor Cyan
Write-Host ""

$migrationPath = "supabase\migrations\20250103000000_add_restaurant_menu_items.sql"

if (-not (Test-Path $migrationPath)) {
    Write-Host "ERROR: Migration file not found at: $migrationPath" -ForegroundColor Red
    exit 1
}

Write-Host "Migration file found: $migrationPath" -ForegroundColor Green
Write-Host ""

Write-Host "Migration Summary:" -ForegroundColor Yellow
Write-Host "   - Adds restaurant_id column to menu_items table"
Write-Host "   - Creates 8 Jollibee categories"
Write-Host "   - Adds 50+ Jollibee menu items"
Write-Host "   - Updates Jollibee restaurant details"
Write-Host ""

Write-Host "To execute this migration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Supabase Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "   1. Go to: https://supabase.com/dashboard"
Write-Host "   2. Select your project"
Write-Host "   3. Go to SQL Editor (left sidebar)"
Write-Host "   4. Click 'New query'"
Write-Host "   5. Copy the SQL from the file: $migrationPath"
Write-Host "   6. Paste and click 'Run'"
Write-Host ""

$copy = Read-Host "Would you like to copy the SQL to clipboard now? (y/n)"
if ($copy -eq "y" -or $copy -eq "Y") {
    Get-Content -Path $migrationPath -Raw | Set-Clipboard
    Write-Host "SQL copied to clipboard! You can now paste it in Supabase SQL Editor." -ForegroundColor Green
}

Write-Host ""
$open = Read-Host "Would you like to open the SQL file in your default editor? (y/n)"
if ($open -eq "y" -or $open -eq "Y") {
    Start-Process $migrationPath
}

Write-Host ""
Write-Host "Ready to migrate! Follow the instructions above." -ForegroundColor Green
