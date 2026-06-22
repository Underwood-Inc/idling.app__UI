const STANDALONE_GUARD_SCRIPT = `(function(){var s=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true||document.referrer.indexOf("android-app://")>-1;if(!s){window.location.replace("/");}})();`;

/**
 * Blocks regular browser navigation to the radio PWA launch URL.
 * Only standalone (installed PWA) display mode may render the shell.
 */
export function RadioPwaStandaloneGuardScript() {
  return (
    <script
      // eslint-disable-next-line react/no-danger -- synchronous pre-hydration redirect
      dangerouslySetInnerHTML={{ __html: STANDALONE_GUARD_SCRIPT }}
    />
  );
}
