import { useEffect } from "react";

export default function ExternalSSO() {
  useEffect(() => {
    async function fetchTokenAndRedirect() {
      try {
        const response = await fetch('/api/sso-token');
        if (!response.ok) {
          throw new Error('Failed to fetch SSO token');
        }
        const { token, shop } = await response.json();
        const externalUrl = `https://shopify-digital-download.fly.dev/external/sso?shop=${shop}&token=${token}`;

        // Open in a new tab
        window.open(externalUrl, '_blank');
      } catch (err) {
        console.error(err);
      }
    }
    fetchTokenAndRedirect();
  }, []);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      Redirecting to External Dashboard...
    </div>
  );
}
