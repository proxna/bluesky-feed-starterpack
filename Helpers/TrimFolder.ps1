param (
    [Parameter(Mandatory = $true)]
    [string]$FolderPath,

    [Parameter(Mandatory = $true)]
    [int]$FilesToKeep
)

# Ensure the folder exists
if (-Not (Test-Path -Path $FolderPath)) {
    Write-Error "The folder path '$FolderPath' does not exist."
    exit 1
}

# Get the list of files in the folder, sorted by LastWriteTime descending
$files = Get-ChildItem -Path $FolderPath -File | Sort-Object LastWriteTime -Descending

# Calculate the number of files to delete
$FilesToDeleteCount = $files.Count - $FilesToKeep

if ($FilesToDeleteCount -le 0) {
    Write-Output "No files to delete. The folder already contains $FilesToKeep or fewer files."
    exit 0
}

# Select the files to delete
$FilesToDelete = $files | Select-Object -Last $FilesToDeleteCount

# Delete the files
foreach ($file in $FilesToDelete) {
    try {
        Remove-Item -Path $file.FullName -Force
        Write-Output "Deleted file: $($file.FullName)"
    } catch {
        Write-Error "Failed to delete file: $($file.FullName). Error: $_"
    }
}

Write-Output "Deleted $FilesToDeleteCount files, keeping the latest $FilesToKeep files."
