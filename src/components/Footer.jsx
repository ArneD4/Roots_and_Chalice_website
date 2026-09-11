import './Footer.css'
import Button from './Button'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <span className="footer__logo">            <img src="/logo/horizontal.svg" alt="logo_horizontal" srcSet="/logo/horizontal.svg" /></span>
        <p className="footer__schedule">
          Dinsdag van 21.00 tot 22.30 op
          <br />
          <img src="/Scorpio_Logo.svg" alt="Radio Scorpio 106FM" srcSet="/Scorpio_Logo.svg" />

        </p>
      </div>
          <Button variant="primary" icon="Mail" content="Mail ons" href="mailto:contact@rootsandchalice.be" aria-label="Mail ons" />
    </footer>
  )
}

export default Footer
