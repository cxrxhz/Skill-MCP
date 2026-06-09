# Training Log Debugging Skill

## Purpose
Use this skill when the user provides a training log, shell script, package list, distributed training error, CUDA/NCCL/DeepSpeed error, or Python stack trace.

## Procedure
1. Identify the first real error, not only the final wrapper error.
2. Distinguish warnings from fatal errors.
3. Determine whether the issue is caused by environment mismatch, missing file, dependency conflict, network/NCCL setup, permission problem, dataset format, or code bug.
4. Propose the minimal fix first.
5. If multiple fixes are possible, rank them by probability and invasiveness.

## Output structure
Use the following sections:
- Root error
- Why this happens
- Minimal fix
- Commands to try
- What to check if it still fails

## Safety
Do not recommend destructive commands such as deleting project data unless the user explicitly confirms the target path.
