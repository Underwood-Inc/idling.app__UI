import MessageTickerWithInterval from '../message-ticker/MessageTickerWithInterval';
import Nav from '../nav/Nav';
import './Header.scss';

export default async function Header() {
  return (
    <header className="header">
      <div className="header__nav">
        <Nav />
      </div>
      <MessageTickerWithInterval />
    </header>
  );
}
