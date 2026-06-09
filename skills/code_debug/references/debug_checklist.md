# Debug Checklist

- Look for the earliest stack trace line from user code.
- Check CUDA, PyTorch, flash-attn, transformer, deepspeed, and Python version compatibility.
- For distributed failures, inspect MASTER_ADDR, MASTER_PORT, NCCL_SOCKET_IFNAME, NCCL_IB_DISABLE, and visible GPU count.
- For data errors, inspect JSONL fields, file paths, permissions, and preprocessing cache format.
- For OOM, inspect batch size, max sequence length, frame count, gradient checkpointing, and ZeRO stage.
