import { existsSync, mkdirSync, cpSync } from "fs"

async function main() {
  const manifestText = await Bun.file("manifest.json").text()
  const manifest = JSON.parse(manifestText) as { version?: string }

  const version = manifest.version
  if (!version) {
    console.error("manifest.json has no version field, fix that first! >:(")
    process.exit(1)
  }

  console.log(`preparing release for version ${version}...`)

  console.log("running : bun run build")
  const build = Bun.spawn(["bun", "run", "build"], {
    stdout: "inherit",
    stderr: "inherit",
  })

  const code = await build.exited
  if (code !== 0) {
    console.error("build failed, aborting release prep :(")
    process.exit(code)
  }

  const dir = `release-${version}`
  mkdirSync(dir, { recursive: true })

  const files = ["manifest.json", "main.js", "styles.css"] as const

  for (const file of files) {
    if (!existsSync(file)) {
      console.warn(`warning : ${file} does not exist, skipping :(`)
      continue
    }
    const target = `${dir}/${file}`
    cpSync(file, target)
    console.log(`copied ${file} -> ${target}`)
  }

  console.log(`\nrelease folder ready : ${dir}`)
  console.log("upload those three files from that folder as github release assets :D")
}

await main()
