const brand = document.querySelector('header .brand')
const a = Object.assign(document.createElement('a'), { href: '/' })
brand.replaceWith(a)
a.appendChild(brand)

document.querySelector('header .button')?.remove()

const links = document.querySelectorAll('#sidebar a')
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      links.forEach(l => l.classList.toggle('active', l.hash === `#${entry.target.id}`))
    })
  },
  { rootMargin: '-10% 0px -80% 0px' },
)
document.querySelectorAll('section[id]').forEach(s => observer.observe(s))
