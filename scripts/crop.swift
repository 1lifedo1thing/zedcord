import AppKit
// crop.swift in.png out.png x y w h   (pixel coords, origin top-left)
let a = CommandLine.arguments
guard let img = NSImage(contentsOfFile: a[1]), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(1) }
let r = CGRect(x: Double(a[3])!, y: Double(a[4])!, width: Double(a[5])!, height: Double(a[6])!)
guard let c = cg.cropping(to: r) else { exit(2) }
let rep = NSBitmapImageRep(cgImage: c)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
