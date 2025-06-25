import { NAV_PATHS } from 'src/lib/routes';
import { LinkTooltip } from '../tooltip/LinkTooltip';
import { InstantLink } from '../ui/InstantLink';

export const GalaxyLink = () => (
  <LinkTooltip
    url={NAV_PATHS.GALAXY}
    enableExtendedPreview
    enableCtrlClick
    isInsideParagraph
  >
    <InstantLink target="_blank" href={NAV_PATHS.GALAXY}>
      Galaxy
    </InstantLink>
  </LinkTooltip>
);
