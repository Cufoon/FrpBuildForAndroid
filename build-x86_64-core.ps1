param([string]$a)
Write-Output $PSScriptRoot
$CC_PATH = $PSScriptRoot + "\ndk\toolchains\llvm\prebuilt\windows-x86_64\bin\x86_64-linux-android31-clang.cmd"
Get-Item workspace >$null 2>$null 
if ($?) {
    Remove-Item -Force -Recurse ./workspace
}
mkdir workspace >$null 2>$null
Set-Location workspace
git clone https://github.com/fatedier/frp.git
if (-not $?) {  
    exit
}
Set-Location frp
git branch cufoonCompiledToAndroid $a
git checkout cufoonCompiledToAndroid
$env:GOOS = "android"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = 1
$env:CC = $CC_PATH
go build -o ../../build/frpc-x86_64 .\cmd\frpc\main.go