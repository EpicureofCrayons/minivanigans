<#
Build Minivanigans! Windows installers locally.

Default: unsigned MSI and NSIS EXE installers.
Signed build: .\build-windows.ps1 -Signed
#>

[CmdletBinding()]
param(
    [switch]$Signed
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Require-Command {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found."
    }
}

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [string[]]$Arguments = @()
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "'$Command $($Arguments -join ' ')' failed with exit code $LASTEXITCODE."
    }
}

if ($env:OS -ne "Windows_NT") {
    throw "This script must be run on Windows."
}

Require-Command "node"
Require-Command "npm"
Require-Command "rustc"
Require-Command "cargo"

$NpmCommandInfo = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
if ($NpmCommandInfo) {
    $NpmCommand = $NpmCommandInfo.Source
}
else {
    $NpmCommand = (Get-Command "npm" -ErrorAction Stop).Source
}

$RustHost = (& rustc -vV | Select-String "^host:").ToString()
if ($RustHost -notmatch "windows-msvc") {
    throw "The Rust MSVC toolchain is required. Install it with: rustup default stable-msvc"
}

if (-not (Get-Command "cl.exe" -ErrorAction SilentlyContinue)) {
    Write-Warning @"
Microsoft C++ Build Tools were not found on PATH. If the build fails at the
link step, install Visual Studio 2022 Build Tools with:
  - Desktop development with C++
  - Windows 10 or Windows 11 SDK
Then reopen PowerShell and run this script again.
"@
}

$RepoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PlayerDir = Join-Path $RepoDir "apps\player"
$BundleDir = Join-Path $PlayerDir "src-tauri\target\release\bundle"

Push-Location $RepoDir
try {
    Write-Host "`n==> Installing JavaScript dependencies" -ForegroundColor Cyan
    Invoke-Native -Command $NpmCommand -Arguments @("install")

    Write-Host "`n==> Running tests" -ForegroundColor Cyan
    Invoke-Native -Command $NpmCommand -Arguments @("test")

    Write-Host "`n==> Building the shared rules engine" -ForegroundColor Cyan
    Invoke-Native -Command $NpmCommand -Arguments @(
        "run", "build", "-w", "@minivanigans/rules-engine"
    )

    $TauriArguments = @(
        "run", "tauri", "build", "--",
        "--ci",
        "--bundles", "msi,nsis"
    )
    if (-not $Signed) {
        $TauriArguments += "--no-sign"
        Write-Host "`n==> Building unsigned Windows MSI and EXE installers" -ForegroundColor Cyan
    }
    else {
        Write-Host "`n==> Building signed Windows MSI and EXE installers" -ForegroundColor Cyan
    }

    Push-Location $PlayerDir
    try {
        Invoke-Native -Command $NpmCommand -Arguments $TauriArguments
    }
    finally {
        Pop-Location
    }

    Write-Host "`nBuild complete. Installers:" -ForegroundColor Green
    $Artifacts = Get-ChildItem $BundleDir -Recurse -File |
        Where-Object { $_.Extension -in ".msi", ".exe" }

    if (-not $Artifacts) {
        throw "The build finished, but no MSI or EXE installer was found in '$BundleDir'."
    }

    $Artifacts | ForEach-Object { Write-Host "  $($_.FullName)" }

    if (-not $Signed) {
        Write-Host "`nNote: this build is unsigned, so Windows SmartScreen may show a warning." -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}
