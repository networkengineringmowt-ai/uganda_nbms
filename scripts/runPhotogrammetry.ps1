param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[BC]\d{3}$')][string]$StructureId,
  [switch]$Dense,
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'
$Repo = Split-Path -Parent $PSScriptRoot
$Project = Join-Path $Repo "photogrammetry\$StructureId"
$Images = Join-Path $Project 'images'
$Database = Join-Path $Project 'database.db'
$Sparse = Join-Path $Project 'sparse'
$DenseDir = Join-Path $Project 'dense'
$TwinDir = Join-Path $Repo "public\twins\$StructureId"

node (Join-Path $PSScriptRoot 'preparePhotogrammetry.mjs') $StructureId
if (-not (Get-Command colmap -ErrorAction SilentlyContinue)) {
  throw 'COLMAP was not found. Install the free open-source COLMAP package and ensure colmap.exe is on PATH.'
}

New-Item -ItemType Directory -Force -Path $Sparse, $DenseDir, $TwinDir | Out-Null
colmap feature_extractor --database_path $Database --image_path $Images --ImageReader.single_camera 0
colmap exhaustive_matcher --database_path $Database
colmap mapper --database_path $Database --image_path $Images --output_path $Sparse

if ($Dense) {
  colmap image_undistorter --image_path $Images --input_path (Join-Path $Sparse '0') --output_path $DenseDir --output_type COLMAP
  colmap patch_match_stereo --workspace_path $DenseDir --workspace_format COLMAP --PatchMatchStereo.geom_consistency true
  colmap stereo_fusion --workspace_path $DenseDir --workspace_format COLMAP --input_type geometric --output_path (Join-Path $DenseDir 'fused.ply')
  if ($Publish) {
    Copy-Item -LiteralPath (Join-Path $DenseDir 'fused.ply') -Destination (Join-Path $TwinDir 'pointcloud.ply') -Force
    node (Join-Path $PSScriptRoot 'buildTwinManifest.mjs')
  }
}

Write-Host "Reconstruction completed for $StructureId. Register survey control before claiming certified dimensional accuracy."
