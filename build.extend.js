const fs = require('fs')
const path = require('path')

const parseMd = content => {
  const sectionMap = {}
  let title = '',
    synonyms = [],
    currentSection = null,
    currentLines = []
  const flush = () => {
    if (currentSection) sectionMap[currentSection] = currentLines.join('\n').trim()
  }
  content
    .trim()
    .split('\n')
    .forEach(line => {
      if (line.startsWith('# ')) title = line.slice(2).trim()
      else if (line.startsWith('## ')) {
        flush()
        currentSection = line.slice(3).trim()
        currentLines = []
      } else if (!currentSection && title && line.trim())
        synonyms = line
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      else if (currentSection) currentLines.push(line)
    })
  flush()
  return { title, synonyms, sectionMap }
}

const renderWord = (slug, { title, synonyms, sectionMap }) => {
  let html = `<section id="${slug}" class="word-section">\n  <h2>${title}</h2>\n`
  if (synonyms.length)
    html += `  <ul class="synonyms">\n${synonyms.map(s => `    <li class="know">${s}</li>`).join('\n')}\n  </ul>\n`

  const renderSection = (name, body) => {
    let inner
    if (name === 'Demo') {
      inner = `    <div class="demo-placeholder"><p>Demo coming soon</p></div>`
    } else if (name === 'Examples') {
      inner = `    <ul class="examples-list">\n${body
        .split('\n')
        .filter(l => l.startsWith('- '))
        .map(l => `      <li>${l.slice(2)}</li>`)
        .join('\n')}\n    </ul>`
    } else if (body.toLowerCase().trim() === 'coming soon.') {
      inner = `    <p class="coming-soon">Coming soon.</p>`
    } else {
      inner = body
        .split('\n\n')
        .filter(p => p.trim())
        .map(p => `    <p>${p.trim()}</p>`)
        .join('\n')
    }
    return `  <div class="entry-section">\n    <h3>${name}</h3>\n${inner}\n  </div>`
  }

  ;['Definition', 'Examples', 'Demo', "Claude's Commentary", "Matt's Commentary"].forEach(name => {
    if (sectionMap[name] !== undefined) html += renderSection(name, sectionMap[name]) + '\n'
  })
  return html + '</section>'
}

module.exports = ({ content, pageDir }) => {
  if (!content.includes('{word-sections}') && !content.includes('{sidebar}')) return {}
  const meta = JSON.parse(fs.readFileSync(path.join(pageDir, 'tree.json'), 'utf8'))

  const wordSections = meta
    .map(
      ({ label, slugs }) =>
        `<h2 class="group-label">${label}</h2>\n` +
        slugs
          .map(slug => {
            const mdPath = path.join(pageDir, `${slug}.md`)
            return fs.existsSync(mdPath) ? renderWord(slug, parseMd(fs.readFileSync(mdPath, 'utf8'))) : ''
          })
          .join('\n'),
    )
    .join('\n')

  const sidebar = meta
    .map(
      ({ label, slugs }) =>
        `<div class="nav-group">\n  <div class="nav-label">${label}</div>\n` +
        slugs
          .map(slug => {
            const mdPath = path.join(pageDir, `${slug}.md`)
            if (!fs.existsSync(mdPath)) return ''
            const { title } = parseMd(fs.readFileSync(mdPath, 'utf8'))
            return `  <a href="#${slug}">${title}</a>`
          })
          .join('\n') +
        '\n</div>',
    )
    .join('\n')

  return { 'word-sections': wordSections, sidebar }
}
