# Free IM 本地从 0 到 1 编译与全链路联调手册

本文档用于在 Windows 本机完整跑通这套 IM 系统，包括基础 IM 服务、业务服务、Web 管理台、Flutter 客户端、接口验证、账号初始化、常见报错处理和日常开发循环。

适用目录结构：

```text
E:\IM
├─ Free-IM-Server              # OpenIM 基础服务，Go，提供 IM API / WS / RPC / 消息等基础能力
├─ Free-IM-Chat-master         # FreeChat 业务服务，Go，提供组织、后台、钱包、签到、抽奖等业务接口
├─ Im-org-admin-panel-master   # Web 管理台，Node + pnpm + Umi/Max
└─ im-flutter-master           # Flutter 客户端
```

完整本地联调链路：

```text
Docker 基础依赖
    ↓
Free-IM-Server
    ↓
Free-IM-Chat-master
    ↓
Web 管理台 / Flutter 客户端 / API 调试工具
```

原则：先让底层服务健康，再接业务服务，最后接前端和移动端。不要从前端报错开始盲目改代码。

## 1. 目标与验收标准

本地完整联调完成后，应满足：

```text
1. Docker 依赖正常运行
2. Free-IM-Server 正常启动
3. Free-IM-Chat-master 正常启动
4. Web 管理台可以打开登录页
5. demo_admin / 123456 可以登录管理台
6. 登录后不会报 ObjectID、token、connection refused
7. 管理台能访问组织、用户、钱包、签到、抽奖等接口
8. Flutter 客户端能连接本地 IM API 和 WS
9. 后端新增接口能被 curl / Postman / 前端页面打通
10. 修改 Go / 前端 / Flutter 后知道如何重新编译和重启
```

核心本地端口：

| 端口 | 所属项目 | 用途 |
|---:|---|---|
| `10001` | `Free-IM-Server` | WebSocket，客户端收发消息 |
| `10002` | `Free-IM-Server` | OpenIM API |
| `10005` | `Free-IM-Server` | MinIO |
| `10008` | `Free-IM-Chat-master` | Chat API，管理台主要业务接口 |
| `10009` | `Free-IM-Chat-master` | Admin API / Chat token 相关接口 |
| `30200` | `Free-IM-Chat-master` | admin-rpc |
| `30300` | `Free-IM-Chat-master` | chat-rpc |
| `8000` | `Im-org-admin-panel-master` | Web 管理台开发服务 |

## 2. 本机必备软件

### 2.1 Docker Desktop

用于跑 MongoDB、Redis、MinIO、Kafka 等依赖。

验证：

```powershell
docker version
docker compose version
```

如果 `docker compose` 不存在，但 `docker-compose` 存在，后续命令可以替换为：

```powershell
docker-compose up -d
```

### 2.2 Go

后端是 Go 项目。验证：

```powershell
go version
```

建议使用项目当前能正常构建的 Go 版本。若你本机 Go 版本较新，只要能 `mage` 编译通过即可。

### 2.3 Mage

后端项目使用 `mage` 编译和启动。

验证：

```powershell
mage -version
```

如果没有安装：

```powershell
go install github.com/magefile/mage@latest
```

确认 Go bin 已在 PATH 中。常见路径：

```text
C:\Users\ASUS\go\bin
```

### 2.4 Node.js 与 pnpm

Web 管理台使用 Node + pnpm。

推荐：

```text
Node.js 20 LTS
pnpm 10.x
```

不要用 `Node 24`。本项目的 `Umi/Max 4.1.1` 依赖链里有老包，`Node 24` 会触发类似：

```text
No such module: http_parser
```

验证：

```powershell
node -v
npm -v
pnpm -v
```

安装 pnpm：

```powershell
npm install -g pnpm
```

如果刚安装完 Node 但 PowerShell 找不到 `node`，关闭所有 PowerShell 窗口，重新打开。

### 2.5 Flutter

如果要联调移动端，需要 Flutter。

验证：

```powershell
flutter --version
flutter doctor
```

移动端项目 `pubspec.yaml` 要求 Dart SDK：

```text
>=3.0.0 <4.0.0
```

Flutter 3.x 通常可用。Android 还需要 Android Studio、Android SDK、模拟器或真机。

