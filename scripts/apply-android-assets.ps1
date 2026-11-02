$fgPath = "C:\Users\herod\OneDrive\Desktop\GRATIKO\public\android-icon-fg.png"
$fullPath = "C:\Users\herod\OneDrive\Desktop\GRATIKO\public\android-icon-full.png"
$splashPath = "C:\Users\herod\OneDrive\Desktop\GRATIKO\public\icon.png"

$resDir = "C:\Users\herod\OneDrive\Desktop\GRATIKO\android\app\src\main\res"

# Mipmap densities
$densities = @("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")

foreach ($d in $densities) {
    $folder = Join-Path $resDir "mipmap-$d"
    if (Test-Path $folder) {
        Copy-Item -Force $fgPath (Join-Path $folder "ic_launcher_foreground.png")
        Copy-Item -Force $fullPath (Join-Path $folder "ic_launcher.png")
        Copy-Item -Force $fullPath (Join-Path $folder "ic_launcher_round.png")
        Write-Host "Updated mipmap-$d with GRATIKO logo"
    }
}

# Update all splash screens
$splashFiles = Get-ChildItem -Path $resDir -Recurse -Filter "*splash.png"
foreach ($f in $splashFiles) {
    Copy-Item -Force $splashPath $f.FullName
    Write-Host "Updated $($f.FullName) with GRATIKO splash"
}

Write-Host "✅ Toutes les icônes et écrans de démarrage Android sont configurés avec le logo GRATIKO !"
