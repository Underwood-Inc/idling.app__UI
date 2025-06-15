import Link from 'next/link';
import { NAV_PATHS } from 'src/lib/routes';
import { LinkTooltip } from '../tooltip/LinkTooltip';

export const GalaxyLink = () => (
  <LinkTooltip
    url={NAV_PATHS.GALAXY}
    enableExtendedPreview
    enableCtrlClick
    isInsideParagraph
  >
    <Link target="_blank" href={NAV_PATHS.GALAXY}>
      Galaxy
    </Link>
  </LinkTooltip>
);
