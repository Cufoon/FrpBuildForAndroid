param([string]$a)
if ($a -eq "") {
    Write-Output "please provide the frp version tag"
    exit
}

powershell.exe .\build-x86_64-core.ps1 $a
.\upx\upx.exe --best .\build\frpc-x86_64 -o .\build\frpc-x86_64-upx
