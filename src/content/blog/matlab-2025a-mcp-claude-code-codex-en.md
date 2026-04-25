---
title: "MATLAB 2025a + MCP: Notes on Claude Code and Codex Setup"
description: "A practical note on connecting MATLAB R2025a to Claude Code and Codex with matlab-mcp-core-server, and using an Agent to help build a Simulink model."
pubDate: 2026-04-25
updatedDate: 2026-04-25
tags: ["MATLAB", "MCP", "Claude Code", "Codex", "AI Coding", "EN"]
important: false
importantOrder: 0
lang: "en"
author: "Dan"
group: "matlab-2025a-mcp-claude-code-codex"
---

# MATLAB 2025a + MCP: Notes on Claude Code and Codex Setup

## Preface

Recently I have been trying to connect MATLAB R2025a into my AI coding workflow. The goal is not just to let Claude Code or Codex generate MATLAB code, but to let them actually call MATLAB through MCP, create scripts, inspect models, and help with Simulink engineering work.

My supervisor has always been interested in using AI inside professional engineering software to improve efficiency. Since around May last year, I have been asked to explore this direction. Back then, I borrowed my friend Nix's Claude account and tried to see whether Claude could generate a Simulink model for a PV parking lot EMS system.

The result at that time was not great. AI was much weaker than it is now. The generated model had many problems: it barely used the Simscape library, and instead connected a lot of logic through MATLAB Function blocks. Honestly, the effect was average. I spent a lot of time trying to optimize it, but the most painful part was not even the optimization itself. It was maintenance. The model was hard to read and hard to modify. My feeling was simple: if I am already using Simulink, why should the final model look like a pile of code blocks glued together?

After using MATLAB MCP, the situation became much more interesting. The Agent is no longer just saying "here is some code." It can call MATLAB, create a model, inspect the result, read feedback, and continue iterating. It will not magically finish a research project for you, but it is already useful as an engineering assistant.

This article still follows the setup path first: how to connect MATLAB MCP to Claude Code and Codex / VS Code Codex. Then I will talk about the workflow I actually care about more: using it to help build a Simulink model. The important condition is that you must describe your requirements clearly, especially the model boundary, library choices, signal interfaces, and what kind of Simulink structure you expect.

## Preparation

You need:

- MATLAB R2025a
- matlab-mcp-core-server, which I will call MCP Server below
- Claude Code, or Codex / VS Code Codex with stdio MCP support
- A fixed MATLAB working folder
- The MATLAB extension in VS Code, recommended for reading `.m` files, basic syntax checking, navigation, and editing

My example paths are:

```text
MATLAB installation folder:
E:\matlab R2025a

MCP Server:
E:\matlab R2025a\matlab-mcp-core-server-win64.exe

Project working folder:
E:\PROJECT2\codexmatlabmcp
```

## What is matlab-mcp-core-server?

Repository:

```text
https://github.com/matlab/matlab-mcp-core-server
```

This is the official MATLAB MCP Server from MathWorks. It lets MCP-compatible AI tools call MATLAB through stdio. Common uses include running MATLAB code, checking scripts, helping with debugging, and working with Simulink / MPC workflows.

What I care about most is the engineering workflow: the Agent can turn a requirement into MATLAB scripts or Simulink-building scripts, execute them through MATLAB, inspect the result, and then revise. For microgrid, MPC, and Simulink work, this is much more useful than simply asking AI to write a random MATLAB snippet.

## Claude Code Setup

Use this command:

```bash
claude mcp add matlab --transport stdio -- "E:\matlab R2025a\matlab-mcp-core-server-win64.exe" --matlab-root="E:\matlab R2025a" --initialize-matlab-on-startup=true --matlab-display-mode=desktop --initial-working-folder="E:\PROJECT2\codexmatlabmcp"
```

Key parameters:

```text
matlab
  The name of this MCP Server.

--transport stdio
  Use standard input/output communication.

--matlab-root
  MATLAB installation folder. Do not point it to the bin folder.

--initialize-matlab-on-startup=true
  Initialize MATLAB when Claude Code starts the MCP server.

--matlab-display-mode=desktop
  Use MATLAB desktop mode. This is useful for Simulink, plotting, and debugging.

--initial-working-folder
  The default MATLAB working folder after startup.
```