## 3. 工作区准备

统一从根目录进入：

```powershell
cd e:\IM
```

确认目录存在：

```powershell
Get-ChildItem
```

应看到：

```text
Free-IM-Server
Free-IM-Chat-master
Im-org-admin-panel-master
im-flutter-master
```

如果 Go 缓存目录有权限问题，建议把缓存放到工作区：

```powershell
$env:GOCACHE="E:\IM\.tmp\gocache"
$env:GOMODCACHE="E:\IM\.tmp\gomodcache"
$env:GOPATH="E:\IM\.tmp\gopath"
$env:PATH="$env:GOPATH\bin;$env:PATH"
New-Item -ItemType Directory -Force "E:\IM\.tmp\gocache" | Out-Null
New-Item -ItemType Directory -Force "E:\IM\.tmp\gomodcache" | Out-Null
New-Item -ItemType Directory -Force "E:\IM\.tmp\gopath" | Out-Null
```

这些环境变量只对当前 PowerShell 窗口有效。关闭窗口后需要重新设置。

## 4. 启动 Free-IM-Server

`Free-IM-Server` 是底层 IM 服务，必须先启动。

### 4.1 进入目录

```powershell
cd e:\IM\Free-IM-Server
```

### 4.2 启动 Docker 依赖

```powershell
docker compose up -d
```

查看容器：

```powershell
docker compose ps
```

如果容器没有起来，先看日志：

```powershell
docker compose logs
```

### 4.3 初始化项目

```powershell
bootstrap.bat
```

这个步骤通常用于准备配置、依赖、脚本或构建环境。

### 4.4 编译

```powershell
mage
```

如果出现依赖下载失败，确认网络和 Go 代理。常见临时设置：

```powershell
$env:GOPROXY="https://goproxy.cn,direct"
```

然后重新执行：

```powershell
mage
```

### 4.5 启动服务

```powershell
mage start
```

### 4.6 验证端口

```powershell
netstat -ano | findstr :10001
netstat -ano | findstr :10002
netstat -ano | findstr :10005
```

看到 `LISTENING` 说明端口已监听。

### 4.7 常见问题

#### 4.7.1 端口被占用

查 PID：

```powershell
netstat -ano | findstr :10002
```

结束进程：

```powershell
taskkill /F /PID 进程ID
```

#### 4.7.2 Go 缓存权限错误

使用第 3 节的 `GOCACHE` / `GOMODCACHE` / `GOPATH` 重定向方案。

#### 4.7.3 Docker 服务没起来

先确认 Docker Desktop 已启动，再执行：

```powershell
docker info
docker compose ps
docker compose logs
```

## 5. 配置并启动 Free-IM-Chat-master

`Free-IM-Chat-master` 是业务服务。管理台和 Flutter 的很多业务接口都走这里。

### 5.1 进入目录

```powershell
cd e:\IM\Free-IM-Chat-master
```

### 5.2 检查本地关键配置

配置目录：

```text
E:\IM\Free-IM-Chat-master\config
```

重点文件：

```text
chat-api-chat.yml
chat-api-admin.yml
chat-rpc-chat.yml
chat-rpc-admin.yml
mongodb.yml
redis.yml
share.yml
discovery.yml
```

本地监听地址建议：

```yaml
listenIP: 0.0.0.0
registerIP: ""
```

不要写死局域网 IP，例如：

```text
192.168.31.166
```

否则换网络、换 IP 或本机没有这个地址时，会出现：

```text
listen err, rpcTcpAddr=192.168.x.x:30200
```

### 5.3 确认连接 OpenIM API

检查：

```text
E:\IM\Free-IM-Chat-master\config\share.yml
```

本地应指向：

```text
http://127.0.0.1:10002
```

如果指向线上域名，本地业务服务会和本地 IM 服务断开。

### 5.4 初始化项目

```powershell
bootstrap.bat
```

### 5.5 编译

```powershell
mage
```

### 5.6 启用本地开发 seed

空数据库没有管理台账号。项目已加入本地 seed，启动时设置：

```powershell
$env:IS_LOCAL_TEST="true"
```

这个环境变量只对当前 PowerShell 窗口有效。

seed 账号：

```text
账号：demo_admin
密码：123456
```

