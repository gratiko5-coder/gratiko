Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\herod\OneDrive\Desktop\GRATIKO\public\icon.png"
$orig = [System.Drawing.Image]::FromFile($srcPath)

# 1. Créer une icône carrée 512x512 centrée avec fond transparent pour foreground
$squareSize = 512
$fgBmp = New-Object System.Drawing.Bitmap($squareSize, $squareSize)
$gFg = [System.Drawing.Graphics]::FromImage($fgBmp)
$gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Ratio pour contenir le logo dans un carré de 380px (zone sécurisée de l'adaptive icon Android)
$targetW = 380
$targetH = [int](380 * ($orig.Height / $orig.Width))
$posX = [int](($squareSize - $targetW) / 2)
$posY = [int](($squareSize - $targetH) / 2)

$gFg.DrawImage($orig, $posX, $posY, $targetW, $targetH)
$gFg.Dispose()

$squareFgPath = "C:\Users\herod\OneDrive\Desktop\GRATIKO\public\android-icon-fg.png"
$fgBmp.Save($squareFgPath, [System.Drawing.Imaging.ImageFormat]::Png)
$fgBmp.Dispose()

# 2. Créer une icône pleine 512x512 avec fond sombre #0b0f19 pour ic_launcher et ic_launcher_round
$fullBmp = New-Object System.Drawing.Bitmap($squareSize, $squareSize)
$gFull = [System.Drawing.Graphics]::FromImage($fullBmp)
$gFull.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFull.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gFull.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$bgColor = [System.Drawing.Color]::FromArgb(255, 11, 15, 25) # #0b0f19
$brush = New-Object System.Drawing.SolidBrush($bgColor)
$gFull.FillRectangle($brush, 0, 0, $squareSize, $squareSize)
$brush.Dispose()

$targetWFull = 420
$targetHFull = [int](420 * ($orig.Height / $orig.Width))
$posXFull = [int](($squareSize - $targetWFull) / 2)
$posYFull = [int](($squareSize - $targetHFull) / 2)

$gFull.DrawImage($orig, $posXFull, $posYFull, $targetWFull, $targetHFull)
$gFull.Dispose()

$squareFullPath = "C:\Users\herod\OneDrive\Desktop\GRATIKO\public\android-icon-full.png"
$fullBmp.Save($squareFullPath, [System.Drawing.Imaging.ImageFormat]::Png)
$fullBmp.Dispose()

$orig.Dispose()
Write-Host "✅ Icônes Android générées avec succès : 512x512 foreground et full !"