To remove the configuration:

```bash
claude mcp remove matlab
```

I personally suggest using Claude Code for the first round of verification, because its MCP command is straightforward. Once MATLAB can start, run code, and open Simulink, it is easier to move the same idea to Codex / VS Code Codex.

## Codex / VS Code Codex Setup Idea

The MCP configuration UI on the Codex side may change over time, but the core idea is the same as Claude Code: use stdio, point `command` to the MCP Server executable, and put optional parameters into `args`.

Here is a generic JSON example:

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

Notes:

- If Codex gives you a form UI, split the fields above into that form.
- `command` should point to the MCP Server `.exe`.
- `args` should contain the command-line arguments.
- In JSON, Windows paths need double backslashes.
- In command line usage, a single backslash is fine.

### Let Codex Inspect the Local MCP Config First

If your local Codex / VS Code Codex setup can already call MATLAB successfully, I do not suggest rewriting the config immediately. A safer way is to ask Codex to read the current MCP settings first, explain them, and produce a backup snippet.

You can paste this into Codex:

```text
Please do not modify any configuration files yet.

My local MATLAB MCP setup is currently working. Please help me inspect and explain the current Codex / VS Code Codex MCP configuration.

Goals:
1. Search the current workspace and user configuration folders for possible MCP-related config files.
2. Focus on keywords such as matlab, matlab-mcp-core-server, stdio, mcp, servers, command, and args.
3. After finding them, only analyze them in read-only mode. Do not modify anything.
4. Please explain:
   - Where the MATLAB MCP Server command points to
   - Which arguments are passed in args
   - Whether matlab-root looks correct
   - Whether initial-working-folder is reasonable
   - Whether Windows path escaping has any problem
5. If the config looks usable, summarize the current working setup.
6. If there are potential issues, only give suggestions. Do not directly edit files.
7. Finally, give me a backup MCP configuration snippet that I can put into a blog post.
```

This avoids breaking something that already works. Windows paths, user config folders, and extension versions can all be slightly different. Reading first, explaining second, and backing up last is much safer than blindly copying a random JSON block.

Also, if you usually edit MATLAB scripts in VS Code, install the MATLAB extension. MCP lets the Agent call MATLAB. The VS Code extension helps you read, edit, and review `.m` files more comfortably. They solve different problems, but together the workflow feels much better.

## First Test

I split the first test into two levels. The first level only checks whether MCP can talk to MATLAB. The second level is closer to real work: using the Agent to help with a Simulink model.

### Basic Connectivity Test

Ask the Agent to run:

```matlab
version
pwd
```

Then try a simple plot:

```matlab
x = 1:10;
y = x.^2;
plot(x, y);
grid on;
title("MCP MATLAB plot test");
```

If you work with Simulink or power systems, check the related tools too:

```matlab
which simulink
which powergui
which mpc
```

Things to check:

- Whether MATLAB is actually started through MCP.
- Whether the current folder is the configured project folder.
- Whether plotting works in desktop mode.
- Whether `simulink`, `powergui`, and `mpc` can be found.
- If a toolbox cannot be found, do not blame MCP first. Check whether that MATLAB component is installed.

I prefer asking the Agent to do this directly:

```text
Please run a minimal MATLAB MCP connectivity test.

Requirements:
1. Run version and pwd.
2. Run a simple plot test.
3. Check whether simulink, powergui, and mpc are available.
4. Do not modify any files.
5. Summarize the output and your judgment for each step.
```

### Simulink Modeling Test for a Microgrid

The second test is closer to my actual direction: MATLAB / Simulink / MPC for a PV parking lot microgrid.

Keep the scene small first: Sanya, Hainan, around 20 parking spaces with PV canopies. The system includes PV, BESS, aggregated parking lot load, PCC, and the external grid. The point here is not just to make an energy-balance script. The point is to see whether MCP can let the Agent directly participate in Simulink modeling.

One thing should be clear: asking an Agent to build a Simulink model is not as simple as saying "make me a microgrid." The process can be long. You need to describe requirements, inspect the model, point out problems, and ask it to revise. The more concrete your requirement is, the more reliable the model becomes. If the requirement is vague, you may end up with a model that has wires everywhere but no clear engineering meaning.

