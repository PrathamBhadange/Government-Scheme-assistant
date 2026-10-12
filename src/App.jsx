
import { useState } from 'react'
import './App.css'

const schemes = [
  {
    title: 'Education Support',
    category: 'Education',
    description: 'Explore financial assistance and scholarship opportunities for students.',
    icon: '🎓',
  },
  {
    title: 'Farmer Welfare',
    category: 'Agriculture',
    description: 'Explore government support and welfare schemes for farmers.',
    icon: '🌱',
  },
  {
    title: 'Women Empowerment',
    category: 'Women',
    description: 'Discover schemes supporting women and their financial independence.',
    icon: '🤝',
  },
]

function App() {
  const [language, setLanguage] = useState('en')
  const [search, setSearch] = useState('')

  const isMarathi = language === 'mr'

  const filteredSchemes = schemes.filter((scheme) =>
    `${scheme.title} ${scheme.category} ${scheme.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home" aria-label="SAARTHi home">
          <span className="brand-icon">S</span>
          <span>
            <strong>SAARTHi</strong>
            <small>Digital Citizen Assistant</small>
          </span>
        </a>

        <label className="language-control">
          <span className="sr-only">Choose language</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="en">English</option>
            <option value="mr">मराठी</option>
          </select>
        </label>
      </header>

      <main id="home">
        <section className="hero">
          <span className="eyebrow">
            {isMarathi
              ? 'सरकारी योजनांसाठी तुमचा डिजिटल साथी'
              : 'YOUR GUIDE TO GOVERNMENT SCHEMES'}
          </span>

          <h1>
            {isMarathi
              ? 'योग्य योजना, योग्य मार्गदर्शन.'
              : 'The right scheme. The right guidance.'}
          </h1>

          <p className="hero-description">
            {isMarathi
              ? 'सरकारी योजना शोधा, पात्रता समजून घ्या आणि आवश्यक कागदपत्रांची तयारी करा.'
              : 'Discover government schemes, understand eligibility and prepare your documents — all in one place.'}
          </p>

          <form
            className="search-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                isMarathi
                  ? 'योजना किंवा गरज शोधा...'
                  : 'Search schemes by name or category...'
              }
              aria-label="Search schemes"
            />
            <button type="submit">
              {isMarathi ? 'योजना शोधा' : 'Find Schemes'}
            </button>
          </form>

          <p className="search-hint">
            {isMarathi
              ? 'शिक्षण • शेती • महिला सक्षमीकरण'
              : 'Education · Agriculture · Women Empowerment'}
          </p>
        </section>

        <section className="features" aria-label="How SAARTHi helps">
          <article className="feature-card">
            <span className="feature-icon">✓</span>
            <h2>Eligibility Guidance</h2>
            <p>Understand scheme criteria and why a scheme may suit you.</p>
          </article>

          <article className="feature-card">
            <span className="feature-icon">▤</span>
            <h2>Document Readiness</h2>
            <p>Know which documents you may need to prepare.</p>
          </article>

          <article className="feature-card">
            <span className="feature-icon">↗</span>
            <h2>Application Assistance</h2>
            <p>Get guided support through the application process.</p>
          </article>
        </section>

        <section className="schemes-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE OPPORTUNITIES</span>
              <h2>
                {isMarathi ? 'योजना एक्सप्लोर करा' : 'Explore schemes'}
              </h2>
            </div>
            <span className="scheme-count">
              {filteredSchemes.length} demo schemes
            </span>
          </div>

          {filteredSchemes.length > 0 ? (
            <div className="scheme-grid">
              {filteredSchemes.map((scheme) => (
                <article className="scheme-card" key={scheme.title}>
                  <span className="scheme-icon" aria-hidden="true">
                    {scheme.icon}
                  </span>
                  <span className="category-label">{scheme.category}</span>
                  <h3>{scheme.title}</h3>
                  <p>{scheme.description}</p>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() =>
                      window.alert(
                        'Demo only: eligibility checking will be added in a later step.',
                      )
                    }
                  >
                    {isMarathi ? 'अधिक जाणून घ्या' : 'Explore scheme'} →
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">⌕</span>
              <h3>No matching demo schemes</h3>
              <p>Try another keyword, such as Education or Agriculture.</p>
              <button type="button" onClick={() => setSearch('')}>
                Clear search
              </button>
            </div>
          )}

          <p className="demo-note">
            These are sample categories for the frontend prototype, not verified
            government scheme listings. Eligibility and application submission
            are not connected yet.
          </p>
        </section>
      </main>

      <footer className="footer">
        <strong>SAARTHi</strong>
        <span>Making government services easier to navigate.</span>
      </footer>
    </div>
  )
}

export default App
