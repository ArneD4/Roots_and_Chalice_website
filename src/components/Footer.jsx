import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <span className="footer__logo">⌒ roots&amp;chalice</span>
        <p className="footer__schedule">
          Dinsdag van 21.00 tot 22.30 op
          <br />
          Radio Scorpio 106FM
        </p>
      </div>

      <a className="footer__mail" href="mailto:info@rootsandchalice.be">
        Mail ons @
      </a>
    </footer>
  )
}

export default Footer