I would split the process like this:

```text
Stage 0: Enable plan mode and let the Agent design the modeling plan first
Stage 1: Define system boundary and modeling granularity
Stage 2: Let the Agent generate a Simulink-building MATLAB script
Stage 3: Run the script to create the first model
Stage 4: Check library choices, connections, signal names, and parameters
Stage 5: Gradually add BESS control, PCC power calculation, and MPC interface
```

Before Stage 1, I recommend asking Claude Code or Codex to enter planning mode:

```text
Please enter plan mode first.

Before I explicitly confirm the plan, do not create files, do not modify files, and do not run MATLAB commands that change the model.

I want to use MATLAB MCP to help build a Simulink model, but please plan first instead of acting immediately.

Goals:
1. Understand my engineering requirement first.
2. Ask me for any missing key parameters.
3. Decide which Simulink / Simscape Electrical / Specialized Power Systems modules should be used.
4. Give me a staged modeling plan.
5. For each stage, explain what will be created, what will be checked, and how it will be accepted.
6. Wait for my confirmation before generating the MATLAB modeling script.
```

This step matters. Many models fail not because AI cannot write scripts, but because the requirement was unclear from the beginning. Let the Agent ask questions, draw the boundary, and only then start implementation.

After the planning step, ask it to turn the requirement into a Simulink model specification:

```text
Do not create the model yet.

I want to build a Simulink model for engineering validation of a PV parking lot microgrid. Please first help me write the modeling specification.

Background:
- Location: Sanya, Hainan
- Scenario: PV parking lot with around 20 parking spaces
- System includes: PV, BESS, aggregated parking lot load, PCC, and external grid
- Later I want to connect MPC for BESS energy management

Modeling requirements:
1. Do not build a detailed switching-level power electronics model at the first stage.
2. Use an average-value model or simplified power-flow model for the first version.
3. Clearly define the inputs, outputs, parameters, and units of each subsystem.
4. Explain which parts should use Simscape Electrical, and which parts can temporarily use basic Simulink blocks or MATLAB Function.
5. Give the top-level model structure, including:
   - PV subsystem
   - BESS subsystem
   - Load subsystem
   - PCC calculation subsystem
   - Grid subsystem
   - Energy Management / MPC interface
6. List the key signals to check in the first version:
   - PV power
   - Load power
   - BESS power
   - SOC
   - PCC power
7. Only write the specification. Do not create or modify files.
```

This step is important because you need to tell the Agent what kind of model you want. Is it a switching-level model, an average-value model, a power-flow model, or a discrete-time energy-balance model? If you do not say this clearly, the Agent may use modules randomly, or hide everything inside MATLAB Function blocks. That may run, but it will be painful to maintain.

Once the specification is clear, ask the Agent to create the first Simulink model through a MATLAB script:

```text
Please create the first Simulink model through MATLAB MCP.

Model target:
- File name: sanya_pv_parking_microgrid.slx
- Purpose: first engineering-validation model for a PV parking lot microgrid in Sanya, Hainan, with around 20 parking spaces
- Modeling granularity: simplified power-flow / average-value model, not detailed switching-level power electronics

Top-level subsystems:
1. PV
2. BESS
3. Parking_Load
4. PCC
5. Grid
6. EMS_MPC_Interface

Requirements:
1. Create the model using a MATLAB script, not manual clicking.
2. Prefer readable and maintainable Simulink / Simscape Electrical blocks when possible.
3. If you are unsure whether a block library exists, check it first using which, ver, or library inspection commands.
4. Each subsystem must have clear Inport and Outport blocks.
5. All important signal lines should be named.
6. At the top level, the power relationship among PV, BESS, Load, PCC, and Grid should be visible.
7. The first version may use simplified placeholder blocks, but comments must explain what should replace them later.
8. Save the model after creation and run a basic check.
9. Do not claim the model is fully validated. Only call it a first inspectable version.
```

