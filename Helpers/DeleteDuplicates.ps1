# Check if folder path is provided as a parameter
param (
    [string]$FolderPath
)

# Validate the parameter
if (-not $FolderPath) {
    Write-Error "Please provide a folder path as a parameter."
    exit 1
}

# Ensure the folder exists
if (-Not (Test-Path -Path $FolderPath)) {
    Write-Error "The specified folder does not exist: $FolderPath"
    exit 1
}

# Hashtable to store file hashes and their paths
$FileHashes = @{}

# Get all files in the folder
$Files = Get-ChildItem -Path $FolderPath -Recurse -File

foreach ($File in $Files) {
    try {
        # Compute the hash of the file content
        $Hash = Get-FileHash -Path $File.FullName -Algorithm SHA256

        # Check if the hash already exists in the hashtable
        if ($FileHashes.ContainsKey($Hash.Hash)) {
            # Duplicate file detected, delete it
            Write-Host "Deleting duplicate: $($File.FullName)" -ForegroundColor Yellow
            Remove-Item -Path $File.FullName -Force
        } else {
            # Add the hash and file path to the hashtable
            $FileHashes[$Hash.Hash] = $File.FullName
        }
    } catch {
        Write-Warning "Failed to process file: $($File.FullName). Error: $_"
    }
}

Write-Host "Deduplication complete. Unique files retained." -ForegroundColor Green