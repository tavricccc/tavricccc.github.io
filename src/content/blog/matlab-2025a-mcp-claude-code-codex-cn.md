---
title: "MATLAB 2025a + MCP：Claude Code 与 Codex 配置笔记"
description: "以 MATLAB R2025a 为例，记录 matlab-mcp-core-server 在 Claude Code 和 Codex 中的配置方式，并讨论如何用 Agent 辅助搭建光伏停车场微电网 Simulink 模型。"
pubDate: 2026-04-25
updatedDate: 2026-04-25
tags: ["MATLAB", "MCP", "Claude Code", "Codex", "AI Coding"]
important: false
importantOrder: 0
lang: "cn"
group: "matlab-2025a-mcp-claude-code-codex"
---

# MATLAB 2025a + MCP：Claude Code 与 Codex 配置笔记

## 前言

我最近在尝试把 MATLAB R2025a 接入 AI Coding 工作流，让 Claude Code / Codex 这类工具不只是生成 MATLAB 代码，而是能够通过 MCP 调用 MATLAB、创建脚本、检查模型，甚至辅助搭建 Simulink 工程。

我的导师总是热衷于 AI 接入专业软件提升效率这件事，所以从去年 5 月起其实就一直在让我探索了。我那个时候借用了我兄弟 Nix 的 Claude，看看能不能用 Claude 生成一个用于光伏停车场 EMS 系统的 Simulink 模型。不过那个时候 AI 的强度远不如现在，生成出来的模型问题很大，不怎么使用 Simscape 模块库，大量使用 MATLAB Function 去组合。说实话效果一般，我做了好久优化，优化方案本身倒是一点，最难受的是后期人工维护和修改困难。我的意思是，我都用 Simulink 了，为什么还要用大量代码组合成一个不三不四的东西。

不过自从用了 MATLAB MCP 后，我实在没想到效果会这么出人意料。因为 Agent 不再只是“给我一段代码”，而是可以调用 MATLAB 去创建模型、检查模型、读回结果，然后继续迭代。它不等于自动完成研究课题，但已经足够作为一个工程助手。

这篇文章还是以配置为主线：先讲 Claude Code 和 Codex / VS Code Codex 怎么接 MATLAB MCP，再讲我更推荐的使用方式：直接让它参与 Simulink 建模。但前提是你要把需求描述清楚，尤其是你要对 Simulink 的一些库、模型边界、信号接口有基本理解。

## 准备工作

需要准备：

- MATLAB R2025a
- matlab-mcp-core-server（后文简称 MCP Server）
- Claude Code 或支持 MCP stdio 的 Codex / VS Code Codex
- 一个固定的 MATLAB 工作目录
- VS Code 里的 MATLAB 扩展（推荐安装，方便看 `.m` 文件、补全、跳转和基础语法检查）

使用我的示例路径：

```text
MATLAB 安装目录：
E:\matlab R2025a

MCP Server：
E:\matlab R2025a\matlab-mcp-core-server-win64.exe

项目工作目录：
E:\PROJECT2\codexmatlabmcp
```

## matlab-mcp-core-server 是什么

仓库地址：

```text
https://github.com/matlab/matlab-mcp-core-server
```

这是 MathWorks 官方提供的 MATLAB MCP Server，可以让支持 MCP 的 AI 工具通过 stdio 调用 MATLAB。常见用途包括：运行 MATLAB 代码、检查脚本、辅助调试、配合 Simulink / MPC 工作流。

我目前更关心的是它在工程流程里的价值：让 Agent 可以把需求拆成 MATLAB 脚本或 Simulink 建模脚本，调用 MATLAB 执行，拿到输出以后继续修改。对微电网、MPC、Simulink 这种反复试结构、试参数、试接口的方向来说，这比单纯聊天生成代码有用得多。

## Claude Code 配置

使用以下命令：

```bash
claude mcp add matlab --transport stdio -- "E:\matlab R2025a\matlab-mcp-core-server-win64.exe" --matlab-root="E:\matlab R2025a" --initialize-matlab-on-startup=true --matlab-display-mode=desktop --initial-working-folder="E:\PROJECT2\codexmatlabmcp"
```

关键参数说明：

```text
matlab
  给这个 MCP Server 起的名字。

--transport stdio
  使用标准输入输出通信。

--matlab-root
  MATLAB 安装目录，不要写到 bin 目录。

--initialize-matlab-on-startup=true
  Claude Code 启动 MCP 时就初始化 MATLAB。

--matlab-display-mode=desktop
  使用 MATLAB 桌面模式，适合 Simulink、绘图和调试。

--initial-working-folder
  MATLAB 启动后的默认工作目录。
```

删除配置：

```bash
claude mcp remove matlab
```

