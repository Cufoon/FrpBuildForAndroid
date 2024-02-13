param([string]$a)
if ($a -eq "") {
    Write-Output "please provide the frp version tag"
    exit
}

powershell.exe .\build-arm64-core.ps1 $a
.\upx\upx.exe --best .\build\frpc-arm64 -o .\build\frpc-arm64-upx
Copy-Item .\build\frpc-arm64-upx .\build\libfrpc.so
