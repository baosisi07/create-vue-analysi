import * as fs from 'fs'
import * as path from 'path'

import deepMerge from './deepMerge'
import sortDependencies from './sortDependencies'

/**
 * Renders a template folder/file to the file system,
 * by recursively copying all files under the `src` directory,
 * with the following exception:
 *   - `_filename` should be renamed to `.filename`
 *   - Fields in `package.json` should be recursively merged
 * @param {string} src source filename to copy
 * @param {string} dest destination filename of the copy operation
 */
function renderTemplate(src, dest) {
  // 检查文件是否存在 
  const stats = fs.statSync(src)
  // 是否为目录
  if (stats.isDirectory()) {
    // skip node_module
    // path.basename(src)返回路径最后一部分
    // path.basename('/foo/bar/baz/asdf/quux.html');
    // Returns: 'quux.html'
    //path.basename('/foo/bar/baz/asdf/quux.html', '.html');
    // Returns: 'quux'
    if (path.basename(src) === 'node_modules') {
      return
    }

    // if it's a directory, render its subdirectories and files recursively
    // recursive不为true时，默认false，创建已存在的目录会报错
    fs.mkdirSync(dest, { recursive: true })
    for (const file of fs.readdirSync(src)) {
      renderTemplate(path.resolve(src, file), path.resolve(dest, file))
    }
    return
  }

  const filename = path.basename(src)
  // fs.existsSync() 文件是否存在
  if (filename === 'package.json' && fs.existsSync(dest)) {
    // merge instead of overwriting
    const existing = JSON.parse(fs.readFileSync(dest, 'utf8'))
    const newPackage = JSON.parse(fs.readFileSync(src, 'utf8'))
    const pkg = sortDependencies(deepMerge(existing, newPackage))
    fs.writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n')
    return
  }

  if (filename.startsWith('_')) {
    // rename `_file` to `.file`
    // path.dirname()返回目录路径
    dest = path.resolve(path.dirname(dest), filename.replace(/^_/, '.'))
  }

  fs.copyFileSync(src, dest)
}

export default renderTemplate