我个人建议先用 Claude Code 做第一轮验证，因为它的 MCP 命令比较直观。确认 MATLAB 能启动、能执行脚本、能打开 Simulink 后，再迁移到 Codex / VS Code Codex 这边会更稳。

## Codex / VS Code Codex 配置思路

Codex 侧的 MCP 配置界面可能会随版本变化，但核心思路和 Claude Code 一样：使用 stdio，command 指向 MCP Server，可选参数放到 args 里。

给出通用 JSON 示例：

```json
{
  "servers": {
    "matlab": {
      "type": "stdio",
      "command": "E:\\matlab R2025a\\matlab-mcp-core-server-win64.exe",
      "args": [
        "--matlab-root=E:\\matlab R2025a",
        "--initialize-matlab-on-startup=true",
        "--matlab-display-mode=desktop",
        "--initial-working-folder=E:\\PROJECT2\\codexmatlabmcp"
      ]
    }
  }
}
```

提醒：

- 如果 Codex 的界面是表单，就把上面的字段拆进去填。
- `command` 填 MCP Server 的 exe 路径。
- `args` 逐行填参数。
- JSON 里 Windows 路径要写成双反斜杠。
- 命令行里可以直接写单反斜杠。

### 让 Codex 检查本地 MCP 配置

如果本地 Codex / VS Code Codex 已经能成功调用 MATLAB，我不建议一上来重新改配置。更稳妥的做法是让 Codex 先读取当前项目或用户配置中的 MCP 设置，然后只做解释和备份。

可以直接把下面这段发给 Codex：

```text
请你先不要修改任何配置文件。

我本地的 MATLAB MCP 方案目前是可用的，请你帮我检查并解释当前 Codex / VS Code Codex 的 MCP 配置。

目标：
1. 搜索当前工作区和用户配置中可能与 MCP 相关的配置文件。
2. 重点查找 matlab、matlab-mcp-core-server、stdio、mcp、servers、command、args 等关键词。
3. 找到后请先只读分析，不要修改。
4. 请解释：
   - MATLAB MCP Server 的 command 指向哪里
   - args 里传了哪些参数
   - matlab-root 是否正确
   - initial-working-folder 是否合理
   - Windows 路径是否存在转义问题
5. 如果发现配置可用，请给我总结当前可行配置。
6. 如果发现潜在问题，请只给建议，不要直接改文件。
7. 最后请给出一个可备份的 MCP 配置片段，方便我写进博客。
```

这个流程的好处是不会把一个已经能用的环境改坏。尤其 Windows 路径、用户配置目录、插件版本这些东西都可能有差异，先读配置、再解释、最后备份，比直接复制网上某段 JSON 更靠谱。

顺便说一句，如果你平时在 VS Code 里写 MATLAB 相关脚本，我建议把 MATLAB 扩展也装上。MCP 负责让 Agent 调 MATLAB，VS Code 扩展则负责让你自己更舒服地读代码、改脚本、看语法提示。两者不是一回事，但配合起来体验会好很多。

## 第一次测试

我把第一次测试分成两层。第一层只验证 MCP 连通性；第二层再进入一个更接近真实工作的 Simulink 建模任务。

### 基础连通性测试

先让 Agent 运行最小命令：

```matlab
version
pwd
```

再测试一个简单绘图：

```matlab
x = 1:10;
y = x.^2;
plot(x, y);
grid on;
title("MCP MATLAB plot test");
```

如果在做 Simulink / 电力系统模型，可以再查一下相关工具箱或模块：

```matlab
which simulink
which powergui
which mpc
```

预期检查点：

- MATLAB 是否真的被 MCP 调起来。
- 当前工作目录是否是配置里的项目目录。
- MATLAB 桌面模式下是否可以绘图。
- `simulink`、`powergui`、`mpc` 是否能定位到对应函数或工具箱。
- 如果某个工具箱不存在，不要急着改 MCP，先确认 MATLAB 本身是否安装了对应组件。

我更推荐用提示词让 Agent 自己做这一步：

```text
请通过 MATLAB MCP 做一次最小连通性测试。

要求：
1. 运行 version 和 pwd。
2. 运行一个简单 plot 测试。
3. 检查 simulink、powergui、mpc 是否可用。
4. 不要修改任何文件。
5. 把每一步的输出和判断结果整理给我。
```

### 微电网 Simulink 建模测试

第二层测试贴近我的实际方向：MATLAB / Simulink / MPC、光伏停车场微电网。

场景先定得很小：海南三亚（选择了一个光照充足晴天多的地点），约 20 个停车位的光伏停车场。系统包括 PV、BESS、停车场聚合负荷、PCC 和外部电网。这里的重点不是先写一个能量平衡脚本就结束，而是验证 MCP 能不能让 Agent 直接参与 Simulink 建模。

