import React from 'react';
import './Navbar.css';
import { NavbarBrand } from './NavbarBrand';
import { NavbarContent } from './NavbarContent';
import { NavbarItem } from './NavbarItem';

function NavbarComponent({ children }: { children: React.ReactNode }) {
  return <nav className="navbar__container">{children}</nav>;
}

export const Navbar = Object.assign(NavbarComponent, {
  Brand: NavbarBrand,
  Content: NavbarContent,
  Item: NavbarItem
});
