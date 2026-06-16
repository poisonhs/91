//go:build windows

package api

import (
	"syscall"
	"unsafe"

	"github.com/video-site/backend/internal/storageusage"
)

func localDiskStats(path string) (storageusage.DiskStats, error) {
	ptr, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return storageusage.DiskStats{}, err
	}

	var availableBytes uint64
	var capacityBytes uint64
	var totalFreeBytes uint64
	proc := syscall.NewLazyDLL("kernel32.dll").NewProc("GetDiskFreeSpaceExW")
	r1, _, err := proc.Call(
		uintptr(unsafe.Pointer(ptr)),
		uintptr(unsafe.Pointer(&availableBytes)),
		uintptr(unsafe.Pointer(&capacityBytes)),
		uintptr(unsafe.Pointer(&totalFreeBytes)),
	)
	if r1 == 0 {
		return storageusage.DiskStats{}, err
	}

	return storageusage.DiskStats{
		AvailableBytes: int64(availableBytes),
		CapacityBytes:  int64(capacityBytes),
	}, nil
}
