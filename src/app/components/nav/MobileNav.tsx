'use client';

import { useState } from 'react';
import { HamburgerMenuButton } from './HamburgerMenuButton';
import { MobileNavDrawer } from './MobileNavDrawer';

export function MobileNav() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <div className="nav__mobile-toggle">
        <HamburgerMenuButton
          isOpen={isDrawerOpen}
          onClick={toggleDrawer}
          ariaLabel="Toggle mobile navigation menu"
        />
      </div>

      <MobileNavDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}
