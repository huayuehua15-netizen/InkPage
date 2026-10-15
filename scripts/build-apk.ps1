# InkPage Android APK 打包脚本
# 自动查找 JDK 21（Capacitor 8 要求），然后用 Gradle 打包 Debug APK。
# 用法：powershell -ExecutionPolicy Bypass -File scripts/build-apk.ps1 [-Release]

param(
    [switch]$Release
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Find-Jdk21 {
    # 1) 已经可用的 JAVA_HOME
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\javac.exe")) {
        $v = & "$env:JAVA_HOME\bin\java.exe" -version 2>&1 | Select-String -Pattern '"(\d+)' | ForEach-Object { $_.Matches[0].Groups[1].Value }
        if ($v -eq '21') { return $env:JAVA_HOME }
    }
    # 2) 常见本地安装位置
    $candidates = @(
        "$env:USERPROFILE\.jdks\temurin-21\jdk-21.0.12.1+1",
        "$env:USERPROFILE\.jdks\*21*",
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Eclipse Adoptium\*21*",
        "C:\Program Files\Java\*21*",
        "/usr/lib/jvm/java-21*"
    )
    foreach ($pattern in $candidates) {
        foreach ($dir in (Get-Item -Path $pattern -ErrorAction SilentlyContinue)) {
            if (Test-Path "$($dir.FullName)\bin\javac.exe") { return $dir.FullName }
        }
    }
    return $null
}

$jdk = Find-Jdk21
if (-not $jdk) {
    Write-Error "未找到 JDK 21。Capacitor 8 需要 JDK 21，请先安装（如 https://adoptium.net/temurin/releases/?version=21 ）后重试。"
    exit 1
}
Write-Host "使用 JDK 21: $jdk" -ForegroundColor Green
$env:JAVA_HOME = $jdk
$env:Path = "$jdk\bin;$env:Path"

# 确保 Web 产物为最新并同步到 Android 工程
Push-Location $root
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
npx cap sync android
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

$task = if ($Release) { 'assembleRelease' } else { 'assembleDebug' }
Push-Location (Join-Path $root 'android')
if (Test-Path '.\gradlew.bat') {
    .\gradlew.bat $task --no-daemon
} else {
    ./gradlew $task --no-daemon
}
$ok = ($LASTEXITCODE -eq 0)
Pop-Location
if (-not $ok) { exit 1 }

# 复制 APK 到项目根目录
$built = if ($Release) {
    Join-Path $root 'android\app\build\outputs\apk\release\app-release-unsigned.apk'
} else {
    Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk'
}
if (Test-Path $built) {
    $name = if ($Release) { 'InkPage-v1.0.0-release-unsigned.apk' } else { 'InkPage-v1.0.0-debug.apk' }
    Copy-Item $built (Join-Path $root $name) -Force
    Write-Host "APK 已生成: $root\$name" -ForegroundColor Green
}
