package kvmswitch

import "NanoKVM-Server/service/extensions/kvmswitch/device"

// KVMSwitch is an alias for device.KVMSwitch so callers within this package
// can reference the interface without a separate import.
type KVMSwitch = device.KVMSwitch
