import AppKit
// px.swift in.png x,y [x,y ...]   hex of each pixel (pixel coords, origin top-left)
// screencapture output is colour-managed: compare samples with each other, not with theme JSON values
let a = CommandLine.arguments
guard let img = NSImage(contentsOfFile: a[1]), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(1) }
let rep = NSBitmapImageRep(cgImage: cg)
for p in a.dropFirst(2) {
    let xy = p.split(separator: ",").map { Int($0)! }
    guard let c = rep.colorAt(x: xy[0], y: xy[1])?.usingColorSpace(.sRGB) else { print(p, "?"); continue }
    print(p, String(format: "#%02x%02x%02x", Int(round(c.redComponent * 255)), Int(round(c.greenComponent * 255)), Int(round(c.blueComponent * 255))))
}
