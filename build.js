const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("<<< please provide the frp version tag");
  process.exit(1);
}

const LDFLAGS = JSON.stringify("-s -w");

const versionTag = args[0];
console.log("<<< 即将编译 frpc arm64", versionTag);

const scriptRoot = __dirname;
console.log("<<< 当前脚本所在目录", scriptRoot);

const CC_PATH = path.join(
  scriptRoot,
  "ndk/toolchains/llvm/prebuilt/windows-x86_64/bin/aarch64-linux-android33-clang.cmd"
);

if (!fs.existsSync(CC_PATH)) {
  console.error("<<< ndk error!");
  process.exit(1);
}

const workspacePath = path.join(scriptRoot, "workspace");
console.log("<<< 工作空间", workspacePath);

try {
  if (fs.existsSync(workspacePath)) {
    fs.rmSync(workspacePath, { recursive: true, force: true });
  }
  fs.mkdirSync(workspacePath);
} catch (err) {
  console.error("<<< Error handling workspace directory:", err);
  process.exit(1);
}

try {
  process.chdir(workspacePath);
  console.log("<<< 拉取仓库源码");
  execSync("git clone https://github.com/fatedier/frp.git", {
    stdio: "inherit",
  });

  process.chdir(path.join(workspacePath, "frp"));

  console.log("<<< checkout", versionTag);
  execSync(`git branch cufoonCTA ${versionTag}`, { stdio: "inherit" });
  execSync("git checkout cufoonCTA", { stdio: "inherit" });
  execSync("go mod download", { stdio: "inherit" });

  console.log("<<< 设置 go 编译环境变量");
  process.env.GOOS = "android";
  process.env.GOARCH = "arm64";
  process.env.CGO_ENABLED = 0;
  process.env.CC = CC_PATH;

  const buildDir = path.join(scriptRoot, "build");
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const buildTargetPathCMD = JSON.stringify(path.join(buildDir, "frpc-arm64"));

  const goBuildCMD = `go build -trimpath -ldflags ${LDFLAGS} -o ${buildTargetPathCMD} ./cmd/frpc/main.go`;

  console.log("<<< go build cmd", goBuildCMD);

  execSync(goBuildCMD, { stdio: "inherit" });

  const upxPath = JSON.stringify(path.join(scriptRoot, "./upx/upx"));
  const upxTargetPath = path.join(buildDir, "frpc-arm64-upx");
  const upxTargetPathCMD = JSON.stringify(upxTargetPath);

  if (fs.existsSync(upxTargetPath)) {
    fs.rmSync(upxTargetPath, { force: true });
  }
  const upxCMD = `${upxPath} --best ${buildTargetPathCMD} -o ${upxTargetPathCMD}`;
  console.log("<<< upx file improve", upxCMD);
  execSync(upxCMD, { stdio: "inherit" });

  const forAndroidPath = path.join(buildDir, "libfrpc.so");
  if (fs.existsSync(forAndroidPath)) {
    fs.rmSync(forAndroidPath);
  }
  fs.copyFileSync(upxTargetPath, forAndroidPath, fs.constants.COPYFILE_EXCL);
} catch (error) {
  console.error("<<< Error during build process:", error);
  process.exit(1);
}