前端登录时输入明文 `123456` 即可，前端会自动做 MD5。

### 5.7 启动服务

```powershell
mage start
```

如果之前已启动过，可以先停：

```powershell
mage stop
mage start
```

### 5.8 验证端口

```powershell
netstat -ano | findstr :10008
netstat -ano | findstr :10009
netstat -ano | findstr :30200
netstat -ano | findstr :30300
```

应看到：

```text
10008 LISTENING
10009 LISTENING
30200 LISTENING
30300 LISTENING
```

### 5.9 验证登录接口

密码 `123456` 的 MD5：

```text
e10adc3949ba59abbe56e057f20f883e
```

PowerShell 测试：

```powershell
$body = @{
  account = "demo_admin"
  password = "e10adc3949ba59abbe56e057f20f883e"
  platform = 5
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:10008/third_admin/login" `
  -Headers @{ operationID = "local-login-test" } `
  -ContentType "application/json" `
  -Body $body
```

预期返回包含：

```text
admin_token
im_token
organization
user_id
im_user_id
```

如果返回 `Invalid parameters`，检查 JSON 格式、请求头、服务日志。

### 5.10 常见问题

#### 5.10.1 `admin-rpc` 监听失败

现象：

```text
listen err, rpcTcpAddr=192.168.x.x:30200
```

处理：

```text
1. 打开 config/chat-rpc-admin.yml
2. 把 listenIP 改为 0.0.0.0
3. 把 registerIP 改为空字符串
4. mage stop
5. mage start
```

#### 5.10.2 管理台提示 ObjectID 错误

现象：

```text
the provided hex string is not a valid ObjectID
```

含义：前端传给后端的组织 ID 不是合法 Mongo ObjectID。

检查浏览器控制台：

```js
localStorage.getItem('OrganizationID')
```

合法值应是 24 位十六进制字符串，例如：

```text
65cb3e4e84c5d73b8add8526
```

如果不是，清掉重新登录：

```js
localStorage.removeItem('OrganizationID')
location.reload()
```

#### 5.10.3 seed 没生效

确认启动 `Free-IM-Chat-master` 的同一个 PowerShell 窗口里执行过：

```powershell
$env:IS_LOCAL_TEST="true"
```

然后重启：

```powershell
mage stop
mage start
```

启动日志里应看到类似：

```text
created local dev admin seed successfully
```

或：

```text
local dev admin seed already exists
```

## 6. 启动 Web 管理台

Web 项目：

```text
E:\IM\Im-org-admin-panel-master
```

### 6.1 进入目录

```powershell
cd e:\IM\Im-org-admin-panel-master
```

### 6.2 确认 Node 版本

```powershell
node -v
pnpm -v
```

推荐：

```text
Node 20.x
pnpm 10.x
```

如果是 `Node 24`，先卸载或切换到 Node 20。

### 6.3 安装依赖

```powershell
pnpm install
```

如果之前用 Node 24 安装过依赖，建议删除重装：

```powershell
cmd /c "rmdir /s /q node_modules"
pnpm install
```

如果 PowerShell 删除 `node_modules` 卡住，先中断：

```text
Ctrl + C
```

再用：

```powershell
taskkill /F /IM node.exe
cmd /c "rmdir /s /q node_modules"
```

### 6.4 确认前端本地接口配置

文件：

```text
E:\IM\Im-org-admin-panel-master\src\config\index.ts
```

本地联调应指向：

```ts
export const WS_URL = 'ws://127.0.0.1:10001';
export const API_URL = 'http://127.0.0.1:10002';
export const CHAT_URL = 'http://127.0.0.1:10008';
export const ACCOUNT_URL = 'http://127.0.0.1:10009';
```

如果这里仍然是线上域名，页面虽然是本地打开，但接口会打到线上。

### 6.5 启动开发服务

```powershell
pnpm start
```

浏览器打开：

```text
http://localhost:8000
```

### 6.6 登录

```text
账号：demo_admin
密码：123456
```

如果登录后有旧缓存，浏览器控制台执行：

```js
localStorage.clear()
location.reload()
```

然后重新登录。

### 6.7 前端构建

开发环境构建：

```powershell
pnpm run build:dev
```

生产构建：

```powershell
pnpm run build
```

预览：

```powershell
pnpm run preview
```

### 6.8 常见前端问题

#### 6.8.1 `http_parser` 报错

现象：

```text
No such module: http_parser
```

原因：Node 24 与旧依赖不兼容。

处理：换 Node 20 LTS，删除 `node_modules` 后重新安装。

#### 6.8.2 `mf-va_remoteEntry.js` 加载失败

现象：

```text
ScriptExternalLoadError: Loading script failed.
http://localhost:8000/mf-va_remoteEntry.js
```

先看 Umi 日志：

```text
node_modules\.cache\logger\umi.log
```

如果看到：

```text
Can not resolve dependence : 'xlsx'
```

处理：

```powershell
pnpm add xlsx
pnpm start
```

#### 6.8.3 `Browserslist: caniuse-lite is outdated`

这是提示，不是启动 blocker。

可选处理：

```powershell
npx update-browserslist-db@latest
```

#### 6.8.4 `fatal: not a git repository`

安装依赖时 `husky install` 可能提示：

```text
fatal: not a git repository
```

如果当前目录不是 Git 仓库，这个可以先忽略，不影响启动。

## 7. 启动 Flutter 客户端

Flutter 项目：

```text
E:\IM\im-flutter-master
```

### 7.1 进入目录

```powershell
cd e:\IM\im-flutter-master
```

### 7.2 检查 Flutter 环境

```powershell
flutter --version
flutter doctor
```

Android 联调至少需要：

```text
1. Android SDK
2. Android Studio 或命令行工具
3. 一个模拟器或真机
4. adb 可用
```

查看设备：

```powershell
flutter devices
```

### 7.3 安装依赖

```powershell
flutter clean
flutter pub get
```

如果依赖下载慢，配置国内源后重新执行：

```powershell
$env:PUB_HOSTED_URL="https://pub.flutter-io.cn"
$env:FLUTTER_STORAGE_BASE_URL="https://storage.flutter-io.cn"
flutter pub get
```

### 7.4 配置本地服务地址

配置入口：

```text
E:\IM\im-flutter-master\openim_common\lib\src\config.dart
```

本地 dev 模式会根据 `DEV_HOST` 拼出：

```text
http://DEV_HOST:10008  # appAuthUrl，Chat API
http://DEV_HOST:10009  # chatTokenUrl
http://DEV_HOST:10002  # imApiUrl
ws://DEV_HOST:10001    # imWsUrl
```

#### Android 模拟器

Android 模拟器访问宿主机通常用：

```text
10.0.2.2
```

运行：

```powershell
flutter run --dart-define=ENV=dev --dart-define=DEV_HOST=10.0.2.2
```

#### Android 真机

真机不能用 `127.0.0.1`，必须用电脑局域网 IP。

查看电脑 IP：

```powershell
ipconfig
```

找当前 Wi-Fi 或网卡的 IPv4，例如：

```text
192.168.31.100
```

运行：

```powershell
flutter run --dart-define=ENV=dev --dart-define=DEV_HOST=192.168.31.100
```

注意：

```text
1. 手机和电脑必须在同一个局域网
2. Windows 防火墙不能拦截 10001 / 10002 / 10008 / 10009
3. 后端监听地址必须是 0.0.0.0，不能只监听 127.0.0.1
```

### 7.5 Flutter 打包

Android APK：

```powershell
flutter build apk --dart-define=ENV=dev --dart-define=DEV_HOST=你的电脑IP
```

Android AppBundle：

```powershell
flutter build appbundle --dart-define=ENV=dev --dart-define=DEV_HOST=你的电脑IP
```

iOS：

```powershell
flutter build ipa --dart-define=ENV=dev --dart-define=DEV_HOST=你的电脑IP
```

iOS 需要 macOS 和 Xcode，Windows 不能直接打 iOS 包。

### 7.6 Flutter 常见问题

#### 7.6.1 客户端连不上本机服务

先确认地址：

```text
Android 模拟器：10.0.2.2
Android 真机：电脑局域网 IP
Windows 本机：127.0.0.1
```

确认端口：

```powershell
netstat -ano | findstr :10001
netstat -ano | findstr :10002
netstat -ano | findstr :10008
netstat -ano | findstr :10009
```

#### 7.6.2 远程配置干扰本地

`config.dart` 里存在远程配置逻辑。dev 模式建议明确传入：

```powershell
--dart-define=ENV=dev --dart-define=DEV_HOST=...
```

如果旧配置缓存影响，卸载 App 后重新安装，或清应用数据。

#### 7.6.3 真机能访问网页但 App 不能访问

检查：

```text
1. 防火墙是否放行端口
2. 后端是否监听 0.0.0.0
3. 手机是否和电脑在同一个 Wi-Fi
4. DEV_HOST 是否写成电脑 IP，而不是 127.0.0.1
```

## 8. API 调试方法

不管是 Web 还是 Flutter，新增功能最好先用 API 工具打通。

### 8.1 登录拿 token

```powershell
$loginBody = @{
  account = "demo_admin"
  password = "e10adc3949ba59abbe56e057f20f883e"
  platform = 5
} | ConvertTo-Json

