//go:build windows

package scriptcrawler

import (
	"os/exec"
	"syscall"
)

func dryRunSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}

func killDryRunProcess(cmd *exec.Cmd) error {
	if cmd == nil || cmd.Process == nil {
		return nil
	}
	return cmd.Process.Kill()
}
