# Install Hyperledger Fabric Binaries for Windows
# This script downloads and extracts Fabric binaries

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Hyperledger Fabric Binaries Installation" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FABRIC_VERSION = "2.5.0"
$CA_VERSION = "1.5.5"
$FABRIC_NETWORK_DIR = $PSScriptRoot
$BIN_DIR = Join-Path $FABRIC_NETWORK_DIR "bin"

# Create bin directory
Write-Host "Creating bin directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $BIN_DIR | Out-Null

# Download Fabric binaries
$FABRIC_URL = "https://github.com/hyperledger/fabric/releases/download/v$FABRIC_VERSION/hyperledger-fabric-windows-amd64-$FABRIC_VERSION.tar.gz"
$FABRIC_TAR = Join-Path $FABRIC_NETWORK_DIR "fabric-binaries.tar.gz"

Write-Host "Downloading Hyperledger Fabric binaries v$FABRIC_VERSION..." -ForegroundColor Yellow
Write-Host "URL: $FABRIC_URL" -ForegroundColor Gray

try {
    Invoke-WebRequest -Uri $FABRIC_URL -OutFile $FABRIC_TAR -UseBasicParsing
    Write-Host "✓ Download complete!" -ForegroundColor Green
} catch {
    Write-Host "✗ Download failed: $_" -ForegroundColor Red
    exit 1
}

# Extract binaries using tar (available in Windows 10+)
Write-Host ""
Write-Host "Extracting binaries..." -ForegroundColor Yellow

try {
    tar -xzf $FABRIC_TAR -C $FABRIC_NETWORK_DIR
    Write-Host "✓ Extraction complete!" -ForegroundColor Green
} catch {
    Write-Host "✗ Extraction failed: $_" -ForegroundColor Red
    Write-Host "Note: Make sure tar is available (Windows 10 1803+)" -ForegroundColor Yellow
    exit 1
}

# Clean up tar file
Write-Host ""
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $FABRIC_TAR -Force
Write-Host "✓ Cleanup complete!" -ForegroundColor Green

# Verify binaries
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Verifying Installation" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$binaries = @("peer.exe", "orderer.exe", "configtxgen.exe", "cryptogen.exe", "configtxlator.exe")

foreach ($binary in $binaries) {
    $binaryPath = Join-Path $BIN_DIR $binary
    if (Test-Path $binaryPath) {
        Write-Host "✓ $binary found" -ForegroundColor Green
    } else {
        Write-Host "✗ $binary NOT found" -ForegroundColor Red
    }
}

# Add to PATH for current session
Write-Host ""
Write-Host "Adding binaries to PATH for current session..." -ForegroundColor Yellow
$env:Path = "$BIN_DIR;$env:Path"
Write-Host "✓ PATH updated!" -ForegroundColor Green

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Binaries installed in: $BIN_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "To add to PATH permanently, run:" -ForegroundColor Yellow
Write-Host '[System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";' + $BIN_DIR + '", "User")' -ForegroundColor Gray
Write-Host ""
Write-Host "Test installation:" -ForegroundColor Yellow
Write-Host "  .\bin\peer.exe version" -ForegroundColor Gray
Write-Host "  .\bin\cryptogen.exe version" -ForegroundColor Gray
Write-Host "  .\bin\configtxgen.exe -version" -ForegroundColor Gray
Write-Host ""
