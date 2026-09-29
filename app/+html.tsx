import { ScrollViewStyleReset } from "expo-router/html";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="referrer" content="no-referrer" />
        <script dangerouslySetInnerHTML={{ __html: recoveryBootstrap }} />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

// Runs before app scripts, removes the email fragment, and keeps it only in memory.
// The production CSP must allow this exact inline script by its SHA-256 hash.
const recoveryBootstrap = `(function(){if(location.pathname.replace(/\\/$/,"")==="/recovery"&&location.hash){var p=new URLSearchParams(location.hash.slice(1));history.replaceState(null,"",location.pathname+location.search);window.__gopherRecovery={purpose:p.get("purpose")||"",token:p.get("token")||""};}})();`;

const responsiveBackground = `
body {
  background-color: #f5f5f7;
}
:focus-visible { outline: 2px solid #890020; outline-offset: 3px; }
`;