不过要提前说清楚：用 Agent 搭 Simulink 模型不是一句“帮我做个微电网”就能结束的。过程通常会比较长，你要不断描述需求、检查模型、指出问题、让它修改。需求越具体，模型越可靠；需求越抽象，最后越容易变成一堆看起来有线连着、但工程意义不清楚的模块。

我会把这个过程拆成几步。注意，第一步之前其实还有一个“第零步”：先让 Agent 进入计划模式。Claude Code 可以用 plan mode，Codex 这边也可以明确要求它先规划、先提问、先确认需求，不要一上来就写脚本和改模型。

```text
阶段 0：启用计划模式，先让 Agent 整理建模方案
阶段 1：明确系统边界和建模粒度
阶段 2：让 Agent 生成 Simulink 建模脚本
阶段 3：运行脚本创建第一版模型
阶段 4：检查模块库、连接关系、信号命名和参数
阶段 5：逐步加入 BESS 控制、PCC 功率统计和 MPC 接口
```

我建议先把下面这段发给 Claude Code 或 Codex，让它先进入“只计划、不修改”的状态：

```text
请先进入计划模式。

在我明确确认之前，不要创建文件，不要修改文件，不要运行会改变模型的 MATLAB 命令。

我想用 MATLAB MCP 辅助搭建一个 Simulink 模型，但请你先帮我规划，不要直接动手。

目标：
1. 先理解我的工程需求。
2. 反问我缺失的关键参数。
3. 判断应该使用哪些 Simulink / Simscape Electrical / Specialized Power Systems 模块。
4. 给出分阶段建模计划。
5. 明确每一阶段要创建什么、检查什么、如何验收。
6. 等我确认计划后，再开始生成 MATLAB 建模脚本。
```

这一步非常关键。很多模型做坏不是因为 AI 不会写脚本，而是因为需求一开始就没讲清楚。你要让它先把问题问出来，把建模边界划出来，再进入实现。

计划模式之后，第一步不是让 Agent 立刻开搭，而是先让它把需求翻译成 Simulink 模型规格：

```text
请先不要创建模型。

我要做一个用于工程验证的光伏停车场微电网 Simulink 模型，请你先帮我整理建模规格。

背景：
- 地点：海南三亚
- 场景：约 20 个停车位的光伏停车场
- 系统包括：PV、BESS、停车场聚合负荷、PCC、外部电网
- 后续希望接入 MPC，用于 BESS 能量管理

建模要求：
1. 先不要做复杂开关级电力电子仿真。
2. 第一版采用平均值模型或简化功率流模型。
3. 请明确每个子系统的输入、输出、参数和单位。
4. 请说明哪些模块建议用 Simscape Electrical，哪些可以先用 Simulink 基础模块或 MATLAB Function。
5. 请给出模型顶层结构，包括：
   - PV 子系统
   - BESS 子系统
   - Load 子系统
   - PCC 计算子系统
   - Grid 子系统
   - Energy Management / MPC 接口
6. 请列出第一版模型需要检查的信号：
   - PV power
   - Load power
   - BESS power
   - SOC
   - PCC power
7. 只做规格整理，不要创建或修改文件。
```

这一步很重要，因为你必须让 Agent 知道你想要的是哪种模型。是开关级模型、平均值模型、功率流模型，还是先用离散时间能量平衡模型？如果这个问题不说清楚，Agent 很可能会乱用模块，甚至用大量 MATLAB Function 把所有东西糊在一起。那样虽然也能跑，但后期维护非常痛苦。

等规格清楚以后，再让 Agent 用 MATLAB 脚本创建 Simulink 模型：

```text
请通过 MATLAB MCP 创建第一版 Simulink 模型。

模型目标：
- 文件名：sanya_pv_parking_microgrid.slx
- 用途：海南三亚约 20 个停车位光伏停车场微电网的第一版工程验证模型
- 建模粒度：简化功率流 / 平均值模型，不做开关级电力电子细节

顶层子系统：
1. PV
2. BESS
3. Parking_Load
4. PCC
5. Grid
6. EMS_MPC_Interface

要求：
1. 使用 MATLAB 脚本创建模型，而不是手工点界面。
2. 尽量优先使用可读性强、后续好维护的 Simulink / Simscape Electrical 模块。
3. 如果某些模块库不确定是否存在，请先用 which、ver 或库查询命令检查。
4. 每个子系统都要有清晰的 Inport / Outport。
5. 所有关键线缆都要命名。
6. 顶层至少能看到 PV、BESS、Load、PCC、Grid 之间的功率关系。
7. 第一版允许用简化模块占位，但必须在注释里写清楚以后要替换成什么。
8. 创建后请保存模型，并运行一次基础检查。
9. 不要声称模型已经完成工程级验证，只说这是第一版可检查模型。
```

