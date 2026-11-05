import CoreGraphics
import Foundation
// prints "<id> <w>x<h> <title>" for each on-screen layer-0 window of the named app
let target = CommandLine.arguments[1].lowercased()
let opts = CGWindowListOption([.optionOnScreenOnly, .excludeDesktopElements])
guard let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else { exit(1) }
for w in list {
    let owner = (w[kCGWindowOwnerName as String] as? String ?? "").lowercased()
    let layer = w[kCGWindowLayer as String] as? Int ?? -1
    let b = w[kCGWindowBounds as String] as? [String: Double] ?? [:]
    if owner == target, layer == 0, (b["Width"] ?? 0) > 400 {
        print(w[kCGWindowNumber as String] as? Int ?? 0, "\(Int(b["Width"] ?? 0))x\(Int(b["Height"] ?? 0))", w[kCGWindowName as String] as? String ?? "")
    }
}
