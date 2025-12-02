# PowerShell script to run migrations
# Usage: .\migrate.ps1 [up|down|fresh|version|create|force]

param(
    [Parameter(Position=0)]
    [string]$Command = "up",
    
    [Parameter(Position=1)]
    [string]$Name = "",
    
    [Parameter(Position=2)]
    [int]$Version = -1
)

Write-Host "Running migration command: $Command" -ForegroundColor Cyan

switch ($Command.ToLower()) {
    "up" {
        go run cmd/migrate/main.go -command up
    }
    "down" {
        go run cmd/migrate/main.go -command down
    }
    "fresh" {
        Write-Host "⚠️  WARNING: This will drop ALL tables and re-run migrations!" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            go run cmd/migrate/main.go -command fresh
        } else {
            Write-Host "Cancelled." -ForegroundColor Red
            exit 1
        }
    }
    "version" {
        go run cmd/migrate/main.go -command version
    }
    "create" {
        if ([string]::IsNullOrWhiteSpace($Name)) {
            Write-Host "❌ Migration name is required" -ForegroundColor Red
            Write-Host "Usage: .\migrate.ps1 create <migration_name>"
            exit 1
        }
        go run cmd/migrate/main.go -command create -name $Name
    }
    "force" {
        # For force command, treat the second positional parameter as version
        $forceVersion = $Version
        if ($forceVersion -lt 0 -and -not [string]::IsNullOrWhiteSpace($Name)) {
            # Try to parse Name as version number if Version wasn't provided
            if ([int]::TryParse($Name, [ref]$forceVersion)) {
                # Successfully parsed Name as version
            } else {
                $forceVersion = -1
            }
        }
        
        if ($forceVersion -lt 0) {
            Write-Host "❌ Version number is required" -ForegroundColor Red
            Write-Host "Usage: .\migrate.ps1 force <version_number>" -ForegroundColor Yellow
            Write-Host "Example: .\migrate.ps1 force 10" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "This command fixes 'dirty database version' errors by forcing the version."
            exit 1
        }
        go run cmd/migrate/main.go -command force -version $forceVersion
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host "Usage: .\migrate.ps1 [up|down|fresh|version|create <name>|force <version>]"
        exit 1
    }
}