$loginResp = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:10008/third_admin/login" `
  -Headers @{ operationID = "login-debug" } `
  -ContentType "application/json" `
  -Body $loginBody

$loginResp
```

从返回中取：

```powershell
$token = $loginResp.data.admin_token
$orgId = $loginResp.data.organization.id
```

如果 `$orgId` 不是字符串，可以打印：

```powershell
$loginResp.data.organization | ConvertTo-Json -Depth 10
```

### 8.2 带 token 和 orgid 调业务接口

示例：组织信息。

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:10008/third_admin/organization/info" `
  -Headers @{
    operationID = "org-info-debug"
    token = $token
    orgid = $orgId
  }
```

### 8.3 调 OpenIM API

OpenIM API 地址：

```text
http://127.0.0.1:10002
```

具体接口需要看 `Free-IM-Server` 的 API 定义和当前业务调用处。业务服务通常会通过配置中的 OpenIM API 地址间接调用，不建议前端绕过业务服务直接操作底层 IM 数据。

### 8.4 Postman / Apifox 请求头约定

常见请求头：

```text
operationID: 任意唯一字符串
token: 登录拿到的 admin_token 或 account token
orgid: 当前组织 ID
Content-Type: application/json
```

注意：后端常用的是 `orgid`。HTTP header 大小写不敏感，但建议直接写 `orgid`。

## 9. 修改代码后的开发循环

### 9.1 修改 Free-IM-Server

```powershell
cd e:\IM\Free-IM-Server
mage
mage stop
mage start
```

如果只是某个服务变更，但不确定依赖关系，最简单稳定是整体重启。

### 9.2 修改 Free-IM-Chat-master

```powershell
cd e:\IM\Free-IM-Chat-master
$env:IS_LOCAL_TEST="true"
mage
mage stop
mage start
```

如果改了配置，也需要重启。

### 9.3 修改 Web 管理台

开发服务支持热更新：

```powershell
cd e:\IM\Im-org-admin-panel-master
pnpm start
```

如果改了依赖：

```powershell
pnpm install
pnpm start
```

如果 MFSU 缓存异常：

```powershell
cmd /c "rmdir /s /q node_modules\.cache"
pnpm start
```

### 9.4 修改 Flutter

普通 Dart 代码改动：

```text
在 flutter run 终端按 r 热重载
```

涉及原生配置、依赖或启动参数：

```powershell
flutter clean
flutter pub get
flutter run --dart-define=ENV=dev --dart-define=DEV_HOST=...
```

## 10. 完整一键式手动启动顺序

开三个 PowerShell 窗口。

### 窗口 1：Free-IM-Server

```powershell
cd e:\IM\Free-IM-Server
docker compose up -d
mage start
```

### 窗口 2：Free-IM-Chat-master

```powershell
cd e:\IM\Free-IM-Chat-master
$env:IS_LOCAL_TEST="true"
mage start
```

### 窗口 3：Web 管理台

```powershell
cd e:\IM\Im-org-admin-panel-master
pnpm start
```

浏览器：

```text
http://localhost:8000
```

登录：

```text
demo_admin / 123456
```

如果要启动 Flutter，再开窗口 4。

### 窗口 4：Flutter

Android 模拟器：

```powershell
cd e:\IM\im-flutter-master
flutter run --dart-define=ENV=dev --dart-define=DEV_HOST=10.0.2.2
```

Android 真机：

```powershell
cd e:\IM\im-flutter-master
flutter run --dart-define=ENV=dev --dart-define=DEV_HOST=你的电脑局域网IP
```

## 11. 完整停止顺序

停止前端：

```text
在 pnpm start 窗口按 Ctrl + C
```

停止 Flutter：

```text
在 flutter run 窗口按 q 或 Ctrl + C
```

停止 Chat 服务：

```powershell
cd e:\IM\Free-IM-Chat-master
mage stop
```

停止 Server 服务：

```powershell
cd e:\IM\Free-IM-Server
mage stop
```

停止 Docker 依赖：

```powershell
cd e:\IM\Free-IM-Server
docker compose down
```

如果要保留数据库数据，不要删除 volume。

如果要彻底清库，谨慎使用：

```powershell
docker compose down -v
```

这会删除 Docker volume，数据库数据会丢失。

## 12. 数据库与账号策略

### 12.1 本地账号来源

新库默认没有管理台账号，因此使用本地 seed：

```powershell
$env:IS_LOCAL_TEST="true"
```

默认账号：

```text
demo_admin / 123456
```

### 12.2 密码存储

Web 登录页会把明文密码做 MD5 后发给后端。

```text
123456 -> e10adc3949ba59abbe56e057f20f883e
```

所以前端输入明文：

```text
123456
```

不要在登录框里输入 MD5。

### 12.3 组织 ID

组织 ID 必须是 Mongo ObjectID：

```text
24 位十六进制字符串
```

示例：

```text
65cb3e4e84c5d73b8add8526
```

如果前端传了空字符串、`undefined`、`[object Object]`、普通业务 ID，就会触发：

```text
the provided hex string is not a valid ObjectID
```

## 13. 端口和连通性检查清单

### 13.1 本机端口监听

```powershell
netstat -ano | findstr :10001
netstat -ano | findstr :10002
netstat -ano | findstr :10008
netstat -ano | findstr :10009
netstat -ano | findstr :30200
netstat -ano | findstr :30300
netstat -ano | findstr :8000
```

### 13.2 HTTP 可访问性

检查 Chat API 是否有响应：

```powershell
Invoke-WebRequest "http://127.0.0.1:10008" -UseBasicParsing
```

有些服务根路径可能返回 404 或 405，只要不是连接拒绝，说明端口通。

### 13.3 移动端访问宿主机

Android 模拟器：

```text
http://10.0.2.2:10008
ws://10.0.2.2:10001
```

真机：

```text
http://电脑IP:10008
ws://电脑IP:10001
```

## 14. 常见报错速查

### 14.1 `connection refused`

含义：目标端口没有服务监听，或地址写错。

处理：

```text
1. netstat 查端口
2. 确认对应服务已 mage start
3. 确认前端/Flutter 地址不是线上或错误 IP
4. 真机联调检查防火墙
```

### 14.2 `listen err`

含义：服务无法监听配置中的地址或端口。

处理：

```text
1. 查端口是否被占用
2. 查 listenIP 是否写死了不存在的 IP
3. 本地改为 0.0.0.0
```

### 14.3 `ObjectID` 错误

含义：某个接口需要 Mongo ObjectID，但传入不是 24 位 hex。

处理：

```text
1. 看浏览器 Network 里请求头 orgid
2. 看请求参数里 *_id 字段
3. 看 localStorage.OrganizationID
4. 清缓存后重新登录
```

### 14.4 `token` 相关错误

处理：

```text
1. 清 localStorage
2. 重新登录
3. 确认 Chat 服务和 OpenIM 服务都在本地
4. 确认系统时间正常
```

浏览器控制台：

```js
localStorage.clear()
location.reload()
```

### 14.5 前端依赖错误

处理顺序：

```powershell
cd e:\IM\Im-org-admin-panel-master
taskkill /F /IM node.exe
cmd /c "rmdir /s /q node_modules"
cmd /c "rmdir /s /q node_modules\.cache"
pnpm install
pnpm start
```

### 14.6 Go 依赖下载失败

设置代理：

```powershell
$env:GOPROXY="https://goproxy.cn,direct"
```

重新编译：

```powershell
mage
```

### 14.7 Docker 依赖异常

查看：

```powershell
docker compose ps
docker compose logs
```

重启：

```powershell
docker compose restart
```

彻底重建，注意会影响数据：

```powershell
docker compose down
docker compose up -d
```

清 volume 会删数据库：

```powershell
docker compose down -v
```

## 15. 新增功能联调流程

### 15.1 后端新增接口

推荐顺序：

```text
1. 在 Free-IM-Chat-master 写 service / dao / ctl
2. 注册路由
3. mage 编译
4. mage start 重启
5. 用 PowerShell / Postman 直接调接口
6. 确认返回数据结构
7. 再接 Web 或 Flutter
```

不要直接从页面开始调，否则无法判断是后端、前端、token、orgid 还是跨域问题。

### 15.2 Web 新增页面或按钮

推荐顺序：

```text
1. 先用 API 工具确认后端接口能通
2. 在 src/services 下封装请求
3. 页面调用 service
4. 确认请求头自动带 token / orgid
5. 看 Network 请求和响应
6. 看页面状态和错误提示
```

### 15.3 Flutter 新增功能

推荐顺序：

```text
1. 先用 API 工具确认接口能通
2. 确认 Flutter Config 指向本地
3. 写 Dart service / repository
4. flutter run 热重载
5. 看 App 日志和后端日志
6. 真机联调时确认 DEV_HOST 是电脑 IP
```

### 15.4 涉及消息收发

必须确认：

```text
1. Free-IM-Server 10001 WS 正常
2. Free-IM-Server 10002 API 正常
3. 用户 token 正常
4. 用户已注册到 OpenIM
5. 客户端连接的是本地 WS
6. Chat 业务服务没有连到线上 OpenIM
```

### 15.5 涉及组织、用户、钱包、签到、抽奖

必须确认：

```text
1. 请求头 orgid 合法
2. 当前账号属于该组织
3. 当前账号角色是 super admin 或 backend admin
4. token 是本次登录拿到的
5. 数据库里有对应基础数据
```

## 16. 推荐日常检查命令

### 16.1 查看所有关键端口

```powershell
netstat -ano | findstr ":10001 :10002 :10008 :10009 :30200 :30300 :8000"
```

如果 PowerShell 不支持这种写法，就分开执行。

### 16.2 查 Node / Go / Flutter

```powershell
node -v
pnpm -v
go version
mage -version
flutter --version
```

### 16.3 查 Docker

```powershell
docker ps
docker compose ps
```

### 16.4 清浏览器登录状态

浏览器控制台：

```js
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### 16.5 查看前端当前组织 ID