这里有一个经验：你最好对 Simulink 的库有基本了解。比如你应该知道自己想用 Simscape Electrical 还是 Simulink 基础模块，知道 PV、BESS、PCC、Grid 大概应该是什么层级，知道哪些地方只是占位，哪些地方必须保留物理意义。AI 可以帮你写建模脚本，但它不能替你定义工程边界。

如果你自己描述不出来，可以先让 AI 反问你：

```text
我现在还不能很好地描述这个 Simulink 模型需求。

请你像一个 MATLAB / Simulink 工程助手一样，反过来问我问题，帮助我把需求补全。

请重点追问：
1. 我希望模型用于什么目的：教学展示、控制策略验证、能量管理、还是电力电子细节仿真？
2. 我希望使用哪些库：Simulink 基础模块、Simscape Electrical、Specialized Power Systems、还是混合方案？
3. PV 是否需要真实 irradiance / temperature 输入？
4. BESS 是否需要 SOC、效率、功率限制、容量限制？
5. 停车场负荷是固定曲线、随机负荷，还是 EV 充电聚合模型？
6. PCC 功率正方向如何定义？
7. 外部电网是理想电源、三相电网，还是只作为功率交换边界？
8. MPC 第一阶段只做接口，还是要直接加入控制器？

最后请把我的回答整理成一段可以直接用于 Simulink 建模的提示词。
```

如果第一版模型创建成功，下一步不是马上加复杂控制，而是做结构检查：

```text
请通过 MATLAB MCP 检查刚才创建的 Simulink 模型。

要求：
1. 列出模型顶层所有子系统。
2. 列出每个子系统的 Inport / Outport。
3. 检查关键线缆是否命名。
4. 检查 PV、BESS、Load、PCC、Grid 的信号方向是否一致。
5. 检查 BESS SOC 是否有上下限。
6. 检查 PCC power 的正负方向是否在模型注释中说明。
7. 如果发现模型结构不合理，请先给修改建议，不要直接大改。
```

最后再把 MPC 接口单独拎出来：

```text
请在现有 Simulink 模型基础上，整理 EMS / MPC 接口设计。

要求：
1. 不要直接实现完整 MPC 控制器。
2. 先定义 MPC 输入：
   - PV power prediction
   - Load power prediction
   - SOC
   - Electricity price 或 grid import limit（如果第一版没有电价，就先留接口）
3. 定义 MPC 输出：
   - BESS power reference
4. 定义约束：
   - SOC min / max
   - BESS charge / discharge power limit
   - PCC import / export limit
5. 定义目标：
   - 减少购电
   - 平滑 PCC 功率
   - 避免电池过度循环
6. 请把这些内容写进模型注释或单独的 README_MPC_Interface.md。
```

这类测试的意义不是证明 Agent 一次就能生成最终论文模型，而是验证它能不能真的参与 Simulink 工程工作流：理解需求、生成建模脚本、创建模型、检查结构、继续迭代。只要这个闭环能跑起来，它的价值就比单纯生成一段 MATLAB 代码大很多。

## 我的建议

- 先用最小命令测试 MCP 是否连通。
- 工作目录固定，不要每次换路径。
- Claude Code 适合作为第一步验证，Codex 配置可在已有可用方案上做只读检查。
- 在 VS Code 里安装 MATLAB 扩展，方便自己审查 Agent 生成的 `.m` 脚本。
- 如果目标是 Simulink 建模，不要只说“帮我搭一个模型”，要说清楚模型用途、库选择、建模粒度、输入输出、信号方向和约束。
- 对光伏停车场微电网这类项目，可以直接让 Agent 创建 Simulink 模型，但要分阶段检查：顶层结构、子系统接口、功率方向、SOC 约束、PCC 定义、MPC 接口。
- 你对 Simulink 库越熟，越容易判断 Agent 用的模块是否合理；如果描述困难，就先让 AI 反问你，把需求整理成提示词再开始建模。

## 小结

MATLAB MCP 的核心配置其实不复杂，最重要的是找准三个路径：MATLAB root、MCP Server exe、项目工作目录。Claude Code 可以用一条命令快速接入；Codex / VS Code Codex 只要支持 stdio MCP，也可以按 command + args 的方式迁移配置。

真正有价值的部分在配置之后：让 Agent 通过 MATLAB MCP 参与 Simulink 工程建模。它可以生成建模脚本、调用 MATLAB 创建模型、检查结构，再根据你的反馈继续修改。但前提是你要把需求说清楚。对 MATLAB / Simulink / MPC 微电网方向来说，好的提示词本质上就是一份小型需求文档，需求越合理、越详细，模型才越可能可靠。
