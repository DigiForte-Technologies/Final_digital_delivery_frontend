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
        const externalUrl = `https://4cf6-2600-3c04-00-f03c-95ff-fecc-2c37.ngrok-free.app/external/sso?shop=${shop}&token=${token}`;
        window.location.href = externalUrl;
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