```js
localStorage.getItem('OrganizationID')
```

### 16.6 查看前端 token

```js
localStorage.getItem('IMAccountToken')
localStorage.getItem('IMAdminToken')
```

## 17. 最小成功路径

如果你只想最快跑起来，按下面执行。

### 17.1 启动底层服务

```powershell
cd e:\IM\Free-IM-Server
docker compose up -d
mage start
```

### 17.2 启动业务服务

```powershell
cd e:\IM\Free-IM-Chat-master
$env:IS_LOCAL_TEST="true"
mage start
```

### 17.3 启动管理台

```powershell
cd e:\IM\Im-org-admin-panel-master
pnpm install
pnpm start
```

### 17.4 登录

```text
http://localhost:8000

账号：demo_admin
密码：123456
```

### 17.5 启动 Flutter，Android 模拟器

```powershell
cd e:\IM\im-flutter-master
flutter pub get
flutter run --dart-define=ENV=dev --dart-define=DEV_HOST=10.0.2.2
```

### 17.6 启动 Flutter，真机

```powershell
cd e:\IM\im-flutter-master
flutter pub get
flutter run --dart-define=ENV=dev --dart-define=DEV_HOST=你的电脑局域网IP
```

## 18. 排查顺序总表

遇到问题按这个顺序：

```text
1. 服务是否启动
2. 端口是否监听
3. 地址是否本地
4. 配置是否写死 IP
5. token 是否有效
6. orgid 是否合法
7. 数据库是否有数据
8. 前端/Flutter 是否有旧缓存
9. 依赖版本是否正确
10. 最后再看代码逻辑
```

不要反过来先改业务代码。多数本地问题来自配置、端口、缓存、账号和依赖版本。