Here is my honest advice: you should have some basic knowledge of Simulink libraries. You should know whether you want Simscape Electrical, basic Simulink blocks, Specialized Power Systems, or a mixed approach. You should know roughly what PV, BESS, PCC, and Grid should mean in your model. AI can write the modeling script, but it cannot define the engineering boundary for you.

If you cannot describe the requirement clearly, ask AI to question you first:

```text
I cannot describe this Simulink model requirement clearly yet.

Please act like a MATLAB / Simulink engineering assistant and ask me questions to help me complete the requirement.

Please focus on:
1. What is the model for: teaching demo, control strategy validation, energy management, or detailed power electronics simulation?
2. Which libraries should be used: basic Simulink blocks, Simscape Electrical, Specialized Power Systems, or a mixed approach?
3. Does PV need real irradiance / temperature inputs?
4. Does BESS need SOC, efficiency, power limits, and capacity limits?
5. Is the parking lot load a fixed curve, random load, or aggregated EV charging model?
6. How should the positive direction of PCC power be defined?
7. Is the external grid an ideal source, a three-phase grid, or only a power-exchange boundary?
8. Should MPC be only an interface in the first stage, or should the controller be implemented immediately?

Finally, please turn my answers into a prompt that can be used directly for Simulink modeling.
```

If the first model is created successfully, do not rush into complex control. First inspect the structure:

```text
Please inspect the Simulink model that was just created through MATLAB MCP.

Requirements:
1. List all top-level subsystems.
2. List the Inport and Outport blocks of each subsystem.
3. Check whether key signal lines are named.
4. Check whether the signal direction among PV, BESS, Load, PCC, and Grid is consistent.
5. Check whether BESS SOC has upper and lower limits.
6. Check whether the positive direction of PCC power is explained in model comments.
7. If the model structure is unreasonable, give suggestions first. Do not make major edits directly.
```

Then separate the MPC interface:

```text
Please organize the EMS / MPC interface design based on the current Simulink model.

Requirements:
1. Do not implement a full MPC controller directly.
2. Define MPC inputs first:
   - PV power prediction
   - Load power prediction
   - SOC
   - Electricity price or grid import limit, if price is not available in the first version, leave an interface
3. Define MPC output:
   - BESS power reference
4. Define constraints:
   - SOC min / max
   - BESS charge / discharge power limit
   - PCC import / export limit
5. Define objectives:
   - Reduce grid purchase
   - Smooth PCC power
   - Avoid excessive battery cycling
6. Put these notes into model comments or a separate README_MPC_Interface.md.
```

The point of this test is not to prove that an Agent can generate a final research-grade model in one shot. The point is to check whether it can participate in a real Simulink workflow: understand requirements, generate modeling scripts, create a model, inspect structure, and revise based on feedback. If this loop works, it is already much more useful than just generating a MATLAB code block.

## My Suggestions

- First run the smallest possible MCP connectivity test.
- Keep the MATLAB working folder fixed.
- Use Claude Code for the first verification if possible, then inspect and reuse the working config in Codex.
- Install the MATLAB extension in VS Code, so you can review generated `.m` scripts more comfortably.
- If your goal is Simulink modeling, do not only say "build me a model." Explain the purpose, library choices, modeling granularity, inputs, outputs, signal direction, and constraints.
- For a PV parking lot microgrid, it is reasonable to directly let the Agent create a Simulink model, but inspect it in stages: top-level structure, subsystem interfaces, power direction, SOC constraints, PCC definition, and MPC interface.
- The more you understand Simulink libraries, the easier it is to judge whether the Agent's model is reasonable. If you cannot describe the requirement well, ask AI to interview you first and turn your answers into a usable prompt.

## Summary

The core MATLAB MCP setup is not complicated. The most important part is getting three paths right: MATLAB root, MCP Server executable, and the project working folder. Claude Code can connect with one command. Codex / VS Code Codex can follow the same stdio MCP idea with `command` and `args`.

The real value comes after the setup. With MATLAB MCP, an Agent can help with Simulink engineering work: generate modeling scripts, call MATLAB to create the model, inspect the structure, and revise based on your feedback. For MATLAB / Simulink / MPC microgrid work, a good prompt is basically a small requirement document. The clearer and more reasonable your requirement is, the more reliable the model can become.
